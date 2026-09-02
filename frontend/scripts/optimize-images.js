#!/usr/bin/env node
/**
 * One-off image optimizer for hero artwork, the background image, and the
 * guide-article illustrations.
 *
 * Source PNGs live in frontend/src/assets/hero-originals/ and
 * frontend/src/assets/guide-illustrations/ (not served — kept as masters
 * for re-runs when new/updated art arrives). This script regenerates the
 * WebP files consumed at runtime from public/:
 *   - public/heroes/<name>.webp        (1000w — default <img src>, largest srcset entry)
 *   - public/heroes/<name>-600.webp    (600w  — mid srcset entry)
 *   - public/heroes/<name>-300.webp    (300w  — small srcset entry, hero-strip thumbnails)
 *   - public/heroes/<name>-avatar.webp (160w  — tight headshot crop, see AVATAR_* below)
 *   - public/bg-heroes.webp            (capped at 1920w — CSS background-image, no srcset)
 *   - public/guides/<name>-600.webp    (600w  — article-body srcset entry)
 *   - public/guides/<name>-1200.webp   (1200w — default <img src>, largest srcset entry)
 *
 * Not wired into the build — these are static assets, only re-run this
 * manually (`node scripts/optimize-images.js`) when the source art changes.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SOURCE_DIR = path.join(ROOT, "src", "assets", "hero-originals");
const HEROES_OUT = path.join(ROOT, "public", "heroes");
const PUBLIC_DIR = path.join(ROOT, "public");
const GUIDE_ILLUSTRATIONS_SOURCE_DIR = path.join(ROOT, "src", "assets", "guide-illustrations");
const GUIDES_OUT = path.join(PUBLIC_DIR, "guides");

// [suffix, width, quality] — quality tiered by role: small thumbnails can
// take more compression than the large detail/reveal views without a
// visible difference; the large tier is what most of a viewer's attention
// actually lands on, so it gets the least lossy treatment.
const HERO_VARIANTS = [
  { suffix: "-300", width: 300, quality: 75 },
  { suffix: "-600", width: 600, quality: 80 },
  { suffix: "", width: 1000, quality: 85 }, // default src / largest srcset entry
];

// Every hero portrait is composed the same way: face in the upper region
// against a large dark/glow background, full figure filling the rest of
// the square canvas. That reads fine at card size (HeroCard.jsx etc.), but
// squashed into a small ~48px avatar (HeroProgressionStrip.jsx) the face
// becomes illegible and only the bright power-effect glow reads — which
// *looks* like the character got cropped even though the full square image
// is technically all there (1:1 box on a 1:1 source = no crop at all).
// This variant crops a tight square headshot instead of shrinking the
// whole-body composition: top-aligned (never risks cutting off a raised
// hand/helmet above the head) and centered horizontally at 60% of the
// source width (wide enough to keep off-center faces in frame across all
// 10 heroes without per-hero tuning).
const AVATAR_WIDTH_FRACTION = 0.6;
const AVATAR_OUTPUT_WIDTH = 160;
const AVATAR_QUALITY = 82;

const BG_MAX_WIDTH = 1920;
const BG_QUALITY = 70; // decorative, rendered at 25% opacity under a scrim + grid overlay in AscendancyGrid.jsx — safe to compress hard

// Landscape article-body diagrams — resized by width only (no crop), since
// these are instructional line-art/text illustrations where the whole
// composition matters, unlike the hero portraits above. Quality is higher
// than the hero tiers because fine gauge/label linework shows compression
// artifacts more readily than photographic hero art does.
const GUIDE_ILLUSTRATION_VARIANTS = [
  { suffix: "-600", width: 600, quality: 82 },
  { suffix: "-1200", width: 1200, quality: 85 },
];

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(0)}KB`;
}

async function optimizeHero(file) {
  const name = path.basename(file, ".png");
  const srcPath = path.join(SOURCE_DIR, file);
  const srcBytes = fs.statSync(srcPath).size;
  const results = [];
  for (const v of HERO_VARIANTS) {
    const outPath = path.join(HEROES_OUT, `${name}${v.suffix}.webp`);
    await sharp(srcPath).resize(v.width, v.width, { fit: "cover" }).webp({ quality: v.quality }).toFile(outPath);
    results.push({ file: path.relative(ROOT, outPath), bytes: fs.statSync(outPath).size, width: v.width, quality: v.quality });
  }
  return { name, srcBytes, results };
}

async function optimizeHeroAvatar(file) {
  const name = path.basename(file, ".png");
  const srcPath = path.join(SOURCE_DIR, file);
  const meta = await sharp(srcPath).metadata();
  const cropSize = Math.round(meta.width * AVATAR_WIDTH_FRACTION);
  const left = Math.round((meta.width - cropSize) / 2);
  const outPath = path.join(HEROES_OUT, `${name}-avatar.webp`);
  await sharp(srcPath)
    .extract({ left, top: 0, width: cropSize, height: cropSize })
    .resize(AVATAR_OUTPUT_WIDTH, AVATAR_OUTPUT_WIDTH)
    .webp({ quality: AVATAR_QUALITY })
    .toFile(outPath);
  return { file: path.relative(ROOT, outPath), bytes: fs.statSync(outPath).size };
}

async function optimizeGuideIllustration(file) {
  const name = path.basename(file, ".png");
  const srcPath = path.join(GUIDE_ILLUSTRATIONS_SOURCE_DIR, file);
  const srcBytes = fs.statSync(srcPath).size;
  const results = [];
  for (const v of GUIDE_ILLUSTRATION_VARIANTS) {
    const outPath = path.join(GUIDES_OUT, `${name}${v.suffix}.webp`);
    await sharp(srcPath).resize({ width: v.width }).webp({ quality: v.quality }).toFile(outPath);
    results.push({ file: path.relative(ROOT, outPath), bytes: fs.statSync(outPath).size, width: v.width, quality: v.quality });
  }
  return { name, srcBytes, results };
}

async function optimizeBackground() {
  const srcPath = path.join(SOURCE_DIR, "bg-heroes.png");
  const srcBytes = fs.statSync(srcPath).size;
  const meta = await sharp(srcPath).metadata();
  const targetWidth = Math.min(meta.width, BG_MAX_WIDTH);
  const outPath = path.join(PUBLIC_DIR, "bg-heroes.webp");
  await sharp(srcPath).resize({ width: targetWidth }).webp({ quality: BG_QUALITY }).toFile(outPath);
  return { srcBytes, outBytes: fs.statSync(outPath).size, width: targetWidth };
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`[optimize-images] source dir not found: ${SOURCE_DIR}`);
    process.exit(1);
  }
  fs.mkdirSync(HEROES_OUT, { recursive: true });

  const heroFiles = fs.readdirSync(SOURCE_DIR).filter((f) => f.endsWith(".png") && f !== "bg-heroes.png");
  console.log(`[optimize-images] converting ${heroFiles.length} hero image(s)...`);

  for (const file of heroFiles) {
    const { name, srcBytes, results } = await optimizeHero(file);
    console.log(`  ${name}.png (${fmtKB(srcBytes)}) ->`);
    for (const r of results) {
      console.log(`    ${path.basename(r.file)} — ${r.width}w q${r.quality} — ${fmtKB(r.bytes)}`);
    }
    const avatar = await optimizeHeroAvatar(file);
    console.log(`    ${path.basename(avatar.file)} — ${AVATAR_OUTPUT_WIDTH}w q${AVATAR_QUALITY} (headshot crop) — ${fmtKB(avatar.bytes)}`);
  }

  if (fs.existsSync(path.join(SOURCE_DIR, "bg-heroes.png"))) {
    console.log(`[optimize-images] converting bg-heroes.png...`);
    const bg = await optimizeBackground();
    console.log(`  bg-heroes.png (${fmtKB(bg.srcBytes)}) -> bg-heroes.webp ${bg.width}w q${BG_QUALITY} — ${fmtKB(bg.outBytes)}`);
  }

  if (fs.existsSync(GUIDE_ILLUSTRATIONS_SOURCE_DIR)) {
    fs.mkdirSync(GUIDES_OUT, { recursive: true });
    const guideFiles = fs.readdirSync(GUIDE_ILLUSTRATIONS_SOURCE_DIR).filter((f) => f.endsWith(".png"));
    console.log(`[optimize-images] converting ${guideFiles.length} guide illustration(s)...`);
    for (const file of guideFiles) {
      const { name, srcBytes, results } = await optimizeGuideIllustration(file);
      console.log(`  ${name}.png (${fmtKB(srcBytes)}) ->`);
      for (const r of results) {
        console.log(`    ${path.basename(r.file)} — ${r.width}w q${r.quality} — ${fmtKB(r.bytes)}`);
      }
    }
  }

  console.log("[optimize-images] done.");
}

main().catch((err) => {
  console.error("[optimize-images] failed:", err);
  process.exit(1);
});
