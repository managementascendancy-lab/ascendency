import React, { useCallback, useEffect, useRef, useState } from "react";
import SEO from "@/components/SEO";
import HudPanel from "@/components/HudPanel";
import PerformanceCore from "@/components/PerformanceCore";
import NeuralTrace from "@/components/NeuralTrace";
import AscButton from "@/components/AscButton";
import HeroReveal from "@/components/HeroReveal";
import { buildStream, TOPICS } from "@/data/passages";
import { calcWpm, calcAccuracy, calcConsistency, classifyIndex, computeScore } from "@/lib/typing";
import { heroByIndex, HEROES } from "@/data/heroes";
import { useAuth } from "@/context/AuthContext";
import { useSound } from "@/context/SoundContext";
import api from "@/lib/api";
import { Mark, Sep } from "@/components/Sep";

const MODES = [15, 30, 60, 120];
const BOOT_LINES = ["SYSTEM INITIALIZING", "NEURAL LINK CONNECTED", "PERFORMANCE MATRIX READY"];

export default function Simulator() {
  const { user, setUser } = useAuth();
  const sound = useSound();

  const [duration, setDuration] = useState(30);
  const [topic, setTopic] = useState(TOPICS[0].key);
  const [text, setText] = useState(() => buildStream(1000, TOPICS[0].key));
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState("ready"); // ready | boot | countdown | running | done
  const [bootIndex, setBootIndex] = useState(0);
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [samples, setSamples] = useState([]);
  const [result, setResult] = useState(null);
  const [flags, setFlags] = useState({});
  const [showReveal, setShowReveal] = useState(false);
  const inputRef = useRef("");
  const textRef = useRef(text);
  const startRef = useRef(0);
  const lastSecRef = useRef(0);
  const finishedRef = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => { inputRef.current = input; }, [input]);
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
    setText(buildStream(1000, topic));
    setPhase("ready");
    setCount(3);
    setBootIndex(0);
  }, [topic]);

  const finish = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const inp = inputRef.current;
    const txt = textRef.current;
    const { c, w } = countCorrect(inp, txt);
    const secs = Math.max((Date.now() - startRef.current) / 1000, 0.5);
    const wpm = calcWpm(c, secs);
    const acc = inp.length ? calcAccuracy(c, inp.length) : 0;
    setSamples((prev) => {
      const cons = calcConsistency(prev.length ? prev : [wpm]);
      const score = computeScore(wpm, acc, cons);
      const heroIndex = classifyIndex(wpm, acc, cons);
      const res = {
        wpm, accuracy: acc, consistency: cons,
        correctCharacters: c, incorrectCharacters: w, totalCharacters: inp.length,
        duration, score, heroIndex,
      };
      setResult(res);

      if (user) {
        api
          .post("/simulations", {
            wpm, accuracy: acc, consistency: cons,
            correctCharacters: c, incorrectCharacters: w, totalCharacters: inp.length, duration,
          })
          .then(({ data }) => {
            setFlags({
              isPersonalBest: data.isPersonalBest,
              isNewClassification: data.isNewClassification,
              isAscensionComplete: data.isAscensionComplete,
            });
            setUser(data.user);
          })
          .catch(() => {});
      } else {
        setFlags({});
      }
      return prev;
    });
    setPhase("done");
    setShowReveal(true);
  }, [duration, user, setUser]);

  // boot + countdown sequence
  const begin = useCallback(() => {
    reset();
    setPhase("boot");
    sound?.play("boot");
  }, [reset, sound]);

  useEffect(() => {
    if (phase !== "boot") return;
    if (bootIndex < BOOT_LINES.length) {
      const t = setTimeout(() => setBootIndex((i) => i + 1), 380);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setPhase("countdown");
      setCount(3);
    }, 200);
    return () => clearTimeout(t);
  }, [phase, bootIndex]);

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
    setPhase("running");
    setTimeout(() => containerRef.current?.focus(), 30);
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

  // keystroke capture
  useEffect(() => {
    if (phase !== "running") return;
    const handler = (e) => {
      if (e.key === "Tab") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Backspace") {
        e.preventDefault();
        setInput((prev) => prev.slice(0, -1));
        return;
      }
      if (e.key.length === 1) {
        e.preventDefault();
        setInput((prev) => {
          if (prev.length >= textRef.current.length) return prev;
          const next = prev + e.key;
          const correctChar = e.key === textRef.current[prev.length];
          sound?.play(correctChar ? "key" : "error");
          if (next.length >= textRef.current.length) setTimeout(finish, 10);
          return next;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, finish, sound]);

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
    <div className="py-10">
      <SEO title="Typing Speed Simulator | Ascendancy" description="Run a typing simulation. Measure WPM, accuracy and consistency in 15, 30, 60 or 120 seconds." />

      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="tech-label text-gold-bright">TRAINING SYSTEM<Sep tone="gold" />GAMIFIED TYPING PRACTICE</span>
          <h1 className="font-display text-3xl font-700 tracking-tight text-cream sm:text-4xl">
            SIMULATION <span className="inline-flex items-center text-red"><Mark tone="red" />001</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="tech-label text-gold-bright">STATUS</span>
          <span className={`font-mono text-sm ${phase === "running" ? "text-red" : phase === "done" ? "text-gold-bright" : "text-sage"}`}>
            {phase === "ready" ? "READY" : phase === "running" ? "ACTIVE" : phase === "done" ? "COMPLETE" : "INITIALIZING"}
          </span>
        </div>
      </div>

      {/* mode switch */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="tech-label text-gold-bright">DURATION</span>
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
        <span className="tech-label text-gold-bright">TOPIC</span>
        {TOPICS.map((t) => (
          <button
            key={t.key}
            disabled={phase === "running" || phase === "boot" || phase === "countdown"}
            onClick={() => {
              setTopic(t.key);
              sound?.play("click");
            }}
            data-testid={`topic-${t.key}`}
            className={`border px-4 py-1.5 font-mono text-sm transition-colors disabled:opacity-40 ${
              topic === t.key ? "border-gold-bright bg-gold-bright text-navy-dark" : "border-bronze/50 text-cream/70 hover:text-cream"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* metrics readouts */}
      <div className="mt-6 grid grid-cols-2 gap-px border border-bronze/40 bg-bronze/40 sm:grid-cols-4">
        {[
          ["WPM", Math.round(liveWpm), "text-gold-bright"],
          ["ACCURACY", `${liveAcc.toFixed(0)}%`, "text-sage"],
          ["TIME", `${Math.ceil(remaining)}s`, "text-red"],
          ["CONSISTENCY", `${Math.round(liveCons)}%`, "text-cream"],
        ].map(([k, v, c]) => (
          <div key={k} className="bg-navy-dark px-4 py-3">
            <div className="tech-label text-highlight">{k}</div>
            <div className={`mt-1 font-mono text-3xl font-700 ${c}`} data-testid={`metric-${k.toLowerCase()}`}>{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.5fr]">
        {/* performance core */}
        <HudPanel type="system" label="PERFORMANCE CORE" status="MONITOR" bodyClassName="flex items-center justify-center p-6">
          <PerformanceCore wpm={liveWpm} accuracy={liveAcc} consistency={liveCons} intensity={intensity} size={300} />
        </HudPanel>

        {/* typing arena */}
        <HudPanel type="primary" label="TYPING ENVIRONMENT" status={phase === "running" ? "LIVE" : "STANDBY"} bodyClassName="p-6">
          <NeuralTrace intensity={intensity} error={recentError} className="mb-5" />

          {phase === "ready" && (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-5 text-center">
              <p className="max-w-md font-body text-cream/60">
                Enter the simulation. Type the passage as fast and accurately as you can. Your performance determines your hero classification.
              </p>
              <AscButton variant="red" onClick={begin} data-testid="simulator-start-btn">
                BEGIN SIMULATION →
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
                {count === 0 ? "GO" : count}
              </span>
            </div>
          )}

          {(phase === "running" || phase === "done") && (
            <div
              ref={containerRef}
              tabIndex={0}
              onClick={() => containerRef.current?.focus()}
              data-testid="typing-arena"
              className="min-h-[220px] cursor-text select-none font-mono text-2xl leading-relaxed tracking-wide outline-none"
            >
              {chars}
            </div>
          )}

          {phase === "running" && (
            <div className="mt-6 flex justify-end">
              <button onClick={reset} data-testid="simulator-restart-btn" className="tech-label text-bronze hover:text-red">
                [ RESTART ]
              </button>
            </div>
          )}
        </HudPanel>
      </div>

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
