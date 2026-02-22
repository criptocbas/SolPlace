"use client";

import { useState } from "react";
import { PALETTE } from "@/lib/colors";
import type { ActivityItem } from "@/hooks/useCanvas";

function truncateAddress(addr: string): string {
  if (addr.length <= 8) return addr;
  return `${addr.slice(0, 4)}..${addr.slice(-4)}`;
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return "now";
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

interface ActivityFeedProps {
  activity: ActivityItem[];
}

export default function ActivityFeed({ activity }: ActivityFeedProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-3 right-3 z-10">
      {open && (
        <div className="mb-2 w-64 max-h-56 bg-[var(--bg)]/95 backdrop-blur-xl border border-[var(--border)] rounded-lg overflow-hidden shadow-lg shadow-black/30 animate-[feed-panel-in_0.15s_ease-out]">
          <div className="overflow-y-auto max-h-56">
            {activity.length === 0 ? (
              <p className="text-[11px] text-[var(--text-tertiary)] font-mono px-3 py-4 text-center">
                No activity yet
              </p>
            ) : (
              <ul className="py-1">
                {activity.slice(0, 20).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 animate-[feed-in_0.2s_ease-out]"
                  >
                    <span
                      className="w-2 h-2 rounded-sm flex-shrink-0 border border-white/10"
                      style={{ backgroundColor: PALETTE[item.color] || "#000" }}
                    />
                    <span className="text-[11px] font-mono text-[var(--text-secondary)] truncate">
                      {truncateAddress(item.painter)}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
                      ({item.x},{item.y})
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)] ml-auto flex-shrink-0">
                      {timeAgo(item.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg)]/90 backdrop-blur-xl border border-[var(--border)] hover:border-[rgba(255,255,255,0.1)] transition-all text-[11px] font-mono text-[var(--text-secondary)]"
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live
        {activity.length > 0 && (
          <span className="text-[var(--text-tertiary)]">{activity.length}</span>
        )}
      </button>
    </div>
  );
}
