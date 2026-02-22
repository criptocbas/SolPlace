"use client";

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
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 py-2.5 border-b border-[var(--border)] flex-shrink-0">
        <h2 className="text-[11px] font-mono uppercase tracking-widest text-[var(--text-tertiary)]">
          Live Activity
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {activity.length === 0 ? (
          <p className="text-[12px] text-[var(--text-tertiary)] font-mono px-3 py-4 text-center">
            No activity yet
          </p>
        ) : (
          <ul className="py-1">
            {activity.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 px-3 py-1.5 animate-[feed-in_0.25s_ease-out]"
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0 border border-white/10"
                  style={{ backgroundColor: PALETTE[item.color] || "#000" }}
                />
                <span className="text-[12px] font-mono text-[var(--text-secondary)] truncate">
                  {truncateAddress(item.painter)}
                </span>
                <span className="text-[12px] font-mono text-[var(--text-tertiary)]">
                  ({item.x},{item.y})
                </span>
                <span className="text-[11px] font-mono text-[var(--text-tertiary)] ml-auto flex-shrink-0">
                  {timeAgo(item.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
