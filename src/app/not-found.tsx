// FILE: src/app/not-found.tsx
import Link from "next/link";

import { Starfield } from "@/components/starfield";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4">
      <Starfield density={70} opacity={0.4} />
      <div className="relative z-10 max-w-sm text-center">
        <p className="font-mono text-sm tracking-[0.3em] text-accent">404</p>
        <h1 className="mt-3 text-xl font-bold tracking-tight text-strong">
          That page does not exist
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The link may be out of date, or the section may not be built yet.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Back to the dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
