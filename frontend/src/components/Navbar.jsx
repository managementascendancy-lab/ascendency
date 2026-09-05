import React from "react";
import { useTranslation } from "react-i18next";
import { Volume2, VolumeX, LogOut } from "lucide-react";
import { useSound } from "@/context/SoundContext";
import { useAuth } from "@/context/AuthContext";
import { LocalizedLink, LocalizedNavLink, useLocalizedNavigate } from "@/i18n/links";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Navbar() {
  const { t } = useTranslation();
  const { enabled, toggle, play } = useSound();
  const { user, logout } = useAuth();
  const navigate = useLocalizedNavigate();

  const NAV = [
    { to: "/", key: "home", label: t("nav.home"), end: true },
    { to: "/simulator", key: "simulator", label: t("nav.simulator") },
    { to: "/ascendancy", key: "ascendancy", label: t("nav.ascendancy") },
    { to: "/leaderboard", key: "leaderboard", label: t("nav.leaderboard") },
    { to: "/guides", key: "guides", label: t("nav.guides") },
    { to: "/profile", key: "my-profile", label: t("nav.profile") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-bronze/40 bg-navy-dark/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1040px] items-center justify-between px-4 py-3 sm:px-8">
        <LocalizedLink to="/" className="group flex flex-col leading-none" data-testid="brand-logo">
          <span className="font-display text-xl font-700 tracking-[0.12em] text-cream transition-colors group-hover:text-gold-bright">
            ASCEND<span className="text-red transition-colors group-hover:text-gold-bright">ANCY</span>
          </span>
          <span className="tech-label mt-0.5 text-[9px] text-gold-bright">{t("nav.brandTag")}</span>
        </LocalizedLink>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <LocalizedNavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onMouseEnter={() => play("hover")}
              onClick={() => play("click")}
              data-testid={`nav-${n.key}`}
              className={({ isActive }) =>
                `relative whitespace-nowrap px-4 py-2 font-display text-xs tracking-[0.15em] transition-colors ${
                  isActive ? "text-gold-bright" : "text-cream/70 hover:text-cream"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {n.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 h-[2px] w-6 -translate-x-1/2 bg-red" />
                  )}
                </>
              )}
            </LocalizedNavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse-ring bg-sage" />
            <span className="tech-label text-sage">{t("nav.online")}</span>
          </div>

          <LanguageSwitcher />

          <button
            onClick={() => {
              toggle();
              play("toggle");
            }}
            aria-label={enabled ? t("nav.muteSound") : t("nav.enableSound")}
            data-testid="sound-toggle"
            className="border border-bronze/50 p-2 text-cream/80 transition-colors hover:border-gold-bright hover:text-gold-bright"
          >
            {enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden font-mono text-xs text-gold-bright sm:inline" data-testid="nav-username">
                {user.username}
              </span>
              <button
                onClick={() => {
                  logout();
                  play("click");
                  navigate("/");
                }}
                aria-label={t("nav.logout")}
                data-testid="logout-btn"
                className="border border-bronze/50 p-2 text-cream/80 transition-colors hover:border-red hover:text-red"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <LocalizedLink
              to="/auth"
              onClick={() => play("click")}
              data-testid="nav-login"
              className="border border-bronze/50 px-4 py-2 font-display text-xs tracking-[0.15em] text-cream/80 transition-colors hover:border-gold-bright hover:text-gold-bright"
            >
              {t("nav.access")}
            </LocalizedLink>
          )}
        </div>
      </nav>
    </header>
  );
}
