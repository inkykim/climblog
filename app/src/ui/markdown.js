// Tiny dependency-free markdown-subset renderer.
// Covers: ## / ### headings, paragraphs, **bold**, *italic*, `code`,
// [links](url), ![images](src), > blockquotes, -/1. lists, --- rules.
// ALL raw HTML is escaped before any transform — unknown syntax degrades to
// plain text and can never break or script the page.

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(s) {
  return s
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) =>
      /^https?:\/\/|^[\w./-]+$/.test(src) ? `<img src="${src}" alt="${alt}" loading="lazy" />` : `![${alt}](${src})`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) =>
      /^https?:\/\/|^#|^[\w./-]+$/.test(href) ? `<a href="${href}">${text}</a>` : `[${text}](${href})`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export function renderMarkdown(text) {
  const blocks = esc(text.trim()).split(/\n\s*\n/);
  const out = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    const first = lines[0];

    if (/^###\s/.test(first)) { out.push(`<h3>${inline(first.slice(4))}</h3>`); continue; }
    if (/^##\s/.test(first)) { out.push(`<h2>${inline(first.slice(3))}</h2>`); continue; }
    if (/^(---|\*\*\*)\s*$/.test(first) && lines.length === 1) { out.push("<hr />"); continue; }

    if (lines.every((l) => /^&gt;\s?/.test(l))) {
      out.push(`<blockquote>${inline(lines.map((l) => l.replace(/^&gt;\s?/, "")).join(" "))}</blockquote>`);
      continue;
    }
    if (lines.every((l) => /^[-*]\s/.test(l))) {
      out.push(`<ul>${lines.map((l) => `<li>${inline(l.replace(/^[-*]\s/, ""))}</li>`).join("")}</ul>`);
      continue;
    }
    if (lines.every((l) => /^\d+[.)]\s/.test(l))) {
      out.push(`<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+[.)]\s/, ""))}</li>`).join("")}</ol>`);
      continue;
    }
    out.push(`<p>${inline(lines.join(" "))}</p>`);
  }
  return out.join("\n");
}
