// Single source of truth for supported locales. `code` doubles as both the
// i18next language key and the URL path segment (e.g. /pt-br/simulator), so
// it must stay URL-safe and match the folder name under src/locales/<code>.
// `english` is the language switcher's "no-translation" fallback name.
export const DEFAULT_LOCALE = "en";

export const LOCALES = [
  { code: "en", native: "English", english: "English", rtl: false },
  { code: "es", native: "Español", english: "Spanish", rtl: false },
  { code: "pt-br", native: "Português (Brasil)", english: "Portuguese (Brazil)", rtl: false },
  { code: "fr", native: "Français", english: "French", rtl: false },
  { code: "de", native: "Deutsch", english: "German", rtl: false },
  { code: "it", native: "Italiano", english: "Italian", rtl: false },
  { code: "hi", native: "हिन्दी", english: "Hindi", rtl: false },
  { code: "ja", native: "日本語", english: "Japanese", rtl: false },
  { code: "ko", native: "한국어", english: "Korean", rtl: false },
  { code: "zh-cn", native: "简体中文", english: "Chinese (Simplified)", rtl: false },
  { code: "ar", native: "العربية", english: "Arabic", rtl: true },
  { code: "ur", native: "اردو", english: "Urdu", rtl: true },
  { code: "ru", native: "Русский", english: "Russian", rtl: false },
  { code: "id", native: "Bahasa Indonesia", english: "Indonesian", rtl: false },
];

export const SUPPORTED_LOCALE_CODES = LOCALES.map((l) => l.code);
export const NON_DEFAULT_LOCALE_CODES = SUPPORTED_LOCALE_CODES.filter((c) => c !== DEFAULT_LOCALE);
export const RTL_LOCALE_CODES = LOCALES.filter((l) => l.rtl).map((l) => l.code);

export function isSupportedLocale(code) {
  return SUPPORTED_LOCALE_CODES.includes(code);
}

export function localeInfo(code) {
  return LOCALES.find((l) => l.code === code) || LOCALES[0];
}

export const LOCALE_STORAGE_KEY = "ascendancy_locale";

// "/es/simulator" -> "/simulator", "/simulator" -> "/simulator" (unchanged),
// "/es" -> "/". Used by the language switcher to compute the bare path
// before re-prefixing it with the newly chosen locale.
export function stripLocalePrefix(pathname) {
  const match = pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(\/.*)?$/i);
  if (match && isSupportedLocale(match[1].toLowerCase())) {
    return match[2] || "/";
  }
  return pathname;
}
