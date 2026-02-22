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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg)]/90 backdrop-blur-xl border-b border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-5 h-13 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <h1 className="text-[15px] font-800 tracking-[-0.03em] text-[var(--text-primary)]">
            SolPlace
          </h1>
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-secondary)]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{pixelCount.toLocaleString()} px</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {walletConnected && !canDraw && (
            <button
              onClick={onStartDrawing}
              disabled={funding}
              className="h-8 px-3.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-wait text-white text-[13px] font-600 rounded-lg transition-colors"
            >
              {funding ? "Funding..." : "Start Drawing"}
            </button>
          )}
          {canDraw && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ready
            </div>
          )}
          <WalletMultiButton
            style={{
              backgroundColor: "var(--surface)",
              height: "32px",
              fontSize: "13px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "0 12px",
            }}
          />
        </div>
      </div>
    </header>
  );
}
