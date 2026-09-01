import React, { createContext, useContext, useRef, useState, useCallback } from "react";

const SoundContext = createContext(null);

export function SoundProvider({ children }) {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem("asc_sound") !== "off";
    } catch {
      return true;
    }
  });
  const ctxRef = useRef(null);

  const getCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const tone = useCallback(
    (freq, duration = 0.08, type = "sine", gain = 0.05, when = 0) => {
      if (!enabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      const t = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration + 0.02);
    },
    [enabled, getCtx]
  );

  const play = useCallback(
    (name) => {
      switch (name) {
        case "click":
          tone(420, 0.05, "square", 0.04);
          break;
        case "hover":
          tone(660, 0.03, "sine", 0.02);
          break;
        case "toggle":
          tone(300, 0.05, "triangle", 0.04);
          tone(520, 0.05, "triangle", 0.04, 0.05);
          break;
        case "key":
          tone(180 + Math.random() * 40, 0.02, "square", 0.015);
          break;
        case "error":
          tone(120, 0.09, "sawtooth", 0.05);
          break;
        case "boot":
          tone(220, 0.12, "sine", 0.04);
          tone(330, 0.12, "sine", 0.04, 0.1);
          tone(440, 0.16, "sine", 0.04, 0.2);
          break;
        case "start":
          tone(300, 0.1, "square", 0.05);
          tone(600, 0.14, "square", 0.05, 0.1);
          break;
        case "count":
          tone(500, 0.08, "square", 0.05);
          break;
        case "go":
          tone(700, 0.2, "sawtooth", 0.06);
          break;
        case "analyze":
          tone(260, 0.5, "sine", 0.03);
          tone(390, 0.5, "sine", 0.03, 0.1);
          break;
        case "reveal":
          [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, "triangle", 0.05, i * 0.12));
          break;
        case "achievement":
          [660, 880, 1320].forEach((f, i) => tone(f, 0.16, "square", 0.045, i * 0.08));
          break;
        case "record":
          [784, 1047, 1319].forEach((f, i) => tone(f, 0.2, "sine", 0.05, i * 0.1));
          break;
        default:
          break;
      }
    },
    [tone]
  );

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("asc_sound", next ? "on" : "off");
      } catch {}
      return next;
    });
  }, []);

  return (
    <SoundContext.Provider value={{ enabled, toggle, play }}>{children}</SoundContext.Provider>
  );
}

export const useSound = () => useContext(SoundContext);
