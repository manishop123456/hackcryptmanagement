// FILE: src/app/(app)/hackcrypt/ps/new/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { canManageTasks } from "@/lib/permissions";
import { createProblemStatementAction } from "@/lib/hackcrypt/actions";
import { PageHeader } from "@/components/page-header";
import { Starfield } from "@/components/starfield";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileCode, Sparkles } from "lucide-react";

export const metadata = {
  title: "Create Problem Statement | HackCrypt 2027-28",
  description: "Add a new problem statement for HackCrypt hackathon",
};

export default async function NewProblemStatementPage() {
  const profile = await requireActiveProfile();
  if (!profile) redirect("/login");

  if (!canManageTasks(profile.role)) {
    redirect("/hackcrypt");
  }

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
        title="Create Problem Statement"
        description="Submit a new challenge statement, domain track, document link, and evaluation notes."
      />

      <Card className="bg-[#111318] border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-[#00E5FF]" />
            <span>Problem Statement Metadata</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProblemStatementAction} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-xs font-mono text-zinc-300 font-bold block">
                Problem Statement Title *
              </label>
              <input
                id="title"
                type="text"
                name="title"
                required
                placeholder="e.g. Zero-Knowledge Identity Verification for Cross-Chain Governance"
                className="w-full bg-[#0C0E13] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00E5FF]"
              />
            </div>

            {/* Source & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="source" className="text-xs font-mono text-zinc-300 font-bold block">
                  Domain / Track / Sponsor *
                </label>
                <input
                  id="source"
                  type="text"
                  name="source"
                  required
                  placeholder="e.g. Web3 Security / Industry Partner / Open Track"
                  className="w-full bg-[#0C0E13] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="status" className="text-xs font-mono text-zinc-300 font-bold block">
                  Initial Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue="submitted"
                  className="w-full bg-[#0C0E13] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00E5FF]"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="changes_requested">Changes Requested</option>
                  <option value="finalised">Finalised</option>
                </select>
              </div>
            </div>

            {/* Document URL */}
            <div className="space-y-2">
              <label htmlFor="document_url" className="text-xs font-mono text-zinc-300 font-bold block">
                Specification Document Link (Optional)
              </label>
              <input
                id="document_url"
                type="url"
                name="document_url"
                placeholder="https://drive.google.com/..."
                className="w-full bg-[#0C0E13] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00E5FF]"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label htmlFor="notes" className="text-xs font-mono text-zinc-300 font-bold block">
                Detailed Description & Evaluation Criteria (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="Provide problem details, key deliverables, technical stack requirements, and judging criteria..."
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
                <span>Save Problem Statement</span>
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
