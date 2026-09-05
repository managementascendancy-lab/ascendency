import { useTranslation } from "react-i18next";

// Merges a HEROES entry with its translated flavor text from the "heroes"
// namespace. `id`, `name`, `index`, thresholds, `image` and `accent` stay
// untouched (name is a protected proper noun — see locales/en/heroes.json's
// sibling translations); a locale missing a hero's translation falls back
// to English automatically via i18next's fallbackLng.
export function useTranslatedHero(hero) {
  const { t } = useTranslation("heroes");
  if (!hero) return hero;
  return {
    ...hero,
    title: t(`${hero.id}.title`),
    description: t(`${hero.id}.description`),
    personality: t(`${hero.id}.personality`),
    power: t(`${hero.id}.power`),
    class: t(`${hero.id}.class`),
  };
}
