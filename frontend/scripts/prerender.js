#!/usr/bin/env node
/**
 * Post-build static prerenderer.
 *
 * Serves the freshly built app locally, drives it with a real headless
 * Chromium (Puppeteer) for a fixed set of content routes, and writes the
 * fully-rendered HTML back into build/ as static <route>/index.html files.
 * React still hydrates on top of this markup on the client — this is purely
 * about giving non-JS crawlers (Bing, link-unfurl bots, etc.) real content
 * instead of an empty <div id="root">.
 *
 * Only content routes are rendered here — authenticated/dynamic pages
 * (/simulator, /profile, /leaderboard, /achievements, /auth) are
 * deliberately left client-only, see routes() below.
 */
const fs = require("fs");
const path = require("path");
const http = require("http");
const puppeteer = require("puppeteer");

const ROOT = path.join(__dirname, "..");
const BUILD_DIR = path.join(ROOT, "build");
const GUIDES_DIR = path.join(ROOT, "src", "content", "guides");
const PORT = 45621;

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};

// Every article slug currently under src/content/guides — read fresh off
// disk each run, so new .md files are picked up automatically with no
// change needed here.
function guideSlugs() {
  if (!fs.existsSync(GUIDES_DIR)) return [];
  return fs
    .readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

function routes() {
  return ["/", "/guides", ...guideSlugs().map((slug) => `/guides/${slug}`)];
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split("?")[0]);
      let filePath = path.join(BUILD_DIR, urlPath);
      if (urlPath.endsWith("/")) filePath = path.join(filePath, "index.html");
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(BUILD_DIR, "index.html"); // SPA fallback, same as nginx's try_files
      }
      const ext = path.extname(filePath);
      res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(PORT, () => resolve(server));
  });
}

async function prerenderRoute(browser, route) {
  const page = await browser.newPage();
  try {
    await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: "networkidle0", timeout: 30000 });
    // Pages are route-split with React.lazy()/Suspense (see App.js), and
    // Home additionally lazy-loads its 3D scanner — every Suspense fallback
    // in the app marks itself with data-loading="true" (see RouteLoader.jsx
    // and HoloScannerFallback in Home.jsx). networkidle0 above almost
    // always already covers this (the lazy chunk fetch is itself a network
    // request), but wait explicitly too so a slow chunk eval never gets
    // snapshotted mid-loading-state.
    await page
      .waitForFunction(() => document.querySelectorAll('[data-loading="true"]').length === 0, { timeout: 15000 })
      .catch(() => {});
    // small settle delay for the entrance animations (Reveal component) to
    // finish mounting their final DOM state
    await new Promise((r) => setTimeout(r, 150));
    const html = await page.content();

    const outDir = route === "/" ? BUILD_DIR : path.join(BUILD_DIR, route);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), html);
    return { route, bytes: html.length, ok: true };
  } catch (err) {
    return { route, ok: false, error: err.message };
  } finally {
    await page.close();
  }
}

async function main() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error("[prerender] build/ not found — run `craco build` first.");
    process.exit(1);
  }

  const routeList = routes();
  console.log(`[prerender] rendering ${routeList.length} route(s): ${routeList.join(", ")}`);

  const server = await startStaticServer();
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const results = [];
  for (const route of routeList) {
    const result = await prerenderRoute(browser, route);
    results.push(result);
    console.log(
      result.ok
        ? `[prerender]  ✓ ${result.route} (${result.bytes} bytes)`
        : `[prerender]  ✗ ${result.route} — ${result.error}`
    );
  }

  await browser.close();
  server.close();

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`[prerender] ${failed.length} route(s) failed to prerender.`);
    process.exit(1);
  }
  console.log(`[prerender] done — ${results.length} route(s) prerendered.`);
}

main().catch((err) => {
  console.error("[prerender] failed:", err);
  process.exit(1);
});
