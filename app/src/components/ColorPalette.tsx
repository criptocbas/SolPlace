"use client";

import { PALETTE } from "@/lib/colors";

interface ColorPaletteProps {
  selectedColor: number;
  onSelectColor: (index: number) => void;
}

export default function ColorPalette({
  selectedColor,
  onSelectColor,
}: ColorPaletteProps) {
  return (
    <div className="flex flex-wrap gap-1.5 justify-center max-w-[320px] bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
      {PALETTE.map((color, i) => (
        <button
          key={i}
          onClick={() => onSelectColor(i)}
          className={`w-9 h-9 rounded-lg transition-all duration-100 ${
            selectedColor === i
              ? "ring-2 ring-white ring-offset-2 ring-offset-[#06060a] scale-110"
              : "hover:scale-105 border border-white/10"
          }`}
          style={{
            backgroundColor: color,
            boxShadow:
              selectedColor === i ? `0 0 20px ${color}50` : undefined,
          }}
          title={`Color ${i}`}
        />
      ))}
    </div>
  );
}
