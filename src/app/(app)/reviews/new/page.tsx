// FILE: src/app/(app)/reviews/new/page.tsx
import { redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { submitWeeklyReportAction } from "@/lib/reviews/actions";
import { PageHeader } from "@/components/page-header";
import { Starfield } from "@/components/starfield";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "New Weekly Review | HackCrypt Management",
  description: "Submit a new department weekly performance report",
};

export default async function NewWeeklyReviewPage() {
  const profile = await requireActiveProfile();
  if (!profile) redirect("/login");

  const canSubmit = [
    "president",
    "vice_president",
    "management_head",
    "development_head",
    "hackathon_head",
    "team_lead",
  ].includes(profile.role);

  if (!canSubmit) redirect("/reviews");

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <Starfield density={30} opacity={0.15} />

      <PageHeader
        title="Submit Weekly Department Report"
        description="Log weekly task metrics, participation, attendance, blockers, and next objectives."
      />

      <Card className="bg-[#111318] border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-100">Weekly Report Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submitWeeklyReportAction} className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1">DEPARTMENT</label>
                <select
                  name="department"
                  defaultValue={profile.department || "development"}
                  className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-2 text-zinc-100 capitalize"
                >
                  {["creatives", "admin", "social_media", "pr", "development", "hackathon", "management"].map(
                    (d) => (
                      <option key={d} value={d}>
                        {d.replace("_", " ")}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">WEEK START DATE</label>
                <input
                  type="date"
                  name="weekStart"
                  defaultValue={todayStr}
                  required
                  className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-2 text-zinc-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-zinc-400 mb-1">ASSIGNED TASKS</label>
                <input
                  type="number"
                  name="assigned"
                  defaultValue={5}
                  min={0}
                  className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-2 text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">COMPLETED</label>
                <input
                  type="number"
                  name="completed"
                  defaultValue={4}
                  min={0}
                  className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-2 text-zinc-100 text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">DELAYED</label>
                <input
                  type="number"
                  name="delayed"
                  defaultValue={0}
                  min={0}
                  className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-2 text-zinc-100 text-red-400"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">ATTENDANCE %</label>
                <input
                  type="number"
                  name="attendanceRate"
                  defaultValue={95}
                  min={0}
                  max={100}
                  className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-2 text-zinc-100 text-[#00E5FF]"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-zinc-400 mb-1">PROBLEMS & BLOCKERS FACED</label>
              <textarea
                name="problems"
                rows={3}
                placeholder="Describe any technical, resource, or scheduling blockers..."
                className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-2.5 text-zinc-100 font-sans"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">NEXT WEEK OBJECTIVES</label>
              <textarea
                name="nextTasks"
                rows={3}
                placeholder="List planned deliverables for next week..."
                className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-2.5 text-zinc-100 font-sans"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#00E5FF] hover:bg-[#00cce6] text-[#0C0E13] font-bold py-3 rounded-xl mt-4"
            >
              Submit Weekly Report
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
