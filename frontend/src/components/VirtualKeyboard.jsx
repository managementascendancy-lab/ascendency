import React, { useState } from "react";
import { Delete } from "lucide-react";

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

// Covers exactly the character set the English passages use (letters via
// shift, space, apostrophe, comma, period, colon) — every character a
// simulation can actually require is reachable from this layout, so no one
// using it can get stuck unable to type the next character.
function Key({ label, onPress, wide, active, ariaLabel }) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      aria-label={ariaLabel || label}
      className={`flex h-11 items-center justify-center border font-mono text-sm transition-colors ${
        wide ? "flex-[2.2]" : "flex-1"
      } ${
        active
          ? "border-gold-bright bg-gold-bright text-navy-dark"
          : "border-bronze/50 bg-navy text-cream active:bg-bronze/30"
      }`}
    >
      {label}
    </button>
  );
}

export default function VirtualKeyboard({ onChar, onBackspace }) {
  const [shift, setShift] = useState(false);

  const pressLetter = (letter) => {
    onChar(shift ? letter.toUpperCase() : letter);
    if (shift) setShift(false);
  };

  return (
    <div
      data-testid="virtual-keyboard"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-bronze/40 bg-navy-dark/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-[520px] flex-col gap-1.5">
        <div className="flex justify-center gap-1.5">
          {ROWS[0].map((k) => (
            <Key key={k} label={shift ? k.toUpperCase() : k} onPress={() => pressLetter(k)} />
          ))}
        </div>
        <div className="flex justify-center gap-1.5 px-3">
          {ROWS[1].map((k) => (
            <Key key={k} label={shift ? k.toUpperCase() : k} onPress={() => pressLetter(k)} />
          ))}
        </div>
        <div className="flex justify-center gap-1.5">
          <Key label="⇧" ariaLabel="Shift" onPress={() => setShift((s) => !s)} active={shift} />
          {ROWS[2].map((k) => (
            <Key key={k} label={shift ? k.toUpperCase() : k} onPress={() => pressLetter(k)} />
          ))}
          <Key label={<Delete size={16} />} ariaLabel="Backspace" onPress={onBackspace} />
        </div>
        <div className="flex justify-center gap-1.5">
          <Key label="," onPress={() => onChar(",")} />
          <Key label=":" onPress={() => onChar(":")} />
          <Key label="space" wide onPress={() => onChar(" ")} ariaLabel="Space" />
          <Key label="." onPress={() => onChar(".")} />
          <Key label="'" onPress={() => onChar("'")} />
        </div>
      </div>
    </div>
  );
}
