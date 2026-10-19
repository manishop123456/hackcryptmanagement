// FILE: src/components/layout/top-bar.tsx
import Link from "next/link";

import { BrandLogo, BrandWordmark } from "@/components/brand/logo";
import { UserMenu } from "@/components/layout/user-menu";
import type { AppRole, Department } from "@/lib/constants";

export function TopBar({
  fullName,
  email,
  role,
  department,
}: {
  fullName: string;
  email: string;
  role: AppRole;
  department: Department | null;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <BrandLogo size={34} />
          <span className="flex flex-col">
            <BrandWordmark />
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground lg:inline">
            HackCrypt Management System
          </span>
          <UserMenu
            fullName={fullName}
            email={email}
            role={role}
            department={department}
          />
        </div>
      </div>
    </header>
  );
}
