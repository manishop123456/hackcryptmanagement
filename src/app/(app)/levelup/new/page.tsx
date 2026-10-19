// FILE: src/app/(app)/levelup/new/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { canManageTasks } from "@/lib/permissions";
import { createLectureAction } from "@/lib/levelup/actions";
import { PageHeader } from "@/components/page-header";
import { Starfield } from "@/components/starfield";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, GraduationCap, MapPin, Sparkles, User } from "lucide-react";

export const metadata = {
  title: "Create Level Up Lecture | HackCrypt Management",
  description: "Schedule a new technical lecture session",
};

export default async function NewLecturePage() {
  const profile = await requireActiveProfile();
  if (!profile) redirect("/login");

  if (!canManageTasks(profile.role)) {
    redirect("/levelup");
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12">
      <Starfield density={30} opacity={0.15} />

      <div className="flex items-center gap-2">
        <Link
          href="/levelup"
          className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Level Up Pipeline
        </Link>
      </div>

      <PageHeader
        title="Schedule Level Up Lecture"
        description="Initialize a new lecture session, speaker details, venue, and optional linked location-verified attendance session."
      />

      <Card className="bg-[#111318] border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#00E5FF]" />
            <span>Lecture Details & Metadata</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createLectureAction} className="space-y-6">
            {/* Topic & Speaker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="topic" className="text-xs font-mono text-zinc-300 font-bold block">
                  Lecture Topic / Title *
                </label>
                <input
                  id="topic"
                  type="text"
                  name="topic"
                  required
                  placeholder="e.g. Advanced Smart Contract Security"
                  className="w-full bg-[#0C0E13] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="speaker" className="text-xs font-mono text-zinc-300 font-bold block">
                  Speaker Name & Designation *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    id="speaker"
                    type="text"
                    name="speaker"
                    required
                    placeholder="e.g. Manish Choudhary (Dev Head)"
                    className="w-full bg-[#0C0E13] border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00E5FF]"
                  />
                </div>
              </div>
            </div>

            {/* Date/Time & Venue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="starts_at" className="text-xs font-mono text-zinc-300 font-bold block">
                  Date & Time *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    id="starts_at"
                    type="datetime-local"
                    name="starts_at"
                    required
                    className="w-full bg-[#0C0E13] border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00E5FF]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="venue" className="text-xs font-mono text-zinc-300 font-bold block">
                  Venue / Location *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    id="venue"
                    type="text"
                    name="venue"
                    required
                    placeholder="e.g. Lab 402 / Seminar Hall B"
                    className="w-full bg-[#0C0E13] border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00E5FF]"
                  />
                </div>
              </div>
            </div>

            {/* Initial Stage & Feedback Link */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="stage" className="text-xs font-mono text-zinc-300 font-bold block">
                  Initial Stage
                </label>
                <select
                  id="stage"
                  name="stage"
                  defaultValue="topic"
                  className="w-full bg-[#0C0E13] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00E5FF]"
                >
                  <option value="topic">1. Topic Selection</option>
                  <option value="speaker">2. Speaker Briefing</option>
                  <option value="date">3. Schedule Set</option>
                  <option value="venue">4. Venue Reserved</option>
                  <option value="preparation">5. Active Prep</option>
                  <option value="lecture">6. Lecture Live</option>
                  <option value="review">7. Post Review</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="feedback_url" className="text-xs font-mono text-zinc-300 font-bold block">
                  Feedback URL (Optional)
                </label>
                <input
                  id="feedback_url"
                  type="url"
                  name="feedback_url"
                  placeholder="https://forms.gle/..."
                  className="w-full bg-[#0C0E13] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00E5FF]"
                />
              </div>
            </div>

            {/* Attendance Link Toggle */}
            <div className="bg-[#0C0E13] p-4 rounded-xl border border-zinc-800 space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="create_session"
                  value="true"
                  defaultChecked
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-[#00E5FF] focus:ring-0"
                />
                <span className="text-xs font-bold text-zinc-200">
                  Automatically create linked Attendance Session with location check-in & passcode
                </span>
              </label>
              <p className="text-[11px] text-zinc-500 font-mono pl-7">
                Generates a Level Up attendance session for all departments, allowing dynamic 30s HMAC live passcode check-ins at the venue.
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label htmlFor="notes" className="text-xs font-mono text-zinc-300 font-bold block">
                Session Notes & Prerequisites
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Mention hardware requirements, prerequisites or pre-reading materials for members..."
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
                <span>Initialize Lecture</span>
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
