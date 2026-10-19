// FILE: src/components/ui/input.tsx
import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm text-foreground",
        "placeholder:text-muted-foreground/70",
        "transition-colors focus-visible:border-accent/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-invalid:border-danger/70",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
