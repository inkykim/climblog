#!/usr/bin/env python3
"""Validate climblog entries against their JSON Schemas.

Runs in CI on every push/PR (and locally). Emits GitHub Actions error
annotations and exits non-zero if any entry is invalid, so a schema-invalid
entry can never silently land in the dataset.

Checks per file:
  1. frontmatter parses
  2. frontmatter validates against the record type's JSON Schema
  3. frontmatter `id` matches the filename stem
  4. symptom observations reference an injury_id that actually exists
"""
import datetime
import glob
import json
import os
import sys

import frontmatter
from jsonschema import Draft202012Validator, FormatChecker

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# directory (relative to repo root) -> schema file (relative to repo root)
TARGETS = {
    "entries/load-events": "schema/load-event.schema.json",
    "entries/symptom-observations": "schema/symptom-observation.schema.json",
    "injuries": "schema/injury.schema.json",
    "gyms": "schema/gym.schema.json",
    "posts": "schema/post.schema.json",
}


def normalize(value):
    """Coerce YAML-parsed dates/datetimes back to ISO strings.

    PyYAML turns an unquoted `date: 2026-07-19` into a datetime.date, which
    would fail a JSON Schema `"type": "string"`. Normalizing here means users
    don't have to quote dates in frontmatter.
    """
    if isinstance(value, (datetime.date, datetime.datetime)):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: normalize(v) for k, v in value.items()}
    if isinstance(value, list):
        return [normalize(v) for v in value]
    return value


def load_validator(schema_rel):
    with open(os.path.join(ROOT, schema_rel)) as f:
        schema = json.load(f)
    return Draft202012Validator(schema, format_checker=FormatChecker())


def annotate(path, msg, line=1):
    rel = os.path.relpath(path, ROOT)
    print(f"::error file={rel},line={line}::{msg}")


def collect_ids(subdir):
    ids = set()
    for path in glob.glob(os.path.join(ROOT, subdir, "*.md")):
        try:
            meta = normalize(frontmatter.load(path).metadata)
        except Exception:
            continue
        if isinstance(meta.get("id"), str):
            ids.add(meta["id"])
    return ids


def main():
    failed = False
    injury_ids = collect_ids("injuries")
    gym_ids = collect_ids("gyms")

    for subdir, schema_rel in TARGETS.items():
        validator = load_validator(schema_rel)
        for path in sorted(glob.glob(os.path.join(ROOT, subdir, "*.md"))):
            try:
                meta = normalize(frontmatter.load(path).metadata)
            except Exception as e:
                annotate(path, f"could not parse frontmatter: {e}")
                failed = True
                continue

            for err in sorted(validator.iter_errors(meta), key=lambda e: list(e.path)):
                loc = "/".join(map(str, err.path)) or "(root)"
                annotate(path, f"{loc}: {err.message}")
                failed = True

            stem = os.path.splitext(os.path.basename(path))[0]
            if meta.get("id") != stem:
                annotate(path, f"frontmatter id '{meta.get('id')}' does not match filename stem '{stem}'")
                failed = True

            if subdir.endswith("symptom-observations"):
                ref = meta.get("injury_id")
                if ref and ref not in injury_ids:
                    annotate(path, f"injury_id '{ref}' does not match any injury in injuries/")
                    failed = True

            if subdir.endswith("load-events"):
                ref = meta.get("gym_id")
                if ref and ref not in gym_ids:
                    annotate(path, f"gym_id '{ref}' does not match any gym in gyms/")
                    failed = True

            if subdir == "posts":
                ref = meta.get("injury_id")
                if ref and ref not in injury_ids:
                    annotate(path, f"injury_id '{ref}' does not match any injury in injuries/")
                    failed = True

    if failed:
        print("::error::climblog validation failed — see annotations above")
        sys.exit(1)
    print("All climblog entries valid.")


if __name__ == "__main__":
    main()
