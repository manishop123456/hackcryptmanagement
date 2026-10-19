// FILE: src/components/error-state.tsx
import * as React from "react";
import { AlertTriangle, Info, RotateCcw, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorTone = "error" | "offline" | "info";

const TONES: Record<ErrorTone, { icon: typeof Info; title: string; className: string }> = {
  error: {
    icon: AlertTriangle,
    title: "Something went wrong",
    className: "border-danger/40 bg-danger/5 text-danger",
  },
  offline: {
    icon: WifiOff,
    title: "You appear to be offline",
    className: "border-warning/40 bg-warning/5 text-warning",
  },
  info: {
    icon: Info,
    title: "Nothing to show",
    className: "border-border bg-surface/60 text-muted-foreground",
  },
};

/**
 * Every list and form renders this on failure. `message` should be a sentence a club
 * member can act on, not a raw database error.
 */
export function ErrorState({
  tone = "error",
  title,
  message,
  onRetry,
  className,
}: {
  tone?: ErrorTone;
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  const toneConfig = TONES[tone];
  const Icon = toneConfig.icon;

  return (
    <div
      role={tone === "info" ? "status" : "alert"}
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border px-6 py-8 text-center",
        toneConfig.className,
        className,
      )}
    >
      <Icon className="size-5" />
      <p className="text-sm font-medium">{title ?? toneConfig.title}</p>
      <p className="max-w-sm text-sm text-current/85">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RotateCcw />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/** Rendered when the signed-in role is not allowed into a screen. */
export function NoAccess({ message }: { message?: string }) {
  return (
    <ErrorState
      tone="info"
      title="You do not have access to this screen"
      message={
        message ??
        "Your role does not include this capability. Ask a Management or Development Head if you need it."
      }
    />
  );
}
