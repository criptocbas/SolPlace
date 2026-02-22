"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Header from "@/components/Header";
import Canvas from "@/components/Canvas";
import ColorPalette from "@/components/ColorPalette";
import { useCanvas } from "@/hooks/useCanvas";
import { useEphemeralKeypair } from "@/hooks/useEphemeralKeypair";
import { usePixelPlace } from "@/hooks/usePixelPlace";

export default function Home() {
  const { publicKey } = useWallet();
  const [selectedColor, setSelectedColor] = useState(1); // White default
  const canvas = useCanvas();
  const ephemeral = useEphemeralKeypair();
  const { placePixel } = usePixelPlace();

  const canDraw = !!publicKey && ephemeral.ready && !!ephemeral.keypair;

  const handlePixelClick = useCallback(
    (x: number, y: number) => {
      if (!canDraw || !ephemeral.keypair || !publicKey) return;

      // Optimistic update
      canvas.optimisticUpdate(x, y, selectedColor, publicKey.toBase58());

      // Send tx to ER
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
      <main className="pt-18 pb-8 flex flex-col items-center gap-5 px-4 min-h-screen">
        {!canvas.loaded ? (
          <div className="flex flex-col items-center justify-center h-[640px] gap-4">
            <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
            <div className="text-white/40 text-sm">Loading canvas from ER...</div>
          </div>
        ) : (
          <>
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
              <div className="text-center text-white/30 text-sm mt-2 max-w-md">
                Connect your wallet and click &quot;Start Drawing&quot; to place pixels
              </div>
            )}

            <div className="text-center text-white/20 text-[11px] mt-4">
              Powered by{" "}
              <a
                href="https://www.magicblock.gg/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400/40 hover:text-purple-400 transition-colors"
              >
                MagicBlock
              </a>{" "}
              Ephemeral Rollups on Solana
            </div>
          </>
        )}
      </main>
    </>
  );
}
