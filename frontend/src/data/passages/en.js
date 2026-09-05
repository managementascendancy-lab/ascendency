// Simulation text passages. Neutral, punctuation-rich, technical tone.
// Organized into topics on the concept of heroism, selectable by the user.
// This is the canonical English set; topic keys here define the full set
// iterated by the UI (see passages/index.js). Other locale files only need
// to supply passages for these same keys.

export const TOPICS = [
  {
    key: "courage",
    label: "COURAGE",
    passages: [
      "Courage is not the absence of fear, it is the decision that something else matters more than the fear itself. Every hero who ever mattered was afraid first and brave second.",
      "The bravest act is rarely loud. It is the quiet choice to step forward when stepping back would be easier and no one would blame you for it.",
      "Fear narrows the mind to the danger in front of it. Courage widens it again, just enough to see the person who needs help standing right behind that danger.",
      "Nobody is fearless. The ones we call heroes simply refused to let fear cast the final vote on what they did next.",
      "A single decision, made in a single second, can outweigh a lifetime of comfortable silence. That is the arithmetic courage runs on.",
    ],
  },
  {
    key: "sacrifice",
    label: "SACRIFICE",
    passages: [
      "Sacrifice is giving up something you cannot get back, for someone who may never know what it cost you. That is the quiet arithmetic behind every act of heroism.",
      "Heroes are not measured by what they gained but by what they were willing to lose, and how little they expected in return for losing it.",
      "The truest sacrifices are rarely witnessed. Most heroism happens in rooms with no audience, decided by people who will never be thanked for it.",
      "To give something up freely, expecting nothing back, is the oldest definition of heroism there is, and still the hardest one to live up to.",
      "Some sacrifices are sudden and visible. Others are slow, invisible, and stretched across years, carried quietly by people no one ever calls heroes.",
    ],
  },
  {
    key: "legacy",
    label: "LEGACY",
    passages: [
      "A legacy is not what a hero leaves behind, it is what continues moving forward long after they have stopped moving at all.",
      "We remember heroes not for the size of their victory but for how their example kept teaching people long after the moment had passed.",
      "The measure of a legacy is simple: did it make the next person's courage a little easier to find than it was for the one who came before them.",
      "Stories about heroes outlive the heroes themselves, and it is the story, told and retold, that keeps doing the work the person no longer can.",
      "Every act of heroism plants something. Most of what grows from it will be seen by people who never knew the name of who planted it.",
    ],
  },
  {
    key: "adversity",
    label: "ADVERSITY",
    passages: [
      "Adversity does not build character, it reveals what was already there, tested under pressure no comfortable day would ever apply.",
      "The hardest part of any struggle is rarely the struggle itself. It is choosing, every single morning, to keep meeting it without flinching.",
      "Heroes are not people who never fall. They are people who treat falling as information and getting back up as the only real decision left.",
      "Obstacles do not care how prepared you feel. What separates people is not the size of the obstacle but the size of the response to it.",
      "Resilience is not one dramatic moment of strength. It is a thousand small refusals to quit, most of which nobody will ever see.",
    ],
  },
  {
    key: "awakening",
    label: "AWAKENING",
    passages: [
      "Heroism rarely announces itself in advance. It usually looks like an ordinary person who simply refused to look away at the wrong moment.",
      "Nobody wakes up a hero. They wake up ordinary, face a decision no one prepared them for, and answer it in a way that becomes extraordinary in hindsight.",
      "The line between an ordinary life and an extraordinary one is thinner than people think, and most of us cross it without noticing we did.",
      "History remembers a handful of names, but heroism has always been distributed among ordinary people who happened to act when it counted.",
      "You do not need a title, a costume, or an audience to be a hero. You need a moment, a choice, and the will to choose correctly under pressure.",
    ],
  },
];
