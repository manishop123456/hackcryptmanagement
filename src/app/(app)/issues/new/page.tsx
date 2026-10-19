// FILE: src/app/(app)/issues/new/page.tsx
import { redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { createIssueAction } from "@/lib/issues/actions";
import { PageHeader } from "@/components/page-header";
import { Starfield } from "@/components/starfield";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEPARTMENTS } from "@/lib/constants";
import { LifeBuoy } from "lucide-react";

export const metadata = {
  title: "Raise New Issue | HackCrypt Management",
  description: "Raise an issue for department leads or escalation chain",
};

export default async function NewIssuePage() {
  const profile = await requireActiveProfile();
  if (!profile) redirect("/login");

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-12">
      <Starfield density={30} opacity={0.15} />

      <PageHeader
        title="Raise New Issue"
        description="Report an operational, technical, or logistics issue for immediate escalation."
      />

      <Card className="bg-[#111318] border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-[#00E5FF]">
            <LifeBuoy className="w-5 h-5" /> Issue Details & Severity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createIssueAction} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-zinc-400 mb-1">Issue Title *</label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Venue sound system malfunction / Sponsor poster delay"
                className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-2.5 text-zinc-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1">Department *</label>
                <select
                  name="department"
                  defaultValue={profile.department || DEPARTMENTS[0]}
                  className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-2.5 text-zinc-100 uppercase"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Severity *</label>
                <select
                  name="severity"
                  defaultValue="medium"
                  className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-2.5 text-zinc-100"
                >
                  <option value="low">Low (Minor Delay / Minor Request)</option>
                  <option value="medium">Medium (Requires Lead Attention)</option>
                  <option value="high">High (Department Blocker)</option>
                  <option value="critical">Critical (Immediate Escalation to VP/President)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Description & Impact *</label>
              <textarea
                name="description"
                required
                rows={5}
                placeholder="Explain the issue in detail, what is blocked, and what assistance is needed..."
                className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-2.5 text-zinc-100"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#00E5FF] hover:bg-[#00cce6] text-[#0C0E13] font-bold text-sm transition"
            >
              Submit & Escalate to Team Lead
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
