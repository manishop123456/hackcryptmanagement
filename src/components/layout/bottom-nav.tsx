// FILE: src/components/layout/bottom-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AppRole } from "@/lib/constants";
import { bottomNavItemsFor, isActivePath } from "@/lib/nav";
import { cn } from "@/lib/utils";

// Mobile-first: the four key destinations live within thumb reach at the bottom.
export function BottomNav({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const items = bottomNavItemsFor(role);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto flex w-full max-w-lg items-stretch">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.available && isActivePath(pathname, item.href);

          return (
            <li key={item.href} className="flex-1">
              {item.available ? (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
                    active ? "text-accent" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="flex min-h-14 cursor-not-allowed flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] text-muted-foreground/45"
                >
                  <Icon className="size-5" />
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
