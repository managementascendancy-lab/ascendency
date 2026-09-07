#!/usr/bin/env node
/**
 * Post-build sitemap generator.
 *
 * Guide article URLs are discovered the exact same way scripts/prerender.js
 * discovers its own guide routes (reading src/content/guides off disk) — so
 * a new guide article needs zero sitemap edits, same as it already needs
 * zero prerender-route edits. Top-level static pages (simulator, leaderboard,
 * privacy-policy, etc.) aren't filesystem content, just entries in App.js's
 * route tree, so — same as prerender.js itself only prerendering content
 * routes and leaving these client-only — they stay a short explicit list
 * below rather than something introspected automatically.
 *
 * Writes straight into build/sitemap.xml (overwriting whatever public/
 * already copied there), so this only needs to run after `craco build`,
 * same timing as the prerender step — see package.json's postbuild script.
 */
const fs = require("fs");
const path = require("path");
const { ABOUT, PRIVACY_POLICY, TERMS_OF_SERVICE } = require("./static-routes");

const ROOT = path.join(__dirname, "..");
const BUILD_DIR = path.join(ROOT, "build");
const GUIDES_DIR = path.join(ROOT, "src", "content", "guides");
const SITE_URL = "https://ascendancytyping.com";
// Build date for every entry — simplest option, and explicitly fine per the
// "using build date for all is fine if that's simpler" instruction, rather
// than fabricating per-article original dates this script has no way to know.
const TODAY = new Date().toISOString().slice(0, 10);

function guideSlugs() {
  if (!fs.existsSync(GUIDES_DIR)) return [];
  return fs
    .readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

// path (no leading content assumed — always relative to SITE_URL), changefreq, priority.
const STATIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/simulator", changefreq: "monthly", priority: "0.9" },
  { path: "/ascendancy", changefreq: "monthly", priority: "0.7" },
  { path: "/leaderboard", changefreq: "daily", priority: "0.6" },
  { path: "/typing-speed-test", changefreq: "monthly", priority: "0.8" },
  { path: "/wpm-test", changefreq: "monthly", priority: "0.8" },
  { path: "/typing-test", changefreq: "monthly", priority: "0.8" },
  { path: "/typing-practice", changefreq: "monthly", priority: "0.8" },
  { path: ABOUT, changefreq: "monthly", priority: "0.5" },
  { path: PRIVACY_POLICY, changefreq: "yearly", priority: "0.3" },
  { path: TERMS_OF_SERVICE, changefreq: "yearly", priority: "0.3" },
];

function buildUrls() {
  const urls = STATIC_ROUTES.map((r) => ({ loc: `${SITE_URL}${r.path}`, changefreq: r.changefreq, priority: r.priority }));
  urls.push({ loc: `${SITE_URL}/guides`, changefreq: "weekly", priority: "0.8" });
  for (const slug of guideSlugs()) {
    urls.push({ loc: `${SITE_URL}/guides/${slug}`, changefreq: "monthly", priority: "0.6" });
  }
  return urls;
}

function renderXml(urls) {
  const entries = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

function main() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error("[sitemap] build/ not found — run `craco build` first.");
    process.exit(1);
  }
  const urls = buildUrls();
  // writeFileSync always fully overwrites — no read-modify-write step, so
  // running this script twice in a row produces byte-identical output
  // rather than appending or duplicating entries.
  fs.writeFileSync(path.join(BUILD_DIR, "sitemap.xml"), renderXml(urls));
  console.log(`[sitemap] wrote ${urls.length} URL(s) to build/sitemap.xml`);
}

main();
