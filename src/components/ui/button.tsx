// FILE: src/components/ui/button.tsx
"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,border-color,box-shadow,color,filter] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Solid cyan pill: the main call to action across the app.
        default:
          "bg-accent text-accent-ink hover:brightness-110 hover:shadow-[0_0_24px_var(--accent-glow)]",
        // Transparent pill with a hairline border.
        secondary:
          "border border-border-strong bg-transparent text-strong hover:border-accent/60 hover:text-accent-soft",
        outline:
          "border border-border bg-surface-2 text-foreground hover:border-accent/50 hover:text-strong",
        ghost: "text-muted-foreground hover:bg-surface-2 hover:text-strong",
        destructive: "bg-danger text-background hover:brightness-110",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
