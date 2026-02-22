"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PublicKey } from "@solana/web3.js";
import { getCanvasPDA } from "@/lib/program";
import { erConnection } from "@/lib/connections";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PIXELS_OFFSET,
  PIXEL_COUNT_OFFSET,
  DISCRIMINATOR_SIZE,
} from "@/lib/constants";

export interface CanvasState {
  pixels: Uint8Array;
  pixelCount: number;
  lastEditor: string;
  authority: string;
  loaded: boolean;
}

const EMPTY_PIXELS = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);

export function useCanvas() {
  const [state, setState] = useState<CanvasState>({
    pixels: EMPTY_PIXELS,
    pixelCount: 0,
    lastEditor: "",
    authority: "",
    loaded: false,
  });

  const [canvasPda] = useState<PublicKey>(() => getCanvasPDA()[0]);
  const subRef = useRef<number | null>(null);

  const parseAccountData = useCallback((data: Buffer | Uint8Array) => {
    if (data.length < PIXELS_OFFSET + CANVAS_WIDTH * CANVAS_HEIGHT) return;

    const authority = new PublicKey(
      data.slice(DISCRIMINATOR_SIZE, DISCRIMINATOR_SIZE + 32)
    ).toBase58();

    const lastEditor = new PublicKey(
      data.slice(DISCRIMINATOR_SIZE + 40, DISCRIMINATOR_SIZE + 72)
    ).toBase58();

    // pixel_count is u64 LE at PIXEL_COUNT_OFFSET
    const view = new DataView(
      data.buffer,
      data.byteOffset + PIXEL_COUNT_OFFSET,
      8
    );
    const pixelCount = Number(view.getBigUint64(0, true));

    const pixels = new Uint8Array(
      data.buffer,
      data.byteOffset + PIXELS_OFFSET,
      CANVAS_WIDTH * CANVAS_HEIGHT
    ).slice(); // copy to avoid sharing buffer

    setState({ pixels, pixelCount, lastEditor, authority, loaded: true });
  }, []);

  // Optimistic update for instant feedback
  const optimisticUpdate = useCallback(
    (x: number, y: number, color: number, painter: string) => {
      setState((prev) => {
        const newPixels = new Uint8Array(prev.pixels);
        newPixels[y * CANVAS_WIDTH + x] = color;
        return {
          ...prev,
          pixels: newPixels,
          pixelCount: prev.pixelCount + 1,
          lastEditor: painter,
        };
      });
    },
    []
  );

  useEffect(() => {
    // Initial fetch
    erConnection.getAccountInfo(canvasPda).then((info) => {
      if (info?.data) parseAccountData(info.data);
    });

    // Subscribe to real-time updates
    subRef.current = erConnection.onAccountChange(
      canvasPda,
      (info) => {
        if (info.data) parseAccountData(info.data);
      },
      { commitment: "processed" }
    );

    return () => {
      if (subRef.current !== null) {
        erConnection.removeAccountChangeListener(subRef.current);
      }
    };
  }, [canvasPda, parseAccountData]);

  return { ...state, canvasPda, optimisticUpdate };
}
