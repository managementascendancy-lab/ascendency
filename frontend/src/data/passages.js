// Simulation text passages. Neutral, punctuation-rich, technical tone.

export const PASSAGES = [
  "The system measures more than raw speed. It observes the rhythm between each keystroke, the intervals where hesitation lives, and the precision that separates an operator from a machine. Ascension is not granted to the fastest alone.",
  "Precision is a discipline. A single misplaced character propagates through the entire sequence, distorting the signal the network is trying to read. Type deliberately, and the analysis will reward the clarity of your intent.",
  "Every simulation is a snapshot of your current state. The performance core does not judge you against others in this moment; it maps your speed, your accuracy, and your consistency onto a single trajectory toward the next classification.",
  "Consistency is the quiet metric. Anyone can produce a burst of speed for a heartbeat, but sustaining a steady cadence across the full duration is what the network respects. Steady input builds an unshakable profile.",
  "The neural trace follows your fingers across the interface, translating motion into data and data into progression. When you find your rhythm, the trace steadies, the core stabilizes, and the system recognizes an ascendant taking shape.",
  "Speed without control is noise. Control without speed is stagnation. The heroes of the Ascendancy exist at the intersection of both, where velocity is disciplined and precision is fast. Aim for that convergence with every line.",
  "Focus on the word in front of you, not the paragraph ahead. The simulation rewards presence. When your attention narrows to a single moving cursor, errors fade and the numbers climb without effort or strain.",
  "This network was built to identify potential and refine it. Each attempt sharpens the signal. Return often, push the threshold, and watch your classification rise as your hands learn the language of the machine.",
  "Every keystroke carries weight. The system does not forgive carelessness, but it does not punish effort either — it simply records what happened and lets the numbers speak for themselves.",
  "There is a difference between typing fast and typing well. Fast fades under pressure; well endures it. The Ascendancy was built to measure which one you actually possess.",
  "Muscle memory is earned, not given. Repetition trains the hand until the mind no longer has to translate thought into motion, and the two become one continuous signal.",
  "A single simulation tells you where you stand. A hundred simulations tell you where you are going. Track your trajectory, not just your score.",
  "The gap between NOVA and SOVEREIGN is not talent, it is repetition compounded over time. Every ascendant who reached the top once stood exactly where you are now.",
  "Errors are not failures, they are data points. The network studies your mistakes as closely as your successes, because both reveal the true shape of your ability.",
  "Breathe before you begin. Tension in the shoulders becomes tension in the fingers, and tension in the fingers becomes hesitation on the screen. Calm hands type faster than anxious ones.",
  "The best operators do not chase the highest word count, they chase the cleanest signal. Speed is a byproduct of clarity, not a substitute for it.",
  "Some ascendants burn bright and fade within a single duration. Others build slowly, sustaining their rhythm from the first character to the last. The network favors the latter.",
  "Your accuracy score is a mirror. It reflects exactly how much attention you gave the passage in front of you, second by second, character by character.",
  "Classification is not a ceiling, it is a checkpoint. Every hero on this archive once ranked lower than you do today. The path upward is open to anyone willing to keep training.",
  "The interface does not care about your best day or your worst. It only cares about this one: the simulation currently running, the cursor currently blinking, the next character waiting.",
];

export function randomPassage() {
  return PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
}

// Build a long text stream from multiple passages for long simulations.
export function buildStream(minChars = 900) {
  let text = "";
  while (text.length < minChars) {
    text += (text ? " " : "") + randomPassage();
  }
  return text;
}
