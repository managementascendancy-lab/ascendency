import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import Reveal from "@/components/Reveal";
import HudPanel from "@/components/HudPanel";
import AscensionRing from "@/components/AscensionRing";
import PerformanceChart from "@/components/PerformanceChart";
import ClassificationMarker from "@/components/ClassificationMarker";
import AscButton from "@/components/AscButton";
import api from "@/lib/api";
import { heroById, heroByIndex, HEROES } from "@/data/heroes";
import { useAuth } from "@/context/AuthContext";
import { Sep } from "@/components/Sep";
import { heroSrcSet } from "@/lib/heroImage";

function Stat({ label, value, color = "text-cream" }) {
  return (
    <div className="border border-bronze/30 bg-navy px-4 py-3">
      <div className="tech-label text-gold-bright">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-700 ${color}`}>{value}</div>
    </div>
  );
}

function nextAscension(user) {
  const idx = user.highestHeroIndex;
  if (idx >= HEROES.length - 1) return { next: null, progress: 100 };
  const next = heroByIndex(idx + 1);
  const w = next.minWpm ? Math.min(user.bestWpm / next.minWpm, 1) : 1;
  const a = next.minAccuracy ? Math.min(user.bestAccuracy / next.minAccuracy, 1) : 1;
  const c = next.minConsistency ? Math.min(user.bestConsistency / next.minConsistency, 1) : 1;
  return { next, progress: Math.round(Math.min(w, a, c) * 100) };
}

export default function Profile() {
  const { user, checking } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api
      .get("/profile")
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user]);

  if (checking) return <div className="py-24 text-center font-mono text-sm text-sage">SYNCING CONSOLE...</div>;

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-14 text-center">
        <SEO title="Ascendant Profile | Ascendancy" description="View your ascendant profile, performance data and ascension progress." />
        <span className="tech-label text-red">NO SIMULATIONS RECORDED.</span>
        <p className="font-body text-cream/60">Authenticate to activate your Ascendant Console.</p>
        <Link to="/auth"><AscButton variant="red" data-testid="profile-auth-btn">ACCESS NETWORK →</AscButton></Link>
      </div>
    );
  }

  const profile = data?.user || user;
  const hero = heroById(profile.currentHero);
  const { next, progress } = nextAscension(profile);
  const history = data?.history || [];
  const wpmData = history.map((h) => Math.round(h.wpm));
  const accData = history.map((h) => Math.round(h.accuracy));
  const consData = history.map((h) => Math.round(h.consistency));

  return (
    <div className="py-14">
      <SEO title={`${profile.username} — Ascendant Profile | Ascendancy`} description="Your ascendant profile, performance data and ascension progress." />

      <Reveal>
        <span className="tech-label text-gold-bright">ASCENDANT CONSOLE</span>
        <div className="mt-2 flex items-center gap-4">
          <ClassificationMarker index={profile.highestHeroIndex} active size={48} />
          <h1 className="font-display text-4xl font-700 tracking-tight text-cream display-outline sm:text-5xl">
            {profile.username}
          </h1>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* current hero + ascension */}
        <Reveal>
          <HudPanel type="primary" label="CURRENT CLASSIFICATION" status="ACTIVE" bodyClassName="p-0">
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
              <AscensionRing progress={progress} label={hero.name} sublabel={next ? `NEXT: ${next.name}` : "MAX"} size={140} />
              <div className="flex-1">
                <div className="tech-label text-gold-bright">ASCENSION PROGRESS</div>
                {next ? (
                  <>
                    <div className="mt-1 font-display text-2xl font-700 text-gold-bright">{progress}%</div>
                    <div className="tech-label mt-1 text-cream/70">NEXT: {next.name}</div>
                    <p className="mt-2 font-body text-xs text-cream/50">
                      Requires {next.minWpm} WPM · {next.minAccuracy}% ACC · {next.minConsistency}% CNS
                    </p>
                  </>
                ) : (
                  <div className="mt-1 font-display text-xl font-700 text-red">ASCENSION COMPLETE</div>
                )}
              </div>
            </div>
          </HudPanel>
        </Reveal>

        {/* stats grid */}
        <Reveal delay={100}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="BEST WPM" value={profile.bestWpm} color="text-gold-bright" />
            <Stat label="AVG WPM" value={profile.averageWpm} color="text-gold" />
            <Stat label="BEST ACC" value={`${profile.bestAccuracy}%`} color="text-sage" />
            <Stat label="AVG ACC" value={`${profile.averageAccuracy}%`} color="text-sage" />
            <Stat label="BEST CNS" value={`${profile.bestConsistency}%`} color="text-cream" />
            <Stat label="STREAK" value={`${profile.streak}d`} color="text-red" />
            <Stat label="SIMULATIONS" value={profile.totalTests} color="text-cream" />
            <Stat label="CHARS TYPED" value={profile.totalCharacters} color="text-cream" />
            <Stat label="SCORE" value={profile.leaderboardScore} color="text-red" />
          </div>
        </Reveal>
      </div>

      {/* charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Reveal>
          <HudPanel type="secondary" bodyClassName="p-5">
            <PerformanceChart data={wpmData} color="#F5C542" label="WPM HISTORY" />
          </HudPanel>
        </Reveal>
        <Reveal delay={80}>
          <HudPanel type="secondary" bodyClassName="p-5">
            <PerformanceChart data={accData} color="#8AA073" label="ACCURACY HISTORY" unit="%" />
          </HudPanel>
        </Reveal>
        <Reveal delay={160}>
          <HudPanel type="secondary" bodyClassName="p-5">
            <PerformanceChart data={consData} color="#C88900" label="CONSISTENCY" unit="%" />
          </HudPanel>
        </Reveal>
      </div>

      {loading && <div className="mt-6 font-mono text-xs text-sage">LOADING PERFORMANCE DATA...</div>}
    </div>
  );
}
