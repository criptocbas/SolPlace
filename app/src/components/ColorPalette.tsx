"use client";

import { PALETTE, PALETTE_NAMES } from "@/lib/colors";

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
          className={`w-7 h-7 rounded-md transition-all duration-100 ${
            selectedColor === i
              ? "ring-1.5 ring-white/80 ring-offset-1 ring-offset-[var(--surface)] scale-115"
              : "hover:scale-110 hover:brightness-110"
          }`}
          style={{ backgroundColor: color }}
          title={PALETTE_NAMES[i]}
        />
      ))}
    </div>
  );
}
