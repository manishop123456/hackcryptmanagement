// FILE: src/app/(app)/timeline/page.tsx
// Interactive chronological activity timeline for HackCrypt 2027-28 preparation.

import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Starfield } from "@/components/starfield";
import { requireActiveProfile } from "@/lib/auth";
import { getTimelineEvents } from "@/lib/timeline/queries";
import { createClient } from "@/lib/supabase/server";
import { Calendar, CheckCircle2, Clock, Filter, Shield } from "lucide-react";

export const metadata = {
  title: "Timeline | HackCrypt Management",
  description: "Chronological activity feed and phase milestones",
};

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const profile = await requireActiveProfile();
  if (!profile) redirect("/login");

  const params = await searchParams;
  const activeFilter = (params.filter || "all") as string;

  const events = await getTimelineEvents(100);

  const filteredEvents = events.filter((e) => {
    if (activeFilter === "all") return true;
    return e.type === activeFilter;
  });

  const supabase = await createClient();
  const { data: phases } = await supabase
    .from("phases")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <Starfield density={35} opacity={0.15} />

      <PageHeader
        title="Activity & Phase Timeline"
        description="Chronological stream of system milestones, task updates, attendance sessions, and audit events."
      />

      {/* Phase Roadmap Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#00E5FF]" />
          <span>HackCrypt 2027-28 Planning Phases</span>
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(phases || []).map((phase, idx) => {
            const today = new Date().toISOString().split("T")[0];
            const isCurrent = phase.starts_on <= today && phase.ends_on >= today;
            const isPast = phase.ends_on < today;

            return (
              <div
                key={phase.id}
                className={`rounded-xl border p-4 transition flex flex-col justify-between ${
                  isCurrent
                    ? "border-[#00E5FF] bg-[#00E5FF]/10 ring-1 ring-[#00E5FF]/30"
                    : isPast
                    ? "border-zinc-800 bg-[#111318]/60 opacity-80"
                    : "border-zinc-800 bg-[#111318]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                    <span>PHASE 0{idx + 1}</span>
                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded bg-[#00E5FF]/20 text-[#00E5FF] font-bold">
                        ACTIVE NOW
                      </span>
                    ) : isPast ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> DONE
                      </span>
                    ) : (
                      <span className="text-zinc-500">UPCOMING</span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-zinc-100 line-clamp-1">{phase.name}</h3>
                </div>

                <div className="mt-4 pt-2 border-t border-zinc-800 text-[11px] font-mono text-zinc-400 flex justify-between">
                  <span>{phase.starts_on.slice(5)}</span>
                  <span>to</span>
                  <span>{phase.ends_on.slice(5)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline Filter Controls */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-mono border-b border-zinc-800">
        <span className="text-zinc-500 flex items-center gap-1 mr-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-[#00E5FF]" /> Filter Stream:
        </span>
        {[
          { key: "all", label: "All Activity" },
          { key: "task", label: "Tasks" },
          { key: "attendance", label: "Attendance" },
          { key: "phase", label: "Phases" },
          { key: "audit", label: "Security & Audit" },
        ].map((f) => (
          <Link
            key={f.key}
            href={`/timeline${f.key === "all" ? "" : `?filter=${f.key}`}`}
            className={`px-3 py-1.5 rounded-lg border capitalize transition whitespace-nowrap ${
              activeFilter === f.key
                ? "bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF] font-bold"
                : "bg-[#111318] border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Activity Timeline Feed */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
        {filteredEvents.length === 0 ? (
          <div className="bg-[#111318] border border-zinc-800 rounded-xl p-8 text-center text-zinc-400 text-sm">
            No events found for this filter.
          </div>
        ) : (
          filteredEvents.map((item) => {
            const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div key={item.id} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-[#0C0E13] bg-[#00E5FF] ring-2 ring-[#00E5FF]/30 group-hover:scale-125 transition" />

                <div className="bg-[#111318] border border-zinc-800 rounded-xl p-4 transition group-hover:border-zinc-700 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-[#00E5FF] border border-[#00E5FF]/20 font-semibold">
                        {item.type}
                      </span>
                      {item.badgeText && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400">
                          {item.badgeText}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" /> {dateStr}
                    </span>
                  </div>

                  <h4 className="font-bold text-zinc-100 text-sm">
                    {item.link ? (
                      <Link href={item.link} className="hover:text-[#00E5FF] transition">
                        {item.title}
                      </Link>
                    ) : (
                      item.title
                    )}
                  </h4>

                  <p className="text-xs text-zinc-400">{item.description}</p>

                  {item.actorName && (
                    <div className="pt-2 border-t border-zinc-800/60 text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-[#00E5FF]" />
                      <span>By {item.actorName}</span>
                      {item.actorRole && (
                        <span className="text-zinc-600">({item.actorRole})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
