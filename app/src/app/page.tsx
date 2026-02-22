"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Header from "@/components/Header";
import Canvas from "@/components/Canvas";
import ColorPalette from "@/components/ColorPalette";
import ActivityFeed from "@/components/ActivityFeed";
import { useCanvas } from "@/hooks/useCanvas";
import { useEphemeralKeypair } from "@/hooks/useEphemeralKeypair";
import { usePixelPlace } from "@/hooks/usePixelPlace";
import { PALETTE } from "@/lib/colors";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/constants";

export default function Home() {
  const { publicKey } = useWallet();
  const [selectedColor, setSelectedColor] = useState(1);
  const canvas = useCanvas();
  const ephemeral = useEphemeralKeypair();
  const { placePixel } = usePixelPlace();

  const canDraw = !!publicKey && ephemeral.ready && !!ephemeral.keypair;

  // Cooldown: prevent rapid clicks
  const cooldownUntilRef = useRef(0);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  const downloadCanvas = useCallback(() => {
    const scale = 10;
    const offscreen = document.createElement("canvas");
    offscreen.width = CANVAS_WIDTH * scale;
    offscreen.height = CANVAS_HEIGHT * scale;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      for (let x = 0; x < CANVAS_WIDTH; x++) {
        ctx.fillStyle = PALETTE[canvas.pixels[y * CANVAS_WIDTH + x]] || PALETTE[0];
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    const link = document.createElement("a");
    link.download = `solplace-${Date.now()}.png`;
    link.href = offscreen.toDataURL("image/png");
    link.click();
  }, [canvas.pixels]);

  const handlePixelClick = useCallback(
    (x: number, y: number) => {
      if (!canDraw || !ephemeral.keypair || !publicKey) return;
      if (Date.now() < cooldownUntilRef.current) return;

      canvas.optimisticUpdate(x, y, selectedColor, ephemeral.keypair.publicKey.toBase58());
      placePixel(x, y, selectedColor, ephemeral.keypair);

      cooldownUntilRef.current = Date.now() + 500;
      setIsCoolingDown(true);
      cooldownTimerRef.current = setTimeout(() => setIsCoolingDown(false), 500);
    },
    [canDraw, ephemeral.keypair, publicKey, selectedColor, canvas, placePixel]
  );

  return (
    <>
      <Header
        pixelCount={canvas.pixelCount}
        onStartDrawing={ephemeral.setup}
        canDraw={canDraw}
        funding={ephemeral.funding}
        walletConnected={!!publicKey}
      />

      <main className="pt-16 pb-12 px-4 min-h-screen">
        {!canvas.loaded ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] gap-3">
            <div className="w-8 h-8 border border-[var(--border)] border-t-[var(--text-secondary)] rounded-full animate-spin" />
            <p className="text-[13px] text-[var(--text-tertiary)] font-mono">
              Connecting to ephemeral rollup...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 max-w-[960px] mx-auto min-h-[calc(100vh-7rem)] items-start pt-6">
            {/* Canvas column */}
            <div className="flex flex-col items-center gap-4">
              <Canvas
                pixels={canvas.pixels}
                selectedColor={selectedColor}
                onPixelClick={handlePixelClick}
                enabled={canDraw}
                cooldown={isCoolingDown}
              />

              <div className="flex items-center gap-3">
                <ColorPalette
                  selectedColor={selectedColor}
                  onSelectColor={setSelectedColor}
                />

                <button
                  onClick={downloadCanvas}
                  title="Download canvas as PNG"
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[rgba(255,255,255,0.1)] transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2v8m0 0l-3-3m3 3l3-3M3 12h10" />
                  </svg>
                </button>
              </div>

              {!publicKey && (
                <p className="text-[13px] text-[var(--text-tertiary)] text-center max-w-sm leading-relaxed">
                  Connect a wallet to start placing pixels. Each placement is an
                  on-chain transaction on MagicBlock&apos;s Ephemeral Rollup.
                </p>
              )}

              <footer className="mt-6 text-[11px] text-[var(--text-tertiary)] font-mono tracking-wide">
                Powered by{" "}
                <a
                  href="https://www.magicblock.gg/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  MagicBlock
                </a>{" "}
                on Solana
              </footer>
            </div>

            {/* Activity feed column */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl h-[480px] lg:sticky lg:top-20 overflow-hidden">
              <ActivityFeed activity={canvas.activity} />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
