import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { LOCALES, LOCALE_STORAGE_KEY, DEFAULT_LOCALE, stripLocalePrefix } from "@/i18n/locales";
import { useSound } from "@/context/SoundContext";

// Hand-rolled to match the site's bespoke tactical-HUD panel style rather
// than the generic shadcn dropdown primitive (design_guidelines.json is
// explicit: no rounded shadcn cards) — same approach Navbar already uses
// for its own controls.
export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { play } = useSound();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LOCALES.find((l) => l.code === i18n.language) || LOCALES[0];

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const selectLocale = (code) => {
    setOpen(false);
    if (code === i18n.language) return;
    play("click");
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
    const bare = stripLocalePrefix(location.pathname);
    const prefix = code === DEFAULT_LOCALE ? "" : `/${code}`;
    const target = bare === "/" ? prefix || "/" : `${prefix}${bare}`;
    i18n.changeLanguage(code);
    navigate(`${target}${location.search}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          play("hover");
        }}
        aria-label="Change language"
        aria-expanded={open}
        data-testid="language-switcher-trigger"
        className="flex items-center gap-1.5 border border-bronze/50 px-2.5 py-2 font-mono text-[11px] uppercase tracking-wide text-cream/80 transition-colors hover:border-gold-bright hover:text-gold-bright"
      >
        <Globe size={14} />
        <span>{current.code}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-52 overflow-y-auto border border-bronze/50 bg-navy-dark shadow-[4px_4px_0px_#0B0F2A]"
          data-testid="language-switcher-menu"
        >
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitem"
              onClick={() => selectLocale(l.code)}
              data-testid={`language-option-${l.code}`}
              className={`block w-full px-3 py-2 text-left font-body text-sm transition-colors ${
                l.code === current.code
                  ? "bg-gold-bright/10 text-gold-bright"
                  : "text-cream/80 hover:bg-bronze/10 hover:text-cream"
              }`}
            >
              {l.native}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
