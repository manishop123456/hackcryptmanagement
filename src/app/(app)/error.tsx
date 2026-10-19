// FILE: src/app/(app)/error.tsx
"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/error-state";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the digest only - never row contents or coordinates.
    console.error(`[app] render error ${error.digest ?? ""}`);
  }, [error.digest]);

  return (
    <ErrorState
      message="This screen could not be loaded. Try again, and if it keeps happening tell a Development Head what you were doing."
      onRetry={reset}
    />
  );
}
