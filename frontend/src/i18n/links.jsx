import React, { useCallback } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DEFAULT_LOCALE } from "./locales";

// Current locale is read from i18n.language (kept in sync by LocaleGate /
// RootLocaleRedirect on every route change), not re-derived from the URL
// here — so these helpers work identically for any component in the tree.
export function useLocalePrefix() {
  const { i18n } = useTranslation();
  const lang = i18n.language || DEFAULT_LOCALE;
  return lang === DEFAULT_LOCALE ? "" : `/${lang}`;
}

// Prefixes an absolute in-app path ("/simulator") with the current locale
// ("/es/simulator"). Leaves external URLs, mailto/tel links, hashes, and
// relative paths alone. A bare "/" collapses to just the prefix (or "/" in
// English, where the prefix is empty).
export function localizePath(path, prefix) {
  if (!path || typeof path !== "string") return path;
  if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(path) || path.startsWith("mailto:") || path.startsWith("tel:") || path.startsWith("#")) {
    return path;
  }
  if (!path.startsWith("/")) return path;
  if (!prefix) return path;
  return path === "/" ? prefix : `${prefix}${path}`;
}

export function useLocalizedPath(path) {
  const prefix = useLocalePrefix();
  return localizePath(path, prefix);
}

export function useLocalizedNavigate() {
  const navigate = useNavigate();
  const prefix = useLocalePrefix();
  return useCallback(
    (to, options) => {
      if (typeof to === "string") navigate(localizePath(to, prefix), options);
      else navigate(to, options); // delta (number) or Partial<Path> — pass through
    },
    [navigate, prefix],
  );
}

// Drop-in replacements for react-router-dom's Link/NavLink that
// automatically prefix in-app "to" targets with the active locale.
export function LocalizedLink({ to, ...rest }) {
  return <Link to={useLocalizedPath(to)} {...rest} />;
}

export function LocalizedNavLink({ to, ...rest }) {
  return <NavLink to={useLocalizedPath(to)} {...rest} />;
}
