// FILE: src/app/(app)/hackcrypt/teams/new/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { canManageTasks } from "@/lib/permissions";
import { getProblemStatements } from "@/lib/hackcrypt/queries";
import { createTeamAction } from "@/lib/hackcrypt/actions";
import { PageHeader } from "@/components/page-header";
import { Starfield } from "@/components/starfield";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building, Sparkles, Users } from "lucide-react";

export const metadata = {
  title: "Register Hackathon Team | HackCrypt 2027-28",
  description: "Register a new external hackathon team for HackCrypt",
};

export default async function NewTeamPage() {
  const profile = await requireActiveProfile();
  if (!profile) redirect("/login");

  if (!canManageTasks(profile.role)) {
    redirect("/hackcrypt");
  }

  const problemStatements = await getProblemStatements();

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12">
      <Starfield density={30} opacity={0.15} />

      <div className="flex items-center gap-2">
        <Link
          href="/hackcrypt"
          className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to HackCrypt Dashboard
        </Link>
      </div>

      <PageHeader
        title="Register Hackathon Team"
        description="Add a new participating team, institution details, members roster, and problem statement track."
      />

      <Card className="bg-[#111318] border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00E5FF]" />
            <span>Team Registration Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTeamAction} className="space-y-6">
            {/* Team Name & College */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-mono text-zinc-300 font-bold block">
                  Team Name *
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. ByteBusters / CyberKnights"
                  className="w-full bg-[#0C0E13] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="college" className="text-xs font-mono text-zinc-300 font-bold block">
                  College / Institution Name *
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    id="college"
                    type="text"
                    name="college"
                    required
                    placeholder="e.g. Thakur College of Engineering & Tech"
                    className="w-full bg-[#0C0E13] border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00E5FF]"
                  />
                </div>
              </div>
            </div>

            {/* Status & Problem Statement Association */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="status" className="text-xs font-mono text-zinc-300 font-bold block">
                  Registration Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue="pending"
                  className="w-full bg-[#0C0E13] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00E5FF]"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="dropped">Dropped</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="problem_statement_id" className="text-xs font-mono text-zinc-300 font-bold block">
                  Problem Statement Track (Optional)
                </label>
                <select
                  id="problem_statement_id"
                  name="problem_statement_id"
                  defaultValue=""
                  className="w-full bg-[#0C0E13] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00E5FF]"
                >
                  <option value="">-- None Selected --</option>
                  {problemStatements.map((ps) => (
                    <option key={ps.id} value={ps.id}>
                      {ps.title} ({ps.source})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Members Roster (Newline separated) */}
            <div className="space-y-2">
              <label htmlFor="members_raw" className="text-xs font-mono text-zinc-300 font-bold block">
                Team Members List (One member name per line) *
              </label>
              <textarea
                id="members_raw"
                name="members_raw"
                rows={4}
                required
                placeholder="Aarav Sharma (Lead)&#10;Priya Patel (Developer)&#10;Rohan Verma (Designer)&#10;Ananya Singh (Web3 Dev)"
                className="w-full bg-[#0C0E13] border border-zinc-800 rounded-xl p-4 text-xs font-mono text-zinc-100 focus:outline-none focus:border-[#00E5FF]"
              />
              <p className="text-[11px] text-zinc-500 font-mono">
                Enter names and roles. Example: &quot;Aarav Sharma (Lead)&quot;
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label htmlFor="notes" className="text-xs font-mono text-zinc-300 font-bold block">
                Additional Notes / Contact Information (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Leader phone number, emergency contact, GitHub repo or submission notes..."
                className="w-full bg-[#0C0E13] border border-zinc-800 rounded-xl p-4 text-xs text-zinc-100 focus:outline-none focus:border-[#00E5FF]"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00E5FF] hover:bg-[#00cce6] text-[#0C0E13] font-bold text-xs transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Register Team</span>
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
