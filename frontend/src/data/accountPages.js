// Marketing/info content for the ACCOUNT footer links — separate from the
// actual app pages (Profile, Auth) these point into.

export const ACCOUNT_PAGES = [
  {
    slug: "ascendant-console",
    code: "ACC-01",
    name: "ASCENDANT CONSOLE",
    eyebrow: "ACCOUNT",
    tagline: "YOUR PROGRESS, IN ONE PLACE.",
    summary:
      "Your personal dashboard on the network — current hero classification, best performance, full simulation history and every achievement you've unlocked, all in one console.",
    features: [
      "Your current hero classification, with a live progress ring toward the next tier.",
      "Best and average WPM, accuracy and consistency, tracked across every simulation you've run.",
      "A full history of your recent simulations, charted over time.",
      "Every achievement you've unlocked, from your first simulation to reaching the apex of the Ascendancy.",
    ],
    ctaLabel: "VIEW YOUR CONSOLE →",
    ctaTo: "/profile",
  },
  {
    slug: "sign-in-register",
    code: "ACC-02",
    name: "SIGN IN / REGISTER",
    eyebrow: "ACCOUNT",
    tagline: "CREATE YOUR ASCENDANT PROFILE.",
    summary:
      "An Ascendancy account saves every simulation you run, tracks your best performance over time, and puts you on the global leaderboard. Takes seconds to create.",
    features: [
      "Every simulation you run is saved permanently to your account's history.",
      "Your best scores are tracked and used to classify your current hero tier.",
      "Appear on the global Performance Network leaderboard, ranked against every other ascendant.",
      "Build a daily streak and unlock achievements as you keep training.",
    ],
    ctaLabel: "SIGN IN / REGISTER →",
    ctaTo: "/auth",
  },
];

export const accountPageBySlug = (slug) => ACCOUNT_PAGES.find((p) => p.slug === slug);
