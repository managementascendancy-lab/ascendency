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

function stripHtml(s) {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

// Pulls question/answer pairs straight out of the same rendered HTML the
// page displays (## Frequently Asked Questions, then ### question / <p>
// answer pairs — see the guide content itself), rather than hand-copying
// FAQ text into a separate schema source. That's what guarantees FAQPage
// structured data can never drift from what a reader actually sees.
function extractFaq(html) {
  const start = /<h2>Frequently Asked Questions<\/h2>([\s\S]*)$/.exec(html);
  if (!start) return [];
  const section = start[1].split(/<h2>/)[0];
  const pairs = [];
  const pairRe = /<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = pairRe.exec(section))) {
    pairs.push({ question: stripHtml(m[1]), answer: stripHtml(m[2]) });
  }
  return pairs;
}

export const GUIDES = files
  .keys()
  .map((key) => {
    const raw = files(key);
    const { data, content } = parseFrontmatter(raw);
    const slug = data.slug || slugFromKey(key);
    const html = marked.parse(content);
    return {
      slug,
      title: data.title || slug,
      description: data.description || "",
      date: data.date || null,
      readTime: data.readTime || null,
      author: data.author || null,
      lastUpdated: data.lastUpdated || null,
      image: data.image || null,
      body: content,
      html,
      faq: extractFaq(html),
    };
  })
  .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

export const guideBySlug = (slug) => GUIDES.find((g) => g.slug === slug);

export const GUIDE_SLUGS = GUIDES.map((g) => g.slug);
