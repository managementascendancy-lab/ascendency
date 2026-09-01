// ASCENDANCY typing + classification utilities (client mirror of backend/classification.py)

export const HERO_REQUIREMENTS = [
  { id: "nova", minWpm: 0, minAccuracy: 0, minConsistency: 0 },
  { id: "vanguard", minWpm: 35, minAccuracy: 85, minConsistency: 50 },
  { id: "phantom", minWpm: 45, minAccuracy: 88, minConsistency: 55 },
  { id: "titan", minWpm: 55, minAccuracy: 90, minConsistency: 60 },
  { id: "aegis", minWpm: 62, minAccuracy: 95, minConsistency: 65 },
  { id: "pulse", minWpm: 75, minAccuracy: 91, minConsistency: 68 },
  { id: "nexus", minWpm: 85, minAccuracy: 93, minConsistency: 72 },
  { id: "ascendant", minWpm: 95, minAccuracy: 94, minConsistency: 75 },
  { id: "velocity", minWpm: 110, minAccuracy: 92, minConsistency: 78 },
  { id: "sovereign", minWpm: 130, minAccuracy: 96, minConsistency: 82 },
];

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export function computeScore(wpm, accuracy, consistency) {
  const speed = Math.min(Math.max(wpm, 0), 160) * 4.0;
  const acc = clamp(accuracy) * 2.4;
  const cons = clamp(consistency) * 1.2;
  return Math.round(speed + acc + cons);
}

export function classifyIndex(wpm, accuracy, consistency) {
  let idx = 0;
  HERO_REQUIREMENTS.forEach((h, i) => {
    if (wpm >= h.minWpm && accuracy >= h.minAccuracy && consistency >= h.minConsistency) idx = i;
  });
  return idx;
}

// WPM from correct chars: (correct / 5) / minutes
export function calcWpm(correctChars, elapsedSeconds) {
  if (elapsedSeconds <= 0) return 0;
  return (correctChars / 5) / (elapsedSeconds / 60);
}

// accuracy: correct / total typed * 100
export function calcAccuracy(correctChars, totalTyped) {
  if (totalTyped <= 0) return 100;
  return (correctChars / totalTyped) * 100;
}

// consistency: derived from variance of per-second wpm samples.
// 100 = perfectly steady. Uses coefficient of variation.
export function calcConsistency(wpmSamples) {
  const s = wpmSamples.filter((x) => x > 0);
  if (s.length < 2) return s.length === 1 ? 75 : 0;
  const mean = s.reduce((a, b) => a + b, 0) / s.length;
  if (mean === 0) return 0;
  const variance = s.reduce((a, b) => a + (b - mean) ** 2, 0) / s.length;
  const cv = Math.sqrt(variance) / mean;
  return clamp(100 - cv * 100);
}
