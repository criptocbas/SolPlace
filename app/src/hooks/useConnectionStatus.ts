"use client";

import { useState, useEffect, useRef } from "react";
import { erConnection } from "@/lib/connections";

export type ConnectionStatus = "connected" | "disconnected" | "checking";

export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const check = () => {
      setStatus((prev) => (prev === "disconnected" ? "checking" : prev));
      erConnection
        .getSlot("processed")
        .then(() => setStatus("connected"))
        .catch(() => setStatus("disconnected"));
    };

    check();
    intervalRef.current = setInterval(check, 10_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return status;
}
