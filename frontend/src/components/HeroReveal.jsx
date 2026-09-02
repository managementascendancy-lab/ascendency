import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import AscensionRing from "@/components/AscensionRing";
import ClassificationMarker from "@/components/ClassificationMarker";
import AscButton from "@/components/AscButton";
import ShareCard from "@/components/ShareCard";
import CertificateCard from "@/components/CertificateCard";
import { useSound } from "@/context/SoundContext";
import { Sep, Mark } from "@/components/Sep";
import { heroSrcSet } from "@/lib/heroImage";

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
  const [stage, setStage] = useState(0);
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
      flashMsg("CERTIFICATE SAVED TO YOUR DOWNLOADS");
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
      flashMsg("WPM CERTIFICATE SAVED TO YOUR DOWNLOADS");
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
      const shareData = { files: [file], title: "ASCENDANCY", text: `I reached ${hero.name} on ASCENDANCY!` };

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share(shareData);
          flashMsg("LINK COPIED — ADD IT AS A LINK STICKER IF YOU POST TO A STORY/STATUS");
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
        flashMsg("IMAGE DOWNLOADED + LINK COPIED — SHARE IT ON WHATSAPP, INSTAGRAM, X...");
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
          await navigator.share({ files: [file], title: "ASCENDANCY", text: `I reached ${hero.name} on ASCENDANCY!` });
          flashMsg("PICK INSTAGRAM IN THE SHARE SHEET, THEN ADD THE LINK STICKER — IT'S COPIED");
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
        flashMsg("INSTAGRAM STORIES NEEDS YOUR PHONE — IMAGE DOWNLOADED, LINK COPIED. SEND THE IMAGE TO YOUR PHONE TO POST IT");
      }
    } finally {
      setSharingIg(false);
    }
  };

  useEffect(() => {
    const t1 = setTimeout(() => {
      setStage(1);
      sound?.play("analyze");
    }, 900);
    const t2 = setTimeout(() => {
      setStage(2);
      sound?.play("reveal");
    }, 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
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
          recipientName={user?.username ? user.username.toUpperCase() : "GUEST ASCENDANT"}
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
              {stage === 0 ? "SIMULATION COMPLETE" : "ANALYZING PERFORMANCE"}
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
              <div>{"> READING PERFORMANCE MATRIX..."}</div>
              {stage === 1 && <div>{"> CROSS-REFERENCING HERO ARCHIVE..."}</div>}
              {stage === 1 && <div className="text-gold-bright">{"> CLASSIFICATION IN PROGRESS..."}</div>}
            </div>
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
              <div className="absolute left-3 top-3 tech-label text-gold-bright">HERO PROFILE IDENTIFIED</div>
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
                  NEW CLASSIFICATION
                </motion.div>
              )}
            </motion.div>

            {/* data */}
            <div className="flex flex-col justify-center">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <span className="tech-label text-gold">CLASSIFICATION COMPLETE</span>
                <h2 className="font-display text-5xl font-700 tracking-wide text-cream display-outline sm:text-6xl">
                  {hero.name}
                </h2>
                <p className="tech-label mt-1 text-gold-bright">{hero.title}<Sep tone="gold" />{hero.class}</p>
                <p className="mt-3 max-w-md font-body text-sm text-cream/70">{hero.description}</p>
                <p className="mt-2 font-mono text-xs text-sage">
                  <span className="text-gold-bright">POWER</span><Sep tone="sage" />{hero.power}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-5 grid grid-cols-2 gap-px border border-bronze/40 bg-bronze/40 sm:grid-cols-4"
              >
                {[
                  ["WPM", Math.round(result.wpm), "text-gold-bright"],
                  ["ACCURACY", `${result.accuracy.toFixed(0)}%`, "text-sage"],
                  ["CONSISTENCY", `${Math.round(result.consistency)}%`, "text-cream"],
                  ["SCORE", result.score, "text-red"],
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
                  sublabel={nextHero ? `NEXT: ${nextHero.name}` : "MAX ASCENSION"}
                  size={150}
                />
                <div className="flex-1">
                  <div className="tech-label text-gold-bright">ASCENSION PROGRESS</div>
                  <p className="mt-2 font-body text-sm text-cream/70">
                    {nextHero
                      ? `Advance toward ${nextHero.name} — raise your speed, accuracy and consistency to ascend.`
                      : "You have reached the apex of the Ascendancy."}
                  </p>
                  {flags.isPersonalBest && <div className="mt-2 tech-label text-gold-bright"><Mark tone="gold" />NEW RECORD</div>}
                  {flags.isAscensionComplete && <div className="mt-1 tech-label text-red"><Mark tone="red" />ASCENSION COMPLETE</div>}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-6 grid grid-cols-2 gap-3"
              >
                <AscButton variant="red" className="w-full justify-center" onClick={onRetry} data-testid="reveal-retry-btn">
                  RETRY SIMULATION →
                </AscButton>
                <AscButton className="w-full justify-center" to="/profile" data-testid="reveal-profile-btn">
                  VIEW HERO PROFILE
                </AscButton>
                <AscButton className="w-full justify-center" to="/leaderboard" data-testid="reveal-leaderboard-btn">
                  VIEW LEADERBOARD
                </AscButton>
                <AscButton className="w-full justify-center" onClick={shareResult} disabled={sharing} data-testid="reveal-share-btn">
                  {sharing ? "PREPARING…" : "SHARE RESULT"}
                </AscButton>
                <AscButton className="w-full justify-center" onClick={downloadCertificate} disabled={downloading} data-testid="reveal-download-certificate-btn">
                  {downloading ? "GENERATING…" : "DOWNLOAD HERO CERTIFICATE"}
                </AscButton>
                <AscButton className="w-full justify-center" onClick={downloadProfessionalCertificate} disabled={downloadingCert} data-testid="reveal-download-wpm-certificate-btn">
                  {downloadingCert ? "GENERATING…" : "DOWNLOAD WPM CERTIFICATE"}
                </AscButton>
                <AscButton className="col-span-2 w-full justify-center" onClick={shareToInstagramStory} disabled={sharingIg} data-testid="reveal-share-instagram-btn">
                  <InstagramIcon size={16} />
                  {sharingIg ? "PREPARING…" : "SHARE TO INSTAGRAM STORY"}
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
