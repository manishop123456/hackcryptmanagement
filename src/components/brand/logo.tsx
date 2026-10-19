// FILE: src/components/brand/logo.tsx
"use client";

// The club's real logo lives at public/assets/logo/devclub-logo.png (drop the file in
// there). Until it exists - or if it ever fails to load - the badge falls back to the
// cyan glowing circle with a bulb mark, so the shell never shows a broken image.

import * as React from "react";
import Image from "next/image";
import { Lightbulb } from "lucide-react";

import { cn } from "@/lib/utils";

const LOGO_SRC = "/assets/logo/devclub-logo.png";

export function BrandLogo({ size = 40, className }: { size?: number; className?: string }) {
  const [failed, setFailed] = React.useState(false);

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-accent/30 bg-surface-2 glow-brand",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {failed ? (
        <Lightbulb className="text-accent" style={{ width: size * 0.5, height: size * 0.5 }} />
      ) : (
        <Image
          src={LOGO_SRC}
          alt="DevClub TRCAC"
          width={size}
          height={size}
          priority
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      )}
    </span>
  );
}

/** Small "DEV CLUB" wordmark used next to the badge. */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex flex-col leading-none", className)}>
      <span className="text-sm font-bold tracking-[0.16em] text-strong">DEV CLUB</span>
      <span className="mt-0.5 font-mono text-[10px] tracking-[0.22em] text-accent">
        TRCAC
      </span>
    </span>
  );
}
