// Marketing/info content for the PRODUCT footer links — separate from the
// actual app pages these point into.

export const PRODUCTS = [
  {
    slug: "training-simulator",
    code: "MOD-01",
    name: "TRAINING SYSTEM",
    eyebrow: "PRODUCT",
    tagline: "MEASURE EVERY KEYSTROKE.",
    summary:
      "The core of Ascendancy. Run a timed typing simulation and get an instant, precise read on how fast and how clean you actually type.",
    features: [
      "Choose a duration from 15 to 120 seconds, and a passage topic on the concept of heroism.",
      "Live readouts for WPM, accuracy, consistency and time remaining while you type.",
      "A real-time Performance Core visualization that reacts to your typing intensity.",
      "Every result feeds directly into your hero classification, streak and leaderboard score.",
    ],
    ctaLabel: "BEGIN A SIMULATION →",
    ctaTo: "/simulator",
  },
  {
    slug: "classification-archive",
    code: "MOD-02",
    name: "CLASSIFICATION ARCHIVE",
    eyebrow: "PRODUCT",
    tagline: "TEN HEROES. ONE PATH.",
    summary:
      "Ten deterministic classifications, from NOVA to SOVEREIGN. Every tier has fixed thresholds for speed, accuracy and consistency — nothing is graded on a curve.",
    features: [
      "Browse all ten hero classifications and the exact WPM / accuracy / consistency thresholds each one requires.",
      "See your current classification and how close you are to the next tier.",
      "A fast-but-inaccurate run will never outrank a slower, cleaner one — all three metrics matter.",
      "Full hero lore, personality and power for every classification in the archive.",
    ],
    ctaLabel: "VIEW THE ARCHIVE →",
    ctaTo: "/ascendancy",
  },
  {
    slug: "performance-network",
    code: "MOD-03",
    name: "PERFORMANCE NETWORK",
    eyebrow: "PRODUCT",
    tagline: "COMPETE GLOBALLY.",
    summary:
      "A live, global leaderboard of every ascendant's best verified run — sortable by score, WPM or accuracy.",
    features: [
      "Sort the network by overall score, best WPM, or best accuracy.",
      "See your own rank highlighted directly in the standings.",
      "Rankings are drawn from your best simulation, not an average — one great run is all it takes.",
      "Updated in real time as new results come in from across the network.",
    ],
    ctaLabel: "VIEW LEADERBOARD →",
    ctaTo: "/leaderboard",
  },
  {
    slug: "achievements",
    code: "MOD-04",
    name: "ACHIEVEMENTS",
    eyebrow: "PRODUCT",
    tagline: "MILESTONES THAT MATTER.",
    summary:
      "Nine achievements track real milestones in your progression — from your first simulation to reaching the apex of the Ascendancy.",
    features: [
      "Unlock achievements for speed milestones like Speed Surge, Overdrive and Break the Limit.",
      "Earn Precision and Perfect Execution for near-flawless and flawless accuracy.",
      "Ascension, Velocity and Sovereign mark your progress through the highest hero tiers.",
      "Every achievement is permanent once unlocked and visible on your Ascendant Console.",
    ],
    ctaLabel: "VIEW ACHIEVEMENTS →",
    ctaTo: "/achievements",
  },
];

export const productBySlug = (slug) => PRODUCTS.find((p) => p.slug === slug);
