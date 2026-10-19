import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateSessionForm } from "./create-session-form";
import { ArrowLeft, PlusCircle } from "lucide-react";

export const metadata = {
  title: "Create Session | HackCrypt Attendance",
};

export default async function NewSessionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) redirect("/pending");

  const canCreate = [
    "president",
    "vice_president",
    "management_head",
    "development_head",
    "hackathon_head",
    "team_lead",
  ].includes(profile.role);

  if (!canCreate) {
    redirect("/attendance");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <Link
        href="/attendance"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-[#00E5FF] transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Attendance Sessions</span>
      </Link>

      <div className="border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 text-[#00E5FF] font-mono text-xs mb-1">
          <PlusCircle className="w-4 h-4" />
          <span>SESSION MANAGEMENT</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Create Attendance Session</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Schedule a location-verified check-in session for DevClub members.
        </p>
      </div>

      <CreateSessionForm userRole={profile.role} userDepartment={profile.department} />
    </div>
  );
}
