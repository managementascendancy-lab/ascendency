import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";
import Reveal from "@/components/Reveal";
import ClassificationMarker from "@/components/ClassificationMarker";
import api from "@/lib/api";
import { heroById } from "@/data/heroes";
import { useAuth } from "@/context/AuthContext";
import { Sep, Mark } from "@/components/Sep";
import { LocalizedLink } from "@/i18n/links";

const rankColor = (r) => (r === 1 ? "#F5C542" : r === 2 ? "#F5EFE5" : r === 3 ? "#875327" : "#8AA073");

export default function Leaderboard() {
  const { t } = useTranslation("leaderboard");
  const { user } = useAuth();
  const [sort, setSort] = useState("score");
  const [rows, setRows] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const SORTS = [
    { key: "score", label: t("sorts.score") },
    { key: "wpm", label: t("sorts.wpm") },
    { key: "accuracy", label: t("sorts.accuracy") },
  ];

  const load = useCallback(async (s) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/leaderboard?sort=${s}`);
      setRows(data.rows);
      setCurrentId(data.currentUserId);
    } catch (e) {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(sort);
  }, [sort, load, user]);

  return (
    <div className="py-14">
      <SEO title={t("seo.title")} description={t("seo.description")} />

      <Reveal>
        <span className="tech-label text-gold-bright">ASCENDANCY<Sep tone="red" />{t("overline")}</span>
        <div className="relative mt-2 block">
          <h1 className="font-display text-5xl font-700 tracking-tight text-cream display-outline sm:text-6xl">
            {t("heading")}
          </h1>
          <span
            aria-hidden="true"
            className="text-sweep pointer-events-none absolute inset-0 font-display text-5xl font-700 tracking-tight sm:text-6xl"
          >
            {t("heading")}
          </span>
        </div>
        <p className="mt-4 max-w-xl font-body text-cream/70">{t("subtitle")}</p>
      </Reveal>

      <Reveal delay={100}>
        <div className="mt-8 flex items-center gap-2">
          <span className="tech-label text-gold-bright">{t("sortBy")}</span>
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              data-testid={`leaderboard-sort-${s.key}`}
              className={`border px-4 py-1.5 font-display text-xs tracking-[0.15em] transition-colors ${
                sort === s.key ? "border-gold-bright bg-gold-bright text-navy-dark" : "border-bronze/50 text-cream/70 hover:text-cream"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delay={160}>
        <div className="mt-6 border border-bronze/40 bg-navy-dark">
          {/* header */}
          <div className="grid grid-cols-[50px_1fr_70px_70px_90px_80px] items-center gap-2 border-b border-bronze/40 px-4 py-3 sm:grid-cols-[60px_1fr_90px_90px_140px_100px]">
            {[t("columns.rank"), t("columns.ascendant"), t("columns.wpm"), t("columns.acc"), t("columns.hero"), t("columns.score")].map((h) => (
              <span key={h} className="tech-label text-gold-bright">{h}</span>
            ))}
          </div>

          {loading && <div className="px-4 py-10 text-center font-mono text-sm text-sage">{t("loading")}</div>}
          {error && <div className="px-4 py-10 text-center font-mono text-sm text-red">{error}</div>}
          {!loading && !error && rows.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
              <span className="tech-label text-gold-bright">{t("empty")}</span>
              <LocalizedLink to="/simulator" className="tech-label text-gold-bright">{t("beginSimulation")}</LocalizedLink>
            </div>
          )}

          {!loading &&
            !error &&
            rows.map((row) => {
              const hero = heroById(row.hero);
              const isMe = row.id === currentId;
              return (
                <div
                  key={row.id}
                  data-testid={`leaderboard-row-${row.rank}`}
                  className={`group grid grid-cols-[50px_1fr_70px_70px_90px_80px] items-center gap-2 border-b border-navy px-4 py-3 transition-colors sm:grid-cols-[60px_1fr_90px_90px_140px_100px] ${
                    isMe ? "bg-gold/10" : "hover:bg-bronze/10"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-0.5 transition-all group-hover:h-6" style={{ background: rankColor(row.rank) }} />
                    <span className="font-mono text-sm font-700" style={{ color: rankColor(row.rank) }}>
                      {String(row.rank).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="truncate font-display text-sm tracking-wide text-cream">
                    {row.username}
                    {isMe && <span className="ml-2 tech-label text-gold-bright"><Mark tone="gold" />{t("you")}</span>}
                  </span>
                  <span className="font-mono text-sm text-gold-bright">{row.wpm}</span>
                  <span className="font-mono text-sm text-sage">{row.accuracy}%</span>
                  <div className="flex items-center gap-2">
                    <ClassificationMarker index={row.heroIndex} size={24} />
                    <span className="hidden font-display text-xs text-cream/80 sm:inline">{hero.name}</span>
                  </div>
                  <span className="font-mono text-sm font-700 text-red">{row.score}</span>
                </div>
              );
            })}
        </div>
      </Reveal>
    </div>
  );
}
