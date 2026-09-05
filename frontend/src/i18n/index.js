import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LOCALE, SUPPORTED_LOCALE_CODES } from "./locales";

// Auto-discovers every src/locales/<code>/<namespace>.json file at build
// time via webpack's require.context, so adding a new namespace or locale
// file needs no changes here — just drop the JSON file in the right folder.
// A locale missing a given namespace file (or missing individual keys
// within one it has) transparently falls back to English (fallbackLng
// below), rather than i18next throwing or rendering blank.
const context = require.context("../locales", true, /\.json$/);

const resources = {};
const namespaceSet = new Set();

context.keys().forEach((key) => {
  // key looks like "./en/common.json" or "./pt-br/home.json"
  const match = key.match(/^\.\/([^/]+)\/([^/]+)\.json$/);
  if (!match) return;
  const [, locale, namespace] = match;
  namespaceSet.add(namespace);
  resources[locale] = resources[locale] || {};
  resources[locale][namespace] = context(key);
});

export const NAMESPACES = Array.from(namespaceSet);

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: SUPPORTED_LOCALE_CODES,
  ns: NAMESPACES,
  defaultNS: "common",
  interpolation: { escapeValue: false }, // React already escapes
  returnEmptyString: false,
  // Our hyphenated codes (pt-br, zh-cn) are registered lowercase to match
  // their folder names and URL segments. Without this, i18next's internal
  // Intl.getCanonicalLocales() step rewrites them to BCP-47 casing
  // (pt-BR, zh-CN) before checking supportedLngs, that check fails against
  // our lowercase list, and it silently falls all the way through to
  // fallbackLng — i18n.language still reports "pt-br" correctly, but every
  // actual lookup (resolvedLanguage, t()) resolves against English instead.
  lowerCaseLng: true,
});

export default i18n;
