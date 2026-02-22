"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Header from "@/components/Header";
import Canvas from "@/components/Canvas";
import ColorPalette from "@/components/ColorPalette";
import ActivityFeed from "@/components/ActivityFeed";
import { useCanvas } from "@/hooks/useCanvas";
import { useEphemeralKeypair } from "@/hooks/useEphemeralKeypair";
import { usePixelPlace } from "@/hooks/usePixelPlace";

export default function Home() {
  const { publicKey } = useWallet();
  const [selectedColor, setSelectedColor] = useState(1);
  const canvas = useCanvas();
  const ephemeral = useEphemeralKeypair();
  const { placePixel } = usePixelPlace();

  const canDraw = !!publicKey && ephemeral.ready && !!ephemeral.keypair;

  const handlePixelClick = useCallback(
    (x: number, y: number) => {
      if (!canDraw || !ephemeral.keypair || !publicKey) return;
      canvas.optimisticUpdate(x, y, selectedColor, ephemeral.keypair.publicKey.toBase58());
      placePixel(x, y, selectedColor, ephemeral.keypair);
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
              />

              <ColorPalette
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
              />

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
