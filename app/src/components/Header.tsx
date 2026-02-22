"use client";

import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (m) => m.WalletMultiButton
    ),
  { ssr: false }
);

interface HeaderProps {
  pixelCount: number;
  onStartDrawing: () => void;
  canDraw: boolean;
  funding: boolean;
  walletConnected: boolean;
}

export default function Header({
  pixelCount,
  onStartDrawing,
  canDraw,
  funding,
  walletConnected,
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-white tracking-tight">
            Sol<span className="text-purple-400">Place</span>
          </h1>
          <div className="hidden sm:flex items-center gap-2 text-xs text-white/40 bg-white/[0.04] px-3 py-1.5 rounded-full border border-white/[0.06]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono">{pixelCount.toLocaleString()}</span>
            <span>pixels placed</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {walletConnected && !canDraw && (
            <button
              onClick={onStartDrawing}
              disabled={funding}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-purple-900 disabled:to-purple-800 disabled:cursor-wait text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-purple-600/20"
            >
              {funding ? "Funding..." : "Start Drawing"}
            </button>
          )}
          {canDraw && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Drawing
            </div>
          )}
          <WalletMultiButton
            style={{
              backgroundColor: "rgba(139, 92, 246, 0.2)",
              height: "36px",
              fontSize: "13px",
              borderRadius: "8px",
              border: "1px solid rgba(139, 92, 246, 0.15)",
            }}
          />
        </div>
      </div>
    </header>
  );
}
