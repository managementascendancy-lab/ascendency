#!/usr/bin/env node
/**
 * Single source of truth for top-level pages that are hardcoded React
 * components (not driven by src/content/guides) but still need to be
 * crawler-visible. Shared by prerender.js (renders these to static HTML)
 * and generate-sitemap.js (lists them in sitemap.xml), so adding one only
 * means editing this file instead of two scripts silently drifting apart.
 *
 * Does NOT include "/" or "/guides" — those are structural entry points
 * each script already treats as its own case, not "info pages" like these.
 */
const ABOUT = "/about";
const PRIVACY_POLICY = "/privacy-policy";
const TERMS_OF_SERVICE = "/terms-of-service";

module.exports = { ABOUT, PRIVACY_POLICY, TERMS_OF_SERVICE, ALL: [ABOUT, PRIVACY_POLICY, TERMS_OF_SERVICE] };
