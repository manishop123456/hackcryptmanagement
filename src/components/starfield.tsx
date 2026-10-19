// FILE: src/components/starfield.tsx
"use client";

// A tiny canvas starfield, used on the login screen and very faintly behind the app.
// Deliberately minimal: no 3D library, no scroll effects. Star positions come from a
// fixed seed so the field is identical on every render (no hydration mismatch) and
// nothing here reads or sends data.

import * as React from "react";

import { cn } from "@/lib/utils";

type Star = {
  x: number;
  y: number;
  radius: number;
  phase: number;
  period: number;
  cyan: boolean;
};

/** Deterministic PRNG so the same field is drawn every time. */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ACCENT = "#00e5ff";
const WHITE = "#ffffff";

export function Starfield({
  density = 90,
  opacity = 1,
  className,
}: {
  density?: number;
  opacity?: number;
  className?: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let stars: Star[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let timer = 0;

    const build = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      if (width === 0 || height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Scale the count with the viewport so a phone and a laptop look equally sparse.
      const areaScale = Math.max(0.55, Math.min(1.9, (width * height) / (420 * 780)));
      const count = Math.round(density * areaScale);
      const rand = mulberry32(20270108);

      stars = Array.from({ length: count }, () => ({
        x: rand() * width,
        y: rand() * height,
        radius: 0.4 + rand() * 1.05,
        phase: rand() * Math.PI * 2,
        period: 3200 + rand() * 5200,
        cyan: rand() > 0.28,
      }));
    };

    const paint = (elapsed: number) => {
      context.clearRect(0, 0, width, height);
      for (const star of stars) {
        const twinkle = reduceMotion
          ? 0.75
          : 0.55 + 0.45 * Math.sin((elapsed / star.period) * Math.PI * 2 + star.phase);
        context.globalAlpha = twinkle;
        context.fillStyle = star.cyan ? ACCENT : WHITE;
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    };

    const loop = (elapsed: number) => {
      paint(elapsed);
      frame = window.requestAnimationFrame(loop);
    };

    const start = () => {
      build();
      window.cancelAnimationFrame(frame);
      if (reduceMotion) {
        paint(0);
        return;
      }
      frame = window.requestAnimationFrame(loop);
    };

    const handleResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(start, 150);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(frame);
      } else if (!reduceMotion) {
        frame = window.requestAnimationFrame(loop);
      }
    };

    start();
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ opacity }}
      className={cn("pointer-events-none fixed inset-0 z-0 h-full w-full", className)}
    />
  );
}
