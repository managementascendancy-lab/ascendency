import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, RTL_LOCALE_CODES, isSupportedLocale } from "./locales";

function applyDocumentLocale(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LOCALE_CODES.includes(lang) ? "rtl" : "ltr";
}

function readStoredLocale() {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    return null; // private-browsing / storage blocked — degrade to no preference
  }
}

function writeStoredLocale(lang) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, lang);
  } catch {
    /* ignore — nothing to persist to */
  }
}

// Element for the /:lang parent route. An unsupported code (typo, stale
// link, crawler noise) falls back to the equivalent unprefixed English
// path rather than rendering content under a bogus locale.
export function LocaleGate() {
  const { lang } = useParams();
  const location = useLocation();
  const { i18n } = useTranslation();
  const valid = isSupportedLocale(lang);

  useEffect(() => {
    if (!valid) return;
    if (i18n.language !== lang) i18n.changeLanguage(lang);
    writeStoredLocale(lang);
    applyDocumentLocale(lang);
    // Deliberately keyed on [lang, valid] only, not on i18n itself: this
    // must sync when the ROUTE's own :lang param changes, not on every
    // languageChanged event i18n fires. Depending on i18n made this effect
    // re-run (and re-assert lang, clobbering both i18n.language and stored
    // preference) any time something else — e.g. the language switcher —
    // changed the language while this route was still mid-transition out,
    // permanently reverting the switch and, on the home route specifically,
    // sending RootLocaleRedirect's stored-preference check back to the old
    // locale too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, valid]);

  if (!valid) {
    const rest = location.pathname.replace(new RegExp(`^/${lang}`), "") || "/";
    return <Navigate to={rest + location.search} replace />;
  }

  return <Outlet />;
}

// Element wrapping the entire unprefixed route tree. Forces i18n back to
// English on every render of this tree, independent of whatever locale
// was active before a client-side navigation landed here. Without this,
// arriving at an unprefixed route straight from a :lang-prefixed one left
// i18n's language stuck on the old locale: LocaleGate's own effect reacts
// to every languageChanged event (not just to its own [lang] param
// changing) and re-asserts its route's locale whenever it notices a
// mismatch, so the switcher's changeLanguage("en") call could get
// reverted back to the old locale before LocaleGate finished unmounting —
// and nothing downstream ever corrected it again. This gate is that
// correction, and it runs unconditionally on every mount here, so it wins
// regardless of that ordering.
// Deliberately does NOT touch stored locale preference — landing on an
// unprefixed URL isn't an explicit locale choice the way visiting
// /es/... is (see LocaleGate), so it must not clobber a returning
// visitor's stored non-English preference.
export function DefaultLocaleGate({ children }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== DEFAULT_LOCALE) i18n.changeLanguage(DEFAULT_LOCALE);
    applyDocumentLocale(DEFAULT_LOCALE);
  });

  return children;
}

// Element for the unprefixed "/" route only (NOT the whole English route
// tree — every other unprefixed URL is an existing indexed link and must
// never redirect, full stop). A returning visitor with a stored non-English
// preference lands on their locale's homepage instead of English; anyone
// arriving with no stored preference, or with "en" stored, just sees Home.
// i18n sync itself is handled by the enclosing DefaultLocaleGate.
export function RootLocaleRedirect({ children }) {
  const stored = readStoredLocale();
  if (stored && stored !== DEFAULT_LOCALE && isSupportedLocale(stored)) {
    return <Navigate to={`/${stored}`} replace />;
  }

  return children;
}
