import { TOPICS as en } from "./en";
import { TOPICS as es } from "./es";
import { TOPICS as ptBr } from "./pt-br";
import { TOPICS as fr } from "./fr";
import { TOPICS as de } from "./de";
import { TOPICS as it } from "./it";
import { TOPICS as ru } from "./ru";
import { TOPICS as ar } from "./ar";
import { TOPICS as ur } from "./ur";
import { TOPICS as ja } from "./ja";
import { TOPICS as ko } from "./ko";
import { TOPICS as zhCn } from "./zh-cn";
import { TOPICS as hi } from "./hi";

// Translated typing passages for every supported locale. Note: for
// ja/ko/zh-cn (typically typed via an IME composing romaji/pinyin/jamo into
// the target script) and hi (Devanagari conjuncts can span multiple
// keystrokes/codepoints per visual character, and phonetic Hindi input
// tools are also composition-based), the simulator's raw
// keydown-per-character diffing may not track typing accurately — these
// are included for translation completeness, but actual typing UX depends
// on the user's OS input method for that script.
const LOCALE_TOPICS = {
  en, es, "pt-br": ptBr, fr, de, it, ru, ar, ur, ja, ko, "zh-cn": zhCn, hi,
};

// Topic keys/labels for UI iteration are locale-independent (the visible
// label always comes from the "simulator" i18n namespace, not from here) —
// English's key list is authoritative; every locale file must cover the
// same keys.
export const TOPICS = en;

function topicsForLocale(locale) {
  return LOCALE_TOPICS[locale] || en;
}

export function randomPassage(topicKey, locale = "en") {
  const topics = topicsForLocale(locale);
  const topic = topics.find((t) => t.key === topicKey) || topics[0];
  return topic.passages[Math.floor(Math.random() * topic.passages.length)];
}

// Build a long text stream from multiple passages for long simulations.
export function buildStream(minChars = 900, topicKey, locale = "en") {
  let text = "";
  while (text.length < minChars) {
    text += (text ? " " : "") + randomPassage(topicKey, locale);
  }
  return text;
}
