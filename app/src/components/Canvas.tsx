"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, PIXEL_SIZE } from "@/lib/constants";
import { PALETTE } from "@/lib/colors";

const BASE_SIZE = CANVAS_WIDTH * PIXEL_SIZE; // 640
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.5;

interface CanvasProps {
  pixels: Uint8Array;
  selectedColor: number;
  onPixelClick: (x: number, y: number) => void;
  enabled: boolean;
  cooldown?: boolean;
}

export default function Canvas({
  pixels,
  selectedColor,
  onPixelClick,
  enabled,
  cooldown = false,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevPixelsRef = useRef<Uint8Array | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const flashesRef = useRef<Map<string, number>>(new Map());
  const [zoom, setZoom] = useState(1);

  const drawCanvas = useCallback(
    (ctx: CanvasRenderingContext2D, currentPixels: Uint8Array) => {
      const width = CANVAS_WIDTH * PIXEL_SIZE;
      const height = CANVAS_HEIGHT * PIXEL_SIZE;
      const now = Date.now();

      // Draw pixels
      for (let y = 0; y < CANVAS_HEIGHT; y++) {
        for (let x = 0; x < CANVAS_WIDTH; x++) {
          const colorIndex = currentPixels[y * CANVAS_WIDTH + x];
          ctx.fillStyle = PALETTE[colorIndex] || PALETTE[0];
          ctx.fillRect(
            x * PIXEL_SIZE,
            y * PIXEL_SIZE,
            PIXEL_SIZE,
            PIXEL_SIZE
          );
        }
      }

      // Flash effects
      for (const [key, time] of flashesRef.current) {
        const age = now - time;
        if (age > 350) {
          flashesRef.current.delete(key);
          continue;
        }
        const [fx, fy] = key.split(",").map(Number);
        const alpha = 1 - age / 350;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(
          fx * PIXEL_SIZE,
          fy * PIXEL_SIZE,
          PIXEL_SIZE,
          PIXEL_SIZE
        );
      }

      // Grid — very subtle
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= CANVAS_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * PIXEL_SIZE, 0);
        ctx.lineTo(x * PIXEL_SIZE, height);
        ctx.stroke();
      }
      for (let y = 0; y <= CANVAS_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * PIXEL_SIZE);
        ctx.lineTo(width, y * PIXEL_SIZE);
        ctx.stroke();
      }

      // Hover
      if (hoverPos && enabled) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(
          hoverPos.x * PIXEL_SIZE + 0.5,
          hoverPos.y * PIXEL_SIZE + 0.5,
          PIXEL_SIZE - 1,
          PIXEL_SIZE - 1
        );

        ctx.fillStyle = PALETTE[selectedColor] + "44";
        ctx.fillRect(
          hoverPos.x * PIXEL_SIZE + 1,
          hoverPos.y * PIXEL_SIZE + 1,
          PIXEL_SIZE - 2,
          PIXEL_SIZE - 2
        );
      }
    },
    [hoverPos, selectedColor, enabled]
  );

  // Main render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prev = prevPixelsRef.current;
    const now = Date.now();

    // Track changes
    if (prev) {
      for (let i = 0; i < pixels.length; i++) {
        if (prev[i] !== pixels[i]) {
          const x = i % CANVAS_WIDTH;
          const y = Math.floor(i / CANVAS_WIDTH);
          flashesRef.current.set(`${x},${y}`, now);
        }
      }
    }

    prevPixelsRef.current = new Uint8Array(pixels);
    drawCanvas(ctx, pixels);

    // Animate flashes
    if (flashesRef.current.size > 0) {
      const tick = () => {
        const c = canvasRef.current;
        const cx = c?.getContext("2d");
        if (!cx || !prevPixelsRef.current) return;
        drawCanvas(cx, prevPixelsRef.current);
        if (flashesRef.current.size > 0) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, [pixels, hoverPos, selectedColor, enabled, drawCanvas]);

  // Wheel zoom with cursor-centered scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      // Cursor position relative to the visible container
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      setZoom((prev) => {
        const direction = e.deltaY < 0 ? 1 : -1;
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + direction * ZOOM_STEP));
        if (next === prev) return prev;

        // Schedule scroll adjustment after React renders the new size
        requestAnimationFrame(() => {
          // Position in content space the cursor was pointing at
          const contentX = container.scrollLeft + cursorX;
          const contentY = container.scrollTop + cursorY;
          // Scale that position to the new zoom level
          const scale = next / prev;
          container.scrollLeft = contentX * scale - cursorX;
          container.scrollTop = contentY * scale - cursorY;
        });

        return next;
      });
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []);

  const getPixelCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor(((e.clientX - rect.left) * scaleX) / PIXEL_SIZE);
      const y = Math.floor(((e.clientY - rect.top) * scaleY) / PIXEL_SIZE);
      if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT)
        return null;
      return { x, y };
    },
    []
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!enabled) return;
      const coords = getPixelCoords(e);
      if (coords) onPixelClick(coords.x, coords.y);
    },
    [enabled, getPixelCoords, onPixelClick]
  );

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      setHoverPos(getPixelCoords(e));
    },
    [getPixelCoords]
  );

  const handleLeave = useCallback(() => setHoverPos(null), []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    const container = containerRef.current;
    if (container) {
      container.scrollLeft = 0;
      container.scrollTop = 0;
    }
  }, []);

  const canvasStyle = zoom > 1
    ? { width: BASE_SIZE * zoom, height: BASE_SIZE * zoom, imageRendering: "pixelated" as const }
    : { imageRendering: "pixelated" as const };

  return (
    <div className="canvas-container relative">
      {zoom > 1 && (
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[11px] text-[var(--text-secondary)]">
            {zoom}x zoom
          </span>
          <button
            onClick={resetZoom}
            className="font-mono text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Reset
          </button>
        </div>
      )}
      <div
        ref={containerRef}
        className="canvas-zoom-container rounded-lg border border-[var(--border)] canvas-wrap overflow-auto"
        style={{ maxWidth: BASE_SIZE, maxHeight: BASE_SIZE }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH * PIXEL_SIZE}
          height={CANVAS_HEIGHT * PIXEL_SIZE}
          className={
            !enabled ? "cursor-default opacity-60" : cooldown ? "cursor-wait opacity-80" : "cursor-crosshair"
          }
          style={canvasStyle}
          onClick={handleClick}
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
        />
      </div>
      {hoverPos && (
        <div className="absolute bottom-2 right-2 font-mono text-[10px] text-[var(--text-secondary)] bg-[var(--bg)]/90 backdrop-blur-sm px-2 py-0.5 rounded border border-[var(--border)]">
          {hoverPos.x},{hoverPos.y}
        </div>
      )}
    </div>
  );
}
