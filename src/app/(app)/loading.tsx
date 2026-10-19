// FILE: src/app/(app)/loading.tsx
import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/loading-states";

export default function AppLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <PageHeaderSkeleton />
      <CardGridSkeleton count={3} />
    </div>
  );
}
