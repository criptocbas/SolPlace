"use client";

import { PALETTE, PALETTE_NAMES } from "@/lib/colors";

const SHORTCUT_KEYS = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "Q", "W", "E", "R", "T", "Y",
];

interface ColorPaletteProps {
  selectedColor: number;
  onSelectColor: (index: number) => void;
}

export default function ColorPalette({
  selectedColor,
  onSelectColor,
}: ColorPaletteProps) {
  return (
    <div className="flex items-center gap-1 p-1.5 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
      {PALETTE.map((color, i) => (
        <button
          key={i}
          onClick={() => onSelectColor(i)}
          className={`relative w-7 h-7 rounded-md transition-all duration-100 group ${
            selectedColor === i
              ? "ring-1.5 ring-white/80 ring-offset-1 ring-offset-[var(--surface)] scale-115"
              : "hover:scale-110 hover:brightness-110"
          }`}
          style={{ backgroundColor: color }}
          title={`${PALETTE_NAMES[i]} (${SHORTCUT_KEYS[i]})`}
        >
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold opacity-0 group-hover:opacity-60 transition-opacity text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {SHORTCUT_KEYS[i]}
          </span>
        </button>
      ))}
    </div>
  );
}
