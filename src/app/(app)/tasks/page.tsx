// FILE: src/app/(app)/tasks/page.tsx
// Server component page for Tasks hub.

import { requireActiveProfile } from "@/lib/auth";
import { getAssignableProfiles, getPhases, getTasks } from "@/lib/tasks/queries";
import { TasksClient } from "./tasks-client";

export const metadata = {
  title: "Tasks · HackCrypt Management System",
  description: "Task assignment, tracking, and Kanban board for DevClub TRCAC.",
};

export default async function TasksPage() {
  const profile = await requireActiveProfile();

  const [tasks, profiles, phases] = await Promise.all([
    getTasks(),
    getAssignableProfiles(),
    getPhases(),
  ]);

  return (
    <TasksClient
      initialTasks={tasks}
      currentUser={profile}
      profiles={profiles}
      phases={phases}
    />
  );
}
