import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import { useTranslation } from "react-i18next";
import AscensionRing from "@/components/AscensionRing";
import ClassificationMarker from "@/components/ClassificationMarker";
import AscButton from "@/components/AscButton";
import ShareCard from "@/components/ShareCard";
import CertificateCard from "@/components/CertificateCard";
import { useSound } from "@/context/SoundContext";
import { Sep, Mark } from "@/components/Sep";
import { heroSrcSet } from "@/lib/heroImage";
import { useTranslatedHero } from "@/data/useTranslatedHero";
import { heroByIndex } from "@/data/heroes";

const UNLOCK_STEP_MS = 750;

function InstagramIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// stage: 0 = SIMULATION COMPLETE, 1 = ANALYZING, 2 = REVEAL
export default function HeroReveal({
  hero,
  result,
  nextHero,
  ascensionProgress = 0,
  flags = {},
  user,
  onRetry,
}) {
  const { t } = useTranslation("simulator");
  const heroT = useTranslatedHero(hero);
  const unlockedHeroes = (flags.newlyUnlockedIndices || []).map(heroByIndex);
  // 0 = SIMULATION COMPLETE, 1 = ANALYZING, 2 = UNLOCKING (only when
  // unlockedHeroes.length > 0 — a single run can cross several
  // classifications at once), 3 = full REVEAL.
  const [stage, setStage] = useState(0);
  const [unlockStep, setUnlockStep] = useState(0);
  const unlockingHero = useTranslatedHero(unlockedHeroes[unlockStep] || null);
  const [sharing, setSharing] = useState(false);
  const [sharingIg, setSharingIg] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const cardRef = useRef(null);
  const certRef = useRef(null);
  const sound = useSound();
  const certId = React.useMemo(
    () => `ASC-${result.score}-${Date.now().toString(36).toUpperCase()}`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const flashMsg = (msg) => {
    setShareMsg(msg);
    setTimeout(() => setShareMsg(""), 4500);
  };

  // captures a rasterized offscreen node into a downloadable/shareable File
  const captureNode = async (node, filename) => {
    const canvas = await html2canvas(node, { backgroundColor: null, scale: 3, useCORS: true });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return null;
    return new File([blob], filename, { type: "image/png" });
  };

  const captureCard = () => captureNode(cardRef.current, `ascendancy-${hero.id}.png`);

  const downloadCertificate = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const file = await captureCard();
      if (!file) return;
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      flashMsg(t("reveal.messages.certificateSaved"));
    } finally {
      setDownloading(false);
    }
  };

  const downloadProfessionalCertificate = async () => {
    if (!certRef.current || downloadingCert) return;
    setDownloadingCert(true);
    try {
      const file = await captureNode(certRef.current, `ascendancy-wpm-certificate-${hero.id}.png`);
      if (!file) return;
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      flashMsg(t("reveal.messages.wpmCertificateSaved"));
    } finally {
      setDownloadingCert(false);
    }
  };

  const shareResult = async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);
    const link = `${window.location.origin}/simulator`;
    try {
      // link goes to the clipboard regardless of how the image gets shared,
      // so it's ready to paste into a Story/Status link sticker either way.
      await navigator.clipboard.writeText(link).catch(() => {});

      const file = await captureCard();
      if (!file) return;
      const shareData = { files: [file], title: "ASCENDANCY", text: t("reveal.shareText", { name: hero.name }) };

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share(shareData);
          flashMsg(t("reveal.messages.shareLinkStorySticker"));
        } catch {
          /* user cancelled the share sheet */
        }
      } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        flashMsg(t("reveal.messages.shareImageDownloaded"));
      }
    } finally {
      setSharing(false);
    }
  };

  const shareToInstagramStory = async () => {
    if (!cardRef.current || sharingIg) return;
    setSharingIg(true);
    const link = `${window.location.origin}/simulator`;
    try {
      await navigator.clipboard.writeText(link).catch(() => {});
      const file = await captureCard();
      if (!file) return;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "ASCENDANCY", text: t("reveal.shareText", { name: hero.name }) });
          flashMsg(t("reveal.messages.igPickInstagram"));
        } catch {
          /* user cancelled the share sheet */
        }
      } else {
        // desktop Instagram has no share integration at all — download is the only path
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        flashMsg(t("reveal.messages.igNeedsPhone"));
      }
    } finally {
      setSharingIg(false);
    }
  };

  useEffect(() => {
    const timers = [];
    timers.push(
      setTimeout(() => {
        setStage(1);
        sound?.play("analyze");
      }, 900)
    );

    if (unlockedHeroes.length > 0) {
      // Step through every newly-crossed hero one at a time before the
      // final full reveal, so a multi-tier jump is legible as a sequence
      // rather than just landing on the last classification.
      unlockedHeroes.forEach((_, i) => {
        timers.push(
          setTimeout(() => {
            setStage(2);
            setUnlockStep(i);
            sound?.play(i === 0 ? "reveal" : "click");
          }, 2600 + i * UNLOCK_STEP_MS)
        );
      });
      timers.push(
        setTimeout(() => {
          setStage(3);
          sound?.play("reveal");
        }, 2600 + unlockedHeroes.length * UNLOCK_STEP_MS)
      );
    } else {
      timers.push(
        setTimeout(() => {
          setStage(3);
          sound?.play("reveal");
        }, 2600)
      );
    }

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-dark/95 backdrop-blur-sm" data-testid="hero-reveal">
      <div className="absolute inset-0 asc-grid opacity-30" />

      {/* offscreen card rasterized for Instagram/story sharing */}
      <div style={{ position: "fixed", left: -9999, top: 0, pointerEvents: "none" }} aria-hidden="true">
        <ShareCard ref={cardRef} hero={hero} result={result} />
      </div>

      {/* offscreen landscape certificate rasterized for the WPM certificate download */}
      <div style={{ position: "fixed", left: -9999, top: 0, pointerEvents: "none" }} aria-hidden="true">
        <CertificateCard
          ref={certRef}
          result={result}
          recipientName={user?.username ? user.username.toUpperCase() : t("reveal.guestAscendant")}
          certId={certId}
        />
      </div>

      <AnimatePresence mode="wait">
        {stage < 2 ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-6 px-6 text-center"
          >
            <div className="font-display text-2xl font-700 tracking-[0.2em] text-cream sm:text-4xl">
              {stage === 0 ? t("reveal.stageComplete") : t("reveal.stageAnalyzing")}
            </div>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  className="h-8 w-1 bg-gold-bright"
                  animate={{ scaleY: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12 }}
                />
              ))}
            </div>
            <div className="space-y-1 font-mono text-[11px] text-sage">
              <div>{t("reveal.log1")}</div>
              {stage === 1 && <div>{t("reveal.log2")}</div>}
              {stage === 1 && <div className="text-gold-bright">{t("reveal.log3")}</div>}
            </div>
          </motion.div>
        ) : stage === 2 ? (
          <motion.div
            key={`unlock-${unlockStep}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 flex flex-col items-center gap-4 px-6 text-center"
            data-testid="hero-unlock-step"
          >
            <span className="tech-label text-gold-bright">
              {t("reveal.unlockProgressLabel", { current: unlockStep + 1, total: unlockedHeroes.length })}
            </span>
            <div className="relative h-40 w-40 overflow-hidden panel-clip-primary border border-gold-bright/60 sm:h-52 sm:w-52">
              <img
                src={unlockedHeroes[unlockStep]?.image}
                srcSet={heroSrcSet(unlockedHeroes[unlockStep]?.image)}
                sizes="208px"
                alt={unlockedHeroes[unlockStep]?.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-transparent to-transparent" />
            </div>
            <div className="font-display text-3xl font-700 tracking-wide text-cream sm:text-4xl">
              {unlockedHeroes[unlockStep]?.name}
            </div>
            <span className="tech-label text-red">{t("reveal.unlockedBadge")}</span>
            <p className="max-w-xs font-body text-xs text-cream/60">{unlockingHero.title}</p>
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 grid max-h-[92vh] w-full max-w-[1100px] gap-6 overflow-y-auto px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
          >
            {/* hero visual */}
            <motion.div
              initial={{ clipPath: "inset(0 100% 0 0)", filter: "grayscale(1) brightness(0.3)" }}
              animate={{ clipPath: "inset(0 0% 0 0)", filter: "grayscale(0) brightness(0.95)" }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[3/4] overflow-hidden panel-clip-primary border border-gold-bright/60"
            >
              <img
                src={hero.image}
                srcSet={heroSrcSet(hero.image)}
                sizes="(min-width: 1024px) 500px, 100vw"
                alt={hero.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-transparent to-navy-dark/40" />
              <div className="absolute left-3 top-3 tech-label text-gold-bright">{t("reveal.heroProfileIdentified")}</div>
              <div className="absolute bottom-3 left-3">
                <ClassificationMarker index={hero.index} active size={40} />
              </div>
              {flags.isNewClassification && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                  className="absolute right-3 top-3 border border-red bg-navy-dark px-2 py-1 tech-label text-red"
                >
                  {t("reveal.newClassification")}
                </motion.div>
              )}
            </motion.div>

            {/* data */}
            <div className="flex flex-col justify-center">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <span className="tech-label text-gold">{t("reveal.classificationComplete")}</span>
                <h2 className="font-display text-5xl font-700 tracking-wide text-cream display-outline sm:text-6xl">
                  {hero.name}
                </h2>
                <p className="tech-label mt-1 text-gold-bright">{heroT.title}<Sep tone="gold" />{heroT.class}</p>
                <p className="mt-3 max-w-md font-body text-sm text-cream/70">{heroT.description}</p>
                <p className="mt-2 font-mono text-xs text-sage">
                  <span className="text-gold-bright">{t("reveal.powerLabel")}</span><Sep tone="sage" />{heroT.power}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-5 grid grid-cols-2 gap-px border border-bronze/40 bg-bronze/40 sm:grid-cols-4"
              >
                {[
                  [t("metrics.wpm"), Math.round(result.wpm), "text-gold-bright"],
                  [t("metrics.accuracy"), `${result.accuracy.toFixed(0)}%`, "text-sage"],
                  [t("metrics.consistency"), `${Math.round(result.consistency)}%`, "text-cream"],
                  [t("reveal.scoreLabel"), result.score, "text-red"],
                ].map(([k, v, c]) => (
                  <div key={k} className="bg-navy-dark px-3 py-3">
                    <div className="tech-label text-highlight">{k}</div>
                    <div className={`mt-1 font-mono text-xl font-700 ${c}`}>{v}</div>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 flex items-center gap-5"
              >
                <AscensionRing
                  progress={ascensionProgress}
                  label={hero.name}
                  sublabel={nextHero ? t("reveal.nextLabel", { name: nextHero.name }) : t("reveal.maxAscension")}
                  size={150}
                />
                <div className="flex-1">
                  <div className="tech-label text-gold-bright">{t("reveal.ascensionProgress")}</div>
                  <p className="mt-2 font-body text-sm text-cream/70">
                    {nextHero ? t("reveal.advanceToward", { name: nextHero.name }) : t("reveal.apexReached")}
                  </p>
                  {flags.isPersonalBest && <div className="mt-2 tech-label text-gold-bright"><Mark tone="gold" />{t("reveal.newRecord")}</div>}
                  {flags.isAscensionComplete && <div className="mt-1 tech-label text-red"><Mark tone="red" />{t("reveal.ascensionCompleteBadge")}</div>}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-6 grid grid-cols-2 gap-3"
              >
                <AscButton variant="red" className="w-full justify-center" onClick={onRetry} data-testid="reveal-retry-btn">
                  {t("reveal.retryButton")}
                </AscButton>
                <AscButton className="w-full justify-center" to="/profile" data-testid="reveal-profile-btn">
                  {t("reveal.viewProfileButton")}
                </AscButton>
                <AscButton className="w-full justify-center" to="/leaderboard" data-testid="reveal-leaderboard-btn">
                  {t("reveal.viewLeaderboardButton")}
                </AscButton>
                <AscButton className="w-full justify-center" onClick={shareResult} disabled={sharing} data-testid="reveal-share-btn">
                  {sharing ? t("reveal.preparingButton") : t("reveal.shareButton")}
                </AscButton>
                <AscButton className="w-full justify-center" onClick={downloadCertificate} disabled={downloading} data-testid="reveal-download-certificate-btn">
                  {downloading ? t("reveal.generatingButton") : t("reveal.downloadCertButton")}
                </AscButton>
                <AscButton className="w-full justify-center" onClick={downloadProfessionalCertificate} disabled={downloadingCert} data-testid="reveal-download-wpm-certificate-btn">
                  {downloadingCert ? t("reveal.generatingButton") : t("reveal.downloadWpmCertButton")}
                </AscButton>
                <AscButton className="col-span-2 w-full justify-center" onClick={shareToInstagramStory} disabled={sharingIg} data-testid="reveal-share-instagram-btn">
                  <InstagramIcon size={16} />
                  {sharingIg ? t("reveal.preparingButton") : t("reveal.shareInstagramButton")}
                </AscButton>
              </motion.div>
              {shareMsg && (
                <p className="mt-3 font-mono text-xs text-gold-bright" data-testid="instagram-share-msg">
                  {shareMsg}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
