"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, PIXEL_SIZE } from "@/lib/constants";
import { PALETTE } from "@/lib/colors";

interface CanvasProps {
  pixels: Uint8Array;
  selectedColor: number;
  onPixelClick: (x: number, y: number) => void;
  enabled: boolean;
}

export default function Canvas({
  pixels,
  selectedColor,
  onPixelClick,
  enabled,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevPixelsRef = useRef<Uint8Array | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const flashesRef = useRef<Map<string, number>>(new Map());

  // Render the canvas whenever pixels change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = CANVAS_WIDTH * PIXEL_SIZE;
    const height = CANVAS_HEIGHT * PIXEL_SIZE;

    // Track pixel changes for flash effect
    const prev = prevPixelsRef.current;
    const now = Date.now();

    // Draw pixels
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      for (let x = 0; x < CANVAS_WIDTH; x++) {
        const idx = y * CANVAS_WIDTH + x;
        const colorIndex = pixels[idx];

        // Detect changed pixels
        if (prev && prev[idx] !== colorIndex) {
          flashesRef.current.set(`${x},${y}`, now);
        }

        ctx.fillStyle = PALETTE[colorIndex] || PALETTE[0];
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      }
    }

    prevPixelsRef.current = new Uint8Array(pixels);

    // Draw flash effects on recently changed pixels
    for (const [key, time] of flashesRef.current) {
      const age = now - time;
      if (age > 400) {
        flashesRef.current.delete(key);
        continue;
      }
      const [fx, fy] = key.split(",").map(Number);
      const alpha = 1 - age / 400;
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        fx * PIXEL_SIZE - 1,
        fy * PIXEL_SIZE - 1,
        PIXEL_SIZE + 2,
        PIXEL_SIZE + 2
      );
    }

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
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

    // Draw hover highlight
    if (hoverPos && enabled) {
      // Outer glow
      ctx.strokeStyle = `${PALETTE[selectedColor]}66`;
      ctx.lineWidth = 3;
      ctx.strokeRect(
        hoverPos.x * PIXEL_SIZE - 1,
        hoverPos.y * PIXEL_SIZE - 1,
        PIXEL_SIZE + 2,
        PIXEL_SIZE + 2
      );

      // Inner border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(
        hoverPos.x * PIXEL_SIZE,
        hoverPos.y * PIXEL_SIZE,
        PIXEL_SIZE,
        PIXEL_SIZE
      );

      // Preview color
      ctx.fillStyle = PALETTE[selectedColor] + "55";
      ctx.fillRect(
        hoverPos.x * PIXEL_SIZE + 1,
        hoverPos.y * PIXEL_SIZE + 1,
        PIXEL_SIZE - 2,
        PIXEL_SIZE - 2
      );
    }

    // Continue flash animation if active
    if (flashesRef.current.size > 0) {
      requestAnimationFrame(() => {
        // Trigger re-render by updating a dep - we use the pixels ref
        const c = canvasRef.current;
        if (c) {
          const e = new CustomEvent("flashtick");
          c.dispatchEvent(e);
        }
      });
    }
  }, [pixels, hoverPos, selectedColor, enabled]);

  // Listen to flash tick events to keep animating
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handler = () => {
      // Force a re-render of the canvas
      const ctx = canvas.getContext("2d");
      if (!ctx || !prevPixelsRef.current) return;

      const width = CANVAS_WIDTH * PIXEL_SIZE;
      const height = CANVAS_HEIGHT * PIXEL_SIZE;
      const now = Date.now();
      const pxls = prevPixelsRef.current;

      for (let y = 0; y < CANVAS_HEIGHT; y++) {
        for (let x = 0; x < CANVAS_WIDTH; x++) {
          const colorIndex = pxls[y * CANVAS_WIDTH + x];
          ctx.fillStyle = PALETTE[colorIndex] || PALETTE[0];
          ctx.fillRect(
            x * PIXEL_SIZE,
            y * PIXEL_SIZE,
            PIXEL_SIZE,
            PIXEL_SIZE
          );
        }
      }

      for (const [key, time] of flashesRef.current) {
        const age = now - time;
        if (age > 400) {
          flashesRef.current.delete(key);
          continue;
        }
        const [fx, fy] = key.split(",").map(Number);
        const alpha = 1 - age / 400;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          fx * PIXEL_SIZE - 1,
          fy * PIXEL_SIZE - 1,
          PIXEL_SIZE + 2,
          PIXEL_SIZE + 2
        );
      }

      // Grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
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

      if (flashesRef.current.size > 0) {
        requestAnimationFrame(() => canvas.dispatchEvent(new CustomEvent("flashtick")));
      }
    };

    canvas.addEventListener("flashtick", handler);
    return () => canvas.removeEventListener("flashtick", handler);
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
      const coords = getPixelCoords(e);
      setHoverPos(coords);
    },
    [getPixelCoords]
  );

  const handleLeave = useCallback(() => {
    setHoverPos(null);
  }, []);

  return (
    <div className="canvas-container relative">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH * PIXEL_SIZE}
        height={CANVAS_HEIGHT * PIXEL_SIZE}
        className={`border border-white/10 rounded-xl canvas-glow ${
          enabled ? "cursor-crosshair" : "cursor-not-allowed opacity-50"
        }`}
        style={{ imageRendering: "pixelated" }}
        onClick={handleClick}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      />
      {hoverPos && (
        <div className="absolute bottom-3 right-3 bg-black/90 backdrop-blur-sm text-white/70 text-xs px-2.5 py-1 rounded-md font-mono border border-white/10">
          ({hoverPos.x}, {hoverPos.y})
        </div>
      )}
    </div>
  );
}
