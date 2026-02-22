"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, PIXEL_SIZE } from "@/lib/constants";
import { PALETTE } from "@/lib/colors";

const BASE_SIZE = CANVAS_WIDTH * PIXEL_SIZE; // 640
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.5;
const MINIMAP_SIZE = 120;
const MINIMAP_PX = MINIMAP_SIZE / CANVAS_WIDTH; // px per pixel in minimap

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
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevPixelsRef = useRef<Uint8Array | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const flashesRef = useRef<Map<string, number>>(new Map());
  const [zoom, setZoom] = useState(1);
  const scrollPosRef = useRef({ left: 0, top: 0 });

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

  // Draw minimap whenever pixels change
  useEffect(() => {
    if (zoom <= 1) return;
    const mc = minimapRef.current;
    if (!mc) return;
    const ctx = mc.getContext("2d");
    if (!ctx) return;

    // Draw pixels
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      for (let x = 0; x < CANVAS_WIDTH; x++) {
        ctx.fillStyle = PALETTE[pixels[y * CANVAS_WIDTH + x]] || PALETTE[0];
        ctx.fillRect(x * MINIMAP_PX, y * MINIMAP_PX, MINIMAP_PX, MINIMAP_PX);
      }
    }

    // Viewport rectangle
    const container = containerRef.current;
    if (container) {
      const totalW = BASE_SIZE * zoom;
      const totalH = BASE_SIZE * zoom;
      const vx = (scrollPosRef.current.left / totalW) * MINIMAP_SIZE;
      const vy = (scrollPosRef.current.top / totalH) * MINIMAP_SIZE;
      const vw = (container.clientWidth / totalW) * MINIMAP_SIZE;
      const vh = (container.clientHeight / totalH) * MINIMAP_SIZE;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(vx + 0.5, vy + 0.5, vw, vh);
    }
  }, [pixels, zoom]);

  // Track scroll position for minimap viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      scrollPosRef.current = { left: container.scrollLeft, top: container.scrollTop };
      // Redraw minimap viewport
      const mc = minimapRef.current;
      if (!mc || zoom <= 1) return;
      const ctx = mc.getContext("2d");
      if (!ctx) return;

      // Redraw pixels (fast enough at 120x120)
      for (let y = 0; y < CANVAS_HEIGHT; y++) {
        for (let x = 0; x < CANVAS_WIDTH; x++) {
          ctx.fillStyle = PALETTE[pixels[y * CANVAS_WIDTH + x]] || PALETTE[0];
          ctx.fillRect(x * MINIMAP_PX, y * MINIMAP_PX, MINIMAP_PX, MINIMAP_PX);
        }
      }

      const totalW = BASE_SIZE * zoom;
      const totalH = BASE_SIZE * zoom;
      const vx = (container.scrollLeft / totalW) * MINIMAP_SIZE;
      const vy = (container.scrollTop / totalH) * MINIMAP_SIZE;
      const vw = (container.clientWidth / totalW) * MINIMAP_SIZE;
      const vh = (container.clientHeight / totalH) * MINIMAP_SIZE;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(vx + 0.5, vy + 0.5, vw, vh);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [pixels, zoom]);

  // Minimap click to navigate
  const handleMinimapClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      // Convert minimap coords to content coords, center viewport there
      const totalW = BASE_SIZE * zoom;
      const totalH = BASE_SIZE * zoom;
      const targetX = (mx / MINIMAP_SIZE) * totalW - container.clientWidth / 2;
      const targetY = (my / MINIMAP_SIZE) * totalH - container.clientHeight / 2;
      container.scrollLeft = Math.max(0, targetX);
      container.scrollTop = Math.max(0, targetY);
    },
    [zoom]
  );

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
        className="rounded-lg border border-[var(--border)] canvas-wrap overflow-hidden"
        style={{ maxWidth: BASE_SIZE, maxHeight: BASE_SIZE }}
      >
      <div
        ref={containerRef}
        className="canvas-zoom-container overflow-auto"
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
      </div>
      {zoom > 1 && (
        <canvas
          ref={minimapRef}
          width={MINIMAP_SIZE}
          height={MINIMAP_SIZE}
          onClick={handleMinimapClick}
          className="absolute top-3 left-3 z-10 rounded border border-[var(--border)] cursor-pointer shadow-lg shadow-black/40"
          style={{ width: MINIMAP_SIZE, height: MINIMAP_SIZE, imageRendering: "pixelated" }}
        />
      )}
      {hoverPos && (
        <div className="absolute bottom-2 right-2 font-mono text-[10px] text-[var(--text-secondary)] bg-[var(--bg)]/90 backdrop-blur-sm px-2 py-0.5 rounded border border-[var(--border)]">
          {hoverPos.x},{hoverPos.y}
        </div>
      )}
    </div>
  );
}
