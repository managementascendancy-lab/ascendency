import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";
import Reveal from "@/components/Reveal";
import HudPanel from "@/components/HudPanel";
import AscensionRing from "@/components/AscensionRing";
import PerformanceChart from "@/components/PerformanceChart";
import ClassificationMarker from "@/components/ClassificationMarker";
import AscButton from "@/components/AscButton";
import api from "@/lib/api";
import { heroById, heroByIndex, HEROES, getLocaleHeroProgress } from "@/data/heroes";
import { useTranslatedHero } from "@/data/useTranslatedHero";
import { useAuth } from "@/context/AuthContext";
import { useSound } from "@/context/SoundContext";
import { Sep } from "@/components/Sep";
import { heroSrcSet } from "@/lib/heroImage";
import { LocalizedLink, useLocalizedNavigate } from "@/i18n/links";

function Stat({ label, value, color = "text-cream" }) {
  return (
    <div className="border border-bronze/30 bg-navy px-4 py-3">
      <div className="tech-label text-gold-bright">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-700 ${color}`}>{value}</div>
    </div>
  );
}

function nextAscension(user, idx) {
  if (idx >= HEROES.length - 1) return { next: null, progress: 100 };
  const next = heroByIndex(idx + 1);
  const w = next.minWpm ? Math.min(user.bestWpm / next.minWpm, 1) : 1;
  const a = next.minAccuracy ? Math.min(user.bestAccuracy / next.minAccuracy, 1) : 1;
  const c = next.minConsistency ? Math.min(user.bestConsistency / next.minConsistency, 1) : 1;
  return { next, progress: Math.round(Math.min(w, a, c) * 100) };
}

export default function Profile() {
  const { t, i18n } = useTranslation("profile");
  const { user, checking, deleteAccount } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const { play } = useSound();
  const navigate = useLocalizedNavigate();

  useEffect(() => {
    if (!user) return;
    api
      .get("/profile")
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user]);

  const submitDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError("");
    setDeleteBusy(true);
    const res = await deleteAccount(deletePassword);
    setDeleteBusy(false);
    if (res.ok) {
      play("boot");
      navigate("/");
    } else {
      setDeleteError(res.error);
      play("error");
    }
  };

  // Both useTranslatedHero calls must run on every render regardless of
  // auth state (Rules of Hooks) — guard the inputs, not the calls, and only
  // branch on `user`/`checking` after every hook for this render has run.
  const profile = data?.user || user || null;
  const localeProgress = getLocaleHeroProgress(profile, i18n.language);
  const heroRaw = profile ? heroById(localeProgress.currentHero) : null;
  const hero = useTranslatedHero(heroRaw);
  const { next: nextRaw, progress } = profile
    ? nextAscension(profile, localeProgress.highestHeroIndex)
    : { next: null, progress: 0 };
  const next = useTranslatedHero(nextRaw);

  if (checking) return <div className="py-24 text-center font-mono text-sm text-sage">{t("syncingConsole")}</div>;

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-14 text-center">
        <SEO title={t("guest.seo.title")} description={t("guest.seo.description")} />
        <span className="tech-label text-red">{t("guest.noSimulations")}</span>
        <p className="font-body text-cream/60">{t("guest.prompt")}</p>
        <LocalizedLink to="/auth"><AscButton variant="red" data-testid="profile-auth-btn">{t("guest.accessButton")}</AscButton></LocalizedLink>
      </div>
    );
  }

  const history = data?.history || [];
  const wpmData = history.map((h) => Math.round(h.wpm));
  const accData = history.map((h) => Math.round(h.accuracy));
  const consData = history.map((h) => Math.round(h.consistency));

  return (
    <div className="py-14">
      <SEO title={`${profile.username} — Ascendant Profile | Ascendancy`} description={t("seo.description")} />

      <Reveal>
        <span className="tech-label text-gold-bright">{t("ascendantConsole")}</span>
        <div className="mt-2 flex items-center gap-4">
          <ClassificationMarker index={localeProgress.highestHeroIndex} active size={48} />
          <h1 className="font-display text-4xl font-700 tracking-tight text-cream display-outline sm:text-5xl">
            {profile.username}
          </h1>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* current hero + ascension */}
        <Reveal>
          <HudPanel type="primary" label={t("currentClassification.label")} status={t("currentClassification.status")} bodyClassName="p-0">
            <div className="relative aspect-[16/11] overflow-hidden">
              {/* Directly under the H1 in the first panel of the page — likely the LCP
                  element for this route, so intentionally NOT lazy-loaded. */}
              <img
                src={hero.image}
                srcSet={heroSrcSet(hero.image)}
                sizes="(min-width: 1024px) 433px, 100vw"
                alt={hero.name}
                className="h-full w-full object-cover brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4">
                <div className="font-display text-3xl font-700 text-cream">{hero.name}</div>
                <div className="tech-label text-gold-bright">{hero.title}<Sep tone="gold" />{hero.class}</div>
              </div>
            </div>
            <div className="flex items-center gap-5 p-5">
              <AscensionRing progress={progress} label={hero.name} sublabel={next ? t("ascension.next", { name: next.name }) : t("ascension.max")} size={140} />
              <div className="flex-1">
                <div className="tech-label text-gold-bright">{t("ascension.progress")}</div>
                {next ? (
                  <>
                    <div className="mt-1 font-display text-2xl font-700 text-gold-bright">{progress}%</div>
                    <div className="tech-label mt-1 text-cream/70">{t("ascension.next", { name: next.name })}</div>
                    <p className="mt-2 font-body text-xs text-cream/50">
                      {t("ascension.requires", { wpm: next.minWpm, accuracy: next.minAccuracy, consistency: next.minConsistency })}
                    </p>
                  </>
                ) : (
                  <div className="mt-1 font-display text-xl font-700 text-red">{t("ascension.complete")}</div>
                )}
              </div>
            </div>
          </HudPanel>
        </Reveal>

        {/* stats grid */}
        <Reveal delay={100}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label={t("stats.bestWpm")} value={profile.bestWpm} color="text-gold-bright" />
            <Stat label={t("stats.avgWpm")} value={profile.averageWpm} color="text-gold" />
            <Stat label={t("stats.bestAcc")} value={`${profile.bestAccuracy}%`} color="text-sage" />
            <Stat label={t("stats.avgAcc")} value={`${profile.averageAccuracy}%`} color="text-sage" />
            <Stat label={t("stats.bestCns")} value={`${profile.bestConsistency}%`} color="text-cream" />
            <Stat label={t("stats.streak")} value={`${profile.streak}d`} color="text-red" />
            <Stat label={t("stats.simulations")} value={profile.totalTests} color="text-cream" />
            <Stat label={t("stats.charsTyped")} value={profile.totalCharacters} color="text-cream" />
            <Stat label={t("stats.score")} value={profile.leaderboardScore} color="text-red" />
          </div>
        </Reveal>
      </div>

      {/* charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Reveal>
          <HudPanel type="secondary" bodyClassName="p-5">
            <PerformanceChart data={wpmData} color="#F5C542" label={t("charts.wpmHistory")} />
          </HudPanel>
        </Reveal>
        <Reveal delay={80}>
          <HudPanel type="secondary" bodyClassName="p-5">
            <PerformanceChart data={accData} color="#8AA073" label={t("charts.accuracyHistory")} unit="%" />
          </HudPanel>
        </Reveal>
        <Reveal delay={160}>
          <HudPanel type="secondary" bodyClassName="p-5">
            <PerformanceChart data={consData} color="#C88900" label={t("charts.consistency")} unit="%" />
          </HudPanel>
        </Reveal>
      </div>

      {loading && <div className="mt-6 font-mono text-xs text-sage">{t("loadingPerformanceData")}</div>}

      {/* danger zone */}
      <Reveal delay={200}>
        <HudPanel
          type="primary"
          label={<>{t("dangerZone.account")}<Sep tone="red" />{t("dangerZone.heading")}</>}
          status={t("dangerZone.restrictedStatus")}
          className="mt-8"
          bodyClassName="p-5"
        >
          {!deleteOpen ? (
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-body text-sm text-cream/60">{t("dangerZone.description")}</p>
              <AscButton
                variant="red"
                onClick={() => {
                  setDeleteOpen(true);
                  setDeleteError("");
                }}
                data-testid="profile-delete-account-open"
              >
                {t("dangerZone.deleteButton")}
              </AscButton>
            </div>
          ) : (
            <form onSubmit={submitDeleteAccount} className="space-y-3">
              <div className="border border-red/60 bg-red/10 px-3 py-2 font-mono text-xs text-red">
                {t("dangerZone.warning")}
              </div>

              <div>
                <label className="tech-label text-gold-bright">{t("dangerZone.confirmAccessKey")}</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                  autoFocus
                  data-testid="profile-delete-password"
                  className="mt-1 w-full border border-bronze/50 bg-navy px-4 py-3 font-mono text-sm text-cream placeholder:text-cream/35 focus:border-gold-bright focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <label className="flex items-center gap-2 font-mono text-xs text-cream/70">
                <input
                  type="checkbox"
                  checked={deleteConfirmed}
                  onChange={(e) => setDeleteConfirmed(e.target.checked)}
                  data-testid="profile-delete-confirm-checkbox"
                  className="h-4 w-4 border border-bronze/50 bg-navy accent-red"
                />
                {t("dangerZone.confirmCheckbox")}
              </label>

              {deleteError && (
                <div className="border border-red/60 bg-red/10 px-3 py-2 font-mono text-xs text-red" data-testid="profile-delete-error">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3">
                <AscButton
                  type="submit"
                  variant="red"
                  disabled={deleteBusy || !deleteConfirmed || !deletePassword}
                  data-testid="profile-delete-account-confirm"
                >
                  {deleteBusy ? t("dangerZone.erasing") : t("dangerZone.confirmButton")}
                </AscButton>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeletePassword("");
                    setDeleteConfirmed(false);
                    setDeleteError("");
                  }}
                  className="font-mono text-xs text-cream/50 transition-colors hover:text-cream"
                  data-testid="profile-delete-account-cancel"
                >
                  {t("dangerZone.cancel")}
                </button>
              </div>
            </form>
          )}
        </HudPanel>
      </Reveal>
    </div>
  );
}
