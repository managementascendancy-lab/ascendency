"""ASCENDANCY hero classification + performance scoring algorithm.

Deterministic classification based on WPM, Accuracy and Consistency.
A fast-but-inaccurate ascendant will NOT reach the top classes because
every requirement (speed, accuracy, consistency) must be satisfied.
"""

# Progression order NOVA -> SOVEREIGN. index == progression rank.
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
]


def clamp(v, lo=0.0, hi=100.0):
    return max(lo, min(hi, v))


def compute_score(wpm: float, accuracy: float, consistency: float) -> int:
    """Composite performance score (~0-1000)."""
    speed_score = min(max(wpm, 0), 160) * 4.0        # max 640
    accuracy_score = clamp(accuracy) * 2.4           # max 240
    consistency_score = clamp(consistency) * 1.2     # max 120
    return round(speed_score + accuracy_score + consistency_score)


def classify(wpm: float, accuracy: float, consistency: float) -> int:
    """Return the progression index (0-9) of the highest hero unlocked."""
    result_index = 0
    for i, hero in enumerate(HERO_REQUIREMENTS):
        if (wpm >= hero["minWpm"]
                and accuracy >= hero["minAccuracy"]
                and consistency >= hero["minConsistency"]):
            result_index = i
    return result_index


def hero_id_for_index(index: int) -> str:
    index = max(0, min(index, len(HERO_REQUIREMENTS) - 1))
    return HERO_REQUIREMENTS[index]["id"]
