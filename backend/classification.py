"""ASCENDANCY hero classification + performance scoring algorithm.

Deterministic classification based on WPM, Accuracy and Consistency.
A fast-but-inaccurate ascendant will NOT reach the top classes because
every requirement (speed, accuracy, consistency) must be satisfied.
"""

# Progression order NOVA -> INFINITE. index == progression rank.
# Heroes 11-20 (index 10-19) are the Transcendent/Extreme tier added on top
# of the original 10 — same shape, plus an optional minimumDuration (seconds)
# for the two tiers that require a sustained, not just momentary, run.
HERO_REQUIREMENTS = [
    {"id": "nova",      "name": "NOVA",      "minWpm": 0,   "minAccuracy": 0,  "minConsistency": 0},
    {"id": "vanguard",  "name": "VANGUARD",  "minWpm": 35,  "minAccuracy": 85, "minConsistency": 50},
    {"id": "phantom",   "name": "PHANTOM",   "minWpm": 45,  "minAccuracy": 88, "minConsistency": 55},
    {"id": "titan",     "name": "TITAN",     "minWpm": 55,  "minAccuracy": 90, "minConsistency": 60},
    {"id": "aegis",     "name": "AEGIS",     "minWpm": 62,  "minAccuracy": 95, "minConsistency": 65},
    {"id": "pulse",     "name": "PULSE",     "minWpm": 75,  "minAccuracy": 91, "minConsistency": 68},
    {"id": "nexus",     "name": "NEXUS",     "minWpm": 85,  "minAccuracy": 93, "minConsistency": 72},
    {"id": "ascendant", "name": "ASCENDANT", "minWpm": 95,  "minAccuracy": 94, "minConsistency": 75},
    {"id": "velocity",  "name": "VELOCITY",  "minWpm": 110, "minAccuracy": 92, "minConsistency": 78},
    {"id": "sovereign", "name": "SOVEREIGN", "minWpm": 130, "minAccuracy": 96, "minConsistency": 82},
    {"id": "apex",       "name": "APEX",       "minWpm": 150, "minAccuracy": 96, "minConsistency": 84},
    {"id": "overdrive",  "name": "OVERDRIVE",  "minWpm": 165, "minAccuracy": 97, "minConsistency": 86},
    {"id": "paragon",    "name": "PARAGON",    "minWpm": 180, "minAccuracy": 97, "minConsistency": 88},
    {"id": "eclipse",    "name": "ECLIPSE",    "minWpm": 195, "minAccuracy": 98, "minConsistency": 89},
    {"id": "dominion",   "name": "DOMINION",   "minWpm": 210, "minAccuracy": 98, "minConsistency": 90},
    {"id": "inferno",    "name": "INFERNO",    "minWpm": 225, "minAccuracy": 98, "minConsistency": 91},
    {"id": "zenith",     "name": "ZENITH",     "minWpm": 240, "minAccuracy": 98, "minConsistency": 92},
    {"id": "paradox",    "name": "PARADOX",    "minWpm": 260, "minAccuracy": 99, "minConsistency": 93},
    {"id": "eternal",    "name": "ETERNAL",    "minWpm": 280, "minAccuracy": 99, "minConsistency": 94, "minimumDuration": 120},
    {"id": "infinite",   "name": "INFINITE",   "minWpm": 300, "minAccuracy": 99, "minConsistency": 95, "minimumDuration": 120},
]


def clamp(v, lo=0.0, hi=100.0):
    return max(lo, min(hi, v))


def compute_score(wpm: float, accuracy: float, consistency: float) -> int:
    """Composite performance score (~0-1000)."""
    speed_score = min(max(wpm, 0), 160) * 4.0        # max 640
    accuracy_score = clamp(accuracy) * 2.4           # max 240
    consistency_score = clamp(consistency) * 1.2     # max 120
    return round(speed_score + accuracy_score + consistency_score)


def classify(wpm: float, accuracy: float, consistency: float, duration_seconds: float = None) -> int:
    """Return the progression index (0-19) of the highest hero unlocked.

    duration_seconds is only checked against tiers that set a
    minimumDuration (ETERNAL, INFINITE) — every other tier ignores it
    entirely, so this is a no-op for the original 10 heroes regardless of
    what's passed in.
    """
    result_index = 0
    for i, hero in enumerate(HERO_REQUIREMENTS):
        min_duration = hero.get("minimumDuration")
        duration_ok = min_duration is None or (duration_seconds is not None and duration_seconds >= min_duration)
        if (wpm >= hero["minWpm"]
                and accuracy >= hero["minAccuracy"]
                and consistency >= hero["minConsistency"]
                and duration_ok):
            result_index = i
    return result_index


def hero_id_for_index(index: int) -> str:
    index = max(0, min(index, len(HERO_REQUIREMENTS) - 1))
    return HERO_REQUIREMENTS[index]["id"]
