// FILE: src/components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import type { AppRole } from "@/lib/constants";
import { isActivePath, navItemsFor } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Sidebar({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const items = navItemsFor(role);

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border px-3 py-4 md:block">
      <nav aria-label="Main" className="sticky top-20 flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.available && isActivePath(pathname, item.href);

          if (!item.available) {
            return (
              <span
                key={item.href}
                aria-disabled="true"
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground/55"
              >
                <Icon className="size-4" />
                {item.label}
                <Badge variant="muted" className="ml-auto">
                  Soon
                </Badge>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                active
                  ? "bg-accent/10 text-accent-soft"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-strong",
              )}
            >
              <Icon className={cn("size-4", active && "text-accent")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
