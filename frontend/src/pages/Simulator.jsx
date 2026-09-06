import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Volume2, VolumeX } from "lucide-react";
import SEO from "@/components/SEO";
import HudPanel from "@/components/HudPanel";
import PerformanceCore from "@/components/PerformanceCore";
import NeuralTrace from "@/components/NeuralTrace";
import AscButton from "@/components/AscButton";
import HeroReveal from "@/components/HeroReveal";
import VirtualKeyboard from "@/components/VirtualKeyboard";
import { buildStream, TOPICS } from "@/data/passages";
import { calcWpm, calcAccuracy, calcConsistency, classifyIndex, computeScore } from "@/lib/typing";
import { heroByIndex, HEROES, getLocaleHeroProgress } from "@/data/heroes";
import { RTL_LOCALE_CODES } from "@/i18n/locales";
import { useAuth } from "@/context/AuthContext";
import { useSound } from "@/context/SoundContext";
import api from "@/lib/api";
import { Mark, Sep } from "@/components/Sep";

const MODES = [15, 30, 60, 120];
const KEYBOARD_MODE_STORAGE_KEY = "ascendancy:keyboardMode";
const isTouchDevice = typeof window !== "undefined" && (("ontouchstart" in window) || navigator.maxTouchPoints > 0);

export default function Simulator() {
  const { t, i18n } = useTranslation("simulator");
  const BOOT_LINES = t("bootLines", { returnObjects: true });
  // t() with returnObjects doesn't guarantee a stable array reference across
  // renders, so the boot-sequence effect below depends on this primitive
  // count rather than BOOT_LINES itself — the effect only actually cares how
  // many lines there are, not the array identity.
  const bootLinesCount = BOOT_LINES.length;
  const { user, setUser } = useAuth();
  const sound = useSound();
  const isRtl = RTL_LOCALE_CODES.includes(i18n.language);

  const [duration, setDuration] = useState(30);
  const [topic, setTopic] = useState(TOPICS[0].key);
  const [text, setText] = useState(() => buildStream(1000, TOPICS[0].key, i18n.language));
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState("ready"); // ready | boot | countdown | running | done
  const [bootIndex, setBootIndex] = useState(0);
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [samples, setSamples] = useState([]);
  const [result, setResult] = useState(null);
  const [flags, setFlags] = useState({});
  const [showReveal, setShowReveal] = useState(false);
  // Only offered on touch devices, and only for English — the on-screen
  // layout covers exactly the character set the English passages use
  // (verified directly against passages/en.js), which isn't guaranteed for
  // other locales' accented characters, so those stick to the native keyboard.
  const [keyboardMode, setKeyboardMode] = useState(() => {
    try {
      return localStorage.getItem(KEYBOARD_MODE_STORAGE_KEY) || "native";
    } catch {
      return "native";
    }
  });
  const offerVirtualKeyboard = isTouchDevice && i18n.language === "en";
  const inputRef = useRef("");
  const textRef = useRef(text);
  const samplesRef = useRef(samples);
  const startRef = useRef(0);
  const lastSecRef = useRef(0);
  const finishedRef = useRef(false);
  const containerRef = useRef(null);
  // Resolves to a session_id from POST /simulations/start, or null for a
  // guest (who never submits) / on request failure. Stored as a promise
  // rather than state so finish() can await it directly without racing an
  // unusually fast typist against a network round-trip that hasn't
  // resolved yet.
  const sessionPromiseRef = useRef(null);

  useEffect(() => { inputRef.current = input; }, [input]);
  useEffect(() => { samplesRef.current = samples; }, [samples]);
  useEffect(() => { textRef.current = text; }, [text]);

  // derived metrics
  const countCorrect = (inp, txt) => {
    let c = 0, w = 0;
    for (let i = 0; i < inp.length; i++) {
      if (inp[i] === txt[i]) c++; else w++;
    }
    return { c, w };
  };
  const { c: correct, w: incorrect } = countCorrect(input, text);
  const totalTyped = input.length;
  const liveWpm = phase === "running" || phase === "done" ? calcWpm(correct, Math.max(elapsed, 0.5)) : 0;
  const liveAcc = totalTyped ? calcAccuracy(correct, totalTyped) : 100;
  const liveCons = calcConsistency(samples);
  const remaining = Math.max(0, duration - elapsed);

  const intensity =
    phase !== "running" ? 0 : liveWpm >= 110 ? 3 : liveWpm >= 80 ? 2 : liveWpm >= 30 ? 1 : 0;
  const recentError = input.length > 0 && input[input.length - 1] !== text[input.length - 1];

  const reset = useCallback(() => {
    finishedRef.current = false;
    setInput("");
    setElapsed(0);
    setSamples([]);
    setResult(null);
    setFlags({});
    setShowReveal(false);
    setText(buildStream(1000, topic, i18n.language));
    setPhase("ready");
    setCount(3);
    setBootIndex(0);
  }, [topic, i18n.language]);

  const finish = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const inp = inputRef.current;
    const txt = textRef.current;
    const { c, w } = countCorrect(inp, txt);
    const secs = Math.max((Date.now() - startRef.current) / 1000, 0.5);
    const wpm = calcWpm(c, secs);
    const acc = inp.length ? calcAccuracy(c, inp.length) : 0;
    // Read via ref rather than a setSamples((prev) => ...) updater: the
    // updater form used to wrap this entire block (API call included), and
    // React 18 StrictMode double-invokes state-updater functions in dev to
    // catch exactly this kind of impurity — so the simulation got submitted
    // twice per run. The second, redundant submission would see the
    // already-updated highestHeroIndex from the first one and report
    // isNewClassification: false, silently clobbering the correct flags the
    // first call had just set.
    const prevSamples = samplesRef.current;
    const cons = calcConsistency(prevSamples.length ? prevSamples : [wpm]);
    const score = computeScore(wpm, acc, cons);
    const heroIndex = classifyIndex(wpm, acc, cons);
    const res = {
      wpm, accuracy: acc, consistency: cons,
      correctCharacters: c, incorrectCharacters: w, totalCharacters: inp.length,
      duration, score, heroIndex,
    };
    setResult(res);

    if (user) {
      // Hero unlocks are scoped per language the test was typed in — see
      // getLocaleHeroProgress — so the "before" snapshot has to come from
      // this locale specifically, not the user's global highest.
      const previousHighest = getLocaleHeroProgress(user, i18n.language).highestHeroIndex;
      const sessionId = await sessionPromiseRef.current;
      api
        .post("/simulations", {
          wpm, accuracy: acc, consistency: cons,
          correctCharacters: c, incorrectCharacters: w, totalCharacters: inp.length, duration,
          // Still sent for now, but no longer what the backend actually
          // times against — session_id below (from /simulations/start) is
          // the server-authoritative clock; elapsedSeconds is left in place
          // rather than ripped out.
          elapsedSeconds: secs,
          session_id: sessionId,
          locale: i18n.language,
        })
        .then(({ data }) => {
          const newHighest = getLocaleHeroProgress(data.user, i18n.language).highestHeroIndex;
          // Classifications cascade: reaching hero N means every hero
          // below N is also unlocked (see Ascendancy.jsx's `locked =
          // index > highest`). A single strong run can cross several
          // tiers at once for a new/returning ascendant, so surface the
          // whole newly-crossed range here rather than just the final one.
          const newlyUnlockedIndices = data.isNewClassification
            ? Array.from({ length: newHighest - previousHighest }, (_, k) => previousHighest + 1 + k)
            : [];
          setFlags({
            isPersonalBest: data.isPersonalBest,
            isNewClassification: data.isNewClassification,
            isAscensionComplete: data.isAscensionComplete,
            newlyUnlockedIndices,
          });
          setUser(data.user);
        })
        .catch(() => {
          setFlags({});
        })
        .finally(() => {
          // HeroReveal reads flags.newlyUnlockedIndices in a mount-time
          // (deps-less) effect to schedule its unlock sequence, so it must
          // not mount until this response (success or failure) has landed
          // — otherwise it always mounts with stale/empty flags and the
          // per-hero unlock sequence never has anything to show.
          setPhase("done");
          setShowReveal(true);
        });
    } else {
      setFlags({});
      setPhase("done");
      setShowReveal(true);
    }
  }, [duration, user, setUser, i18n.language]);

  // boot + countdown sequence
  const begin = useCallback(() => {
    reset();
    setPhase("boot");
    sound?.play("boot");
  }, [reset, sound]);

  useEffect(() => {
    if (phase !== "boot") return;
    if (bootIndex < bootLinesCount) {
      const t = setTimeout(() => setBootIndex((i) => i + 1), 380);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setPhase("countdown");
      setCount(3);
    }, 200);
    return () => clearTimeout(t);
  }, [phase, bootIndex, bootLinesCount]);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (count > 0) {
      sound?.play(count === 1 ? "go" : "count");
      const t = setTimeout(() => setCount((c) => c - 1), 700);
      return () => clearTimeout(t);
    }
    startRef.current = Date.now();
    lastSecRef.current = 0;
    finishedRef.current = false;
    // The server's own clock (created_at on this session) becomes the
    // authoritative elapsed-time source at submission — this is the actual
    // moment typing becomes possible, not the earlier "Begin" click, which
    // still has the boot/countdown ceremony ahead of it.
    sessionPromiseRef.current = user
      ? api.post("/simulations/start").then(({ data }) => data.session_id).catch(() => null)
      : Promise.resolve(null);
    setPhase("running");
    // On mobile, focusing scrolls the browser's default way (often centering
    // the element, which can still leave it partly under the keyboard once
    // one appears). Pinning it to the top of the viewport instead leaves the
    // keyboard the whole lower half of the screen to occupy without covering
    // the text.
    setTimeout(() => {
      containerRef.current?.focus();
      if (isTouchDevice) {
        containerRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    }, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, count]);

  // running timer
  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => {
      const secs = (Date.now() - startRef.current) / 1000;
      setElapsed(secs);
      const whole = Math.floor(secs);
      if (whole > lastSecRef.current) {
        lastSecRef.current = whole;
        const { c } = countCorrect(inputRef.current, textRef.current);
        const w = calcWpm(c, secs);
        setSamples((prev) => [...prev, w]);
      }
      if (secs >= duration) finish();
    }, 150);
    return () => clearInterval(id);
  }, [phase, duration, finish]);

  // keystroke capture — driven by a real (visually hidden) <input>'s onChange
  // rather than raw keydown, so this actually works on mobile: a bare div
  // never triggers the on-screen keyboard, and even when a keyboard is
  // present, most mobile keyboards (autocomplete/predictive ones especially)
  // don't reliably fire a keydown per character the way a physical keyboard does.
  const handleInputChange = useCallback(
    (e) => {
      const raw = e.target.value;
      const txt = textRef.current;
      const next = raw.length > txt.length ? raw.slice(0, txt.length) : raw;
      if (next.length > inputRef.current.length) {
        const correctChar = next[next.length - 1] === txt[next.length - 1];
        sound?.play(correctChar ? "key" : "error");
      }
      setInput(next);
      if (next.length >= txt.length) setTimeout(finish, 10);
    },
    [finish, sound]
  );

  // Typing is append-only (the highlighted range assumes the cursor is
  // always at the end) — pin the real input's caret there so clicking or
  // arrow-keying into the middle can't desync it from that assumption.
  const pinCaretToEnd = useCallback((e) => {
    const el = e.target;
    if (el.selectionStart !== el.value.length || el.selectionEnd !== el.value.length) {
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, []);

  const blockPaste = useCallback((e) => e.preventDefault(), []);

  // Shared by the on-screen VirtualKeyboard, which sends one character at a
  // time and bypasses the real (inputMode="none") input's onChange entirely.
  const appendChar = useCallback(
    (ch) => {
      const txt = textRef.current;
      setInput((prev) => {
        if (prev.length >= txt.length) return prev;
        const next = prev + ch;
        const correctChar = ch === txt[prev.length];
        sound?.play(correctChar ? "key" : "error");
        if (next.length >= txt.length) setTimeout(finish, 10);
        return next;
      });
    },
    [finish, sound]
  );

  const backspaceChar = useCallback(() => {
    setInput((prev) => prev.slice(0, -1));
  }, []);

  const selectKeyboardMode = useCallback((mode) => {
    setKeyboardMode(mode);
    try {
      localStorage.setItem(KEYBOARD_MODE_STORAGE_KEY, mode);
    } catch {
      /* private browsing / storage disabled — the choice just won't persist */
    }
  }, []);

  // render typing text with windowed range around cursor
  const startWin = Math.max(0, input.length - 60);
  const endWin = Math.min(text.length, input.length + 260);
  const chars = [];
  for (let i = startWin; i < endWin; i++) {
    let cls = "text-cream/25";
    if (i < input.length) cls = input[i] === text[i] ? "text-cream" : "text-red bg-red/20";
    else if (i === input.length) cls = "text-navy-dark bg-gold-bright";
    chars.push(
      <span key={i} className={cls}>
        {text[i]}
      </span>
    );
  }

  const hero = result ? heroByIndex(result.heroIndex) : null;
  const nextHero = result && result.heroIndex < HEROES.length - 1 ? heroByIndex(result.heroIndex + 1) : null;
  const ascProgress =
    result && nextHero
      ? Math.round(
          Math.min(
            result.wpm / nextHero.minWpm,
            result.accuracy / nextHero.minAccuracy,
            result.consistency / nextHero.minConsistency,
            1
          ) * 100
        )
      : 100;

  return (
    <div className={`py-10 ${offerVirtualKeyboard && keyboardMode === "virtual" && phase === "running" ? "pb-64" : ""}`}>
      <SEO title={t("seo.title")} description={t("seo.description")} />

      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="tech-label text-gold-bright">{t("header.overline1")}<Sep tone="gold" />{t("header.overline2")}</span>
          <h1 className="font-display text-3xl font-700 tracking-tight text-cream sm:text-4xl">
            {t("header.heading")} <span className="inline-flex items-center text-red"><Mark tone="red" />001</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="tech-label text-gold-bright">{t("header.statusLabel")}</span>
          <span className={`font-mono text-sm ${phase === "running" ? "text-red" : phase === "done" ? "text-gold-bright" : "text-sage"}`}>
            {phase === "ready" ? t("header.status.ready") : phase === "running" ? t("header.status.active") : phase === "done" ? t("header.status.complete") : t("header.status.initializing")}
          </span>
        </div>
      </div>

      {/* mode switch */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="tech-label text-gold-bright">{t("duration.label")}</span>
        {MODES.map((m) => (
          <button
            key={m}
            disabled={phase === "running" || phase === "boot" || phase === "countdown"}
            onClick={() => {
              setDuration(m);
              sound?.play("click");
            }}
            data-testid={`mode-${m}`}
            className={`border px-4 py-1.5 font-mono text-sm transition-colors disabled:opacity-40 ${
              duration === m ? "border-gold-bright bg-gold-bright text-navy-dark" : "border-bronze/50 text-cream/70 hover:text-cream"
            }`}
          >
            {m}s
          </button>
        ))}
      </div>

      {/* topic switch */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="tech-label text-gold-bright">{t("topic.label")}</span>
        {TOPICS.map((tp) => (
          <button
            key={tp.key}
            disabled={phase === "running" || phase === "boot" || phase === "countdown"}
            onClick={() => {
              setTopic(tp.key);
              sound?.play("click");
            }}
            data-testid={`topic-${tp.key}`}
            className={`border px-4 py-1.5 font-mono text-sm transition-colors disabled:opacity-40 ${
              topic === tp.key ? "border-gold-bright bg-gold-bright text-navy-dark" : "border-bronze/50 text-cream/70 hover:text-cream"
            }`}
          >
            {t(`topic.items.${tp.key}`)}
          </button>
        ))}
      </div>

      {/* metrics readouts */}
      <div className="mt-6 grid grid-cols-2 gap-px border border-bronze/40 bg-bronze/40 sm:grid-cols-4">
        {[
          ["wpm", Math.round(liveWpm), "text-gold-bright"],
          ["accuracy", `${liveAcc.toFixed(0)}%`, "text-sage"],
          ["time", `${Math.ceil(remaining)}s`, "text-red"],
          ["consistency", `${Math.round(liveCons)}%`, "text-cream"],
        ].map(([k, v, c]) => (
          <div key={k} className="bg-navy-dark px-4 py-3">
            <div className="tech-label text-highlight">{t(`metrics.${k}`)}</div>
            <div className={`mt-1 font-mono text-3xl font-700 ${c}`} data-testid={`metric-${k}`}>{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.5fr]">
        {/* performance core — ordered after the typing arena on mobile, since
            stacking it above would push the actual typing text further down
            the page, deeper under where an on-screen keyboard covers it */}
        <HudPanel type="system" label={t("performanceCore.label")} status={t("performanceCore.status")} bodyClassName="flex items-center justify-center p-6" className="order-2 lg:order-none">
          <PerformanceCore wpm={liveWpm} accuracy={liveAcc} consistency={liveCons} intensity={intensity} size={300} />
        </HudPanel>

        {/* typing arena */}
        <HudPanel
          type="primary"
          label={t("typingEnvironment.label")}
          status={phase === "running" ? t("typingEnvironment.statusLive") : t("typingEnvironment.statusStandby")}
          actions={
            <button
              type="button"
              onClick={() => {
                sound?.toggleKeySound();
                sound?.play("toggle");
              }}
              aria-label={sound?.keySoundEnabled ? t("typingEnvironment.muteKeySound") : t("typingEnvironment.unmuteKeySound")}
              data-testid="key-sound-toggle"
              className="border border-bronze/50 p-1.5 text-cream/70 transition-colors hover:border-gold-bright hover:text-gold-bright"
            >
              {sound?.keySoundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          }
          bodyClassName="p-6"
          className="order-1 lg:order-none"
        >
          <NeuralTrace intensity={intensity} error={recentError} className="mb-5" />

          {phase === "ready" && (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-5 text-center">
              <p className="max-w-md font-body text-cream/60">{t("ready.description")}</p>

              {offerVirtualKeyboard && (
                <div className="flex flex-col items-center gap-2">
                  <span className="tech-label text-gold-bright">{t("ready.keyboardChoice.label")}</span>
                  <div className="flex gap-2">
                    {["native", "virtual"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => selectKeyboardMode(mode)}
                        data-testid={`keyboard-mode-${mode}`}
                        className={`border px-3 py-1.5 font-mono text-xs transition-colors ${
                          keyboardMode === mode
                            ? "border-gold-bright bg-gold-bright text-navy-dark"
                            : "border-bronze/50 text-cream/70 hover:text-cream"
                        }`}
                      >
                        {t(`ready.keyboardChoice.${mode}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <AscButton variant="red" onClick={begin} data-testid="simulator-start-btn">
                {t("ready.beginButton")}
              </AscButton>
            </div>
          )}

          {phase === "boot" && (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 font-mono text-sm text-sage">
              {BOOT_LINES.slice(0, bootIndex).map((l, i) => (
                <div key={i} className={i === BOOT_LINES.length - 1 ? "text-gold-bright" : ""}>{"> "}{l}</div>
              ))}
            </div>
          )}

          {phase === "countdown" && (
            <div className="flex min-h-[220px] items-center justify-center">
              <span className="font-display text-8xl font-700 text-red" style={{ textShadow: "0 0 30px rgba(223,53,13,0.6)" }}>
                {count === 0 ? t("countdown.go") : count}
              </span>
            </div>
          )}

          {(phase === "running" || phase === "done") && (
            <div
              className="relative min-h-[220px] cursor-text"
              onClick={() => {
                containerRef.current?.focus();
                if (isTouchDevice) {
                  containerRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
                }
              }}
            >
              {/* Real (visually hidden) input — this is what actually
                  receives keystrokes and, critically, is what triggers the
                  on-screen keyboard on mobile. The colored text below it is
                  a pointer-events-none visual overlay only. */}
              <input
                ref={containerRef}
                type="text"
                inputMode={offerVirtualKeyboard && keyboardMode === "virtual" ? "none" : "text"}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                disabled={phase !== "running"}
                value={input}
                onChange={handleInputChange}
                onSelect={pinCaretToEnd}
                onPaste={blockPaste}
                onCut={blockPaste}
                onDrop={blockPaste}
                aria-label={t("typingEnvironment.label")}
                data-testid="typing-input"
                className="absolute inset-0 h-full w-full cursor-text border-none bg-transparent p-0 text-transparent caret-transparent outline-none"
              />
              <div
                data-testid="typing-arena"
                dir={isRtl ? "rtl" : "ltr"}
                className="pointer-events-none select-none font-mono text-2xl leading-relaxed tracking-wide"
              >
                {chars}
              </div>
            </div>
          )}

          {phase === "running" && (
            <div className="mt-6 flex justify-end">
              <button onClick={reset} data-testid="simulator-restart-btn" className="tech-label text-bronze hover:text-red">
                {t("restartButton")}
              </button>
            </div>
          )}
        </HudPanel>
      </div>

      {offerVirtualKeyboard && keyboardMode === "virtual" && phase === "running" && (
        <VirtualKeyboard onChar={appendChar} onBackspace={backspaceChar} />
      )}

      {showReveal && hero && result && (
        <HeroReveal
          hero={hero}
          result={result}
          nextHero={nextHero}
          user={user}
          ascensionProgress={ascProgress}
          flags={flags}
          onRetry={() => { setShowReveal(false); begin(); }}
        />
      )}
    </div>
  );
}
