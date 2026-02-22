"use client";

import dynamic from "next/dynamic";
import type { ConnectionStatus } from "@/hooks/useConnectionStatus";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (m) => m.WalletMultiButton
    ),
  { ssr: false }
);

const STATUS_DOT: Record<ConnectionStatus, string> = {
  connected: "bg-emerald-500 animate-pulse",
  disconnected: "bg-red-500",
  checking: "bg-yellow-500 animate-pulse",
};

const STATUS_TITLE: Record<ConnectionStatus, string> = {
  connected: "Connected to ephemeral rollup",
  disconnected: "Disconnected from ephemeral rollup",
  checking: "Checking connection...",
};

interface HeaderProps {
  pixelCount: number;
  canDraw: boolean;
  funding: boolean;
  walletConnected: boolean;
  connectionStatus: ConnectionStatus;
}

export default function Header({
  pixelCount,
  canDraw,
  funding,
  walletConnected,
  connectionStatus,
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg)]/90 backdrop-blur-xl border-b border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-5 h-13 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <h1 className="text-[15px] font-800 tracking-[-0.03em] text-[var(--text-primary)]">
            SolPlace
          </h1>
          <div
            className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-secondary)]"
            title={STATUS_TITLE[connectionStatus]}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_DOT[connectionStatus]}`} />
            <span>{pixelCount.toLocaleString()} px</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {walletConnected && funding && (
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] font-mono">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              Setting up...
            </div>
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
