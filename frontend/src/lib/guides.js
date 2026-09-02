import { marked } from "marked";

// Loads every markdown file in src/content/guides at build time (webpack
// require.context), so new articles are picked up automatically on the next
// build — no registration step beyond adding the .md file.
const files = require.context("../content/guides", false, /\.md$/);

// Minimal frontmatter parser for flat `key: value` pairs — avoids pulling in
// gray-matter, which depends on Node's Buffer and isn't safe to assume works
// in a CRA5/Webpack5 browser bundle without extra polyfill config.
function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, content: raw };
  const [, fm, content] = match;
  const data = {};
  fm.split(/\r?\n/).forEach((line) => {
    const m = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!m) return;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    data[m[1]] = val;
  });
  return { data, content: content.trim() };
}

function slugFromKey(key) {
  return key.replace(/^\.\//, "").replace(/\.md$/, "");
}

export const GUIDES = files
  .keys()
  .map((key) => {
    const raw = files(key);
    const { data, content } = parseFrontmatter(raw);
    const slug = data.slug || slugFromKey(key);
    return {
      slug,
      title: data.title || slug,
      description: data.description || "",
      date: data.date || null,
      readTime: data.readTime || null,
      body: content,
      html: marked.parse(content),
    };
  })
  .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

export const guideBySlug = (slug) => GUIDES.find((g) => g.slug === slug);

export const GUIDE_SLUGS = GUIDES.map((g) => g.slug);
