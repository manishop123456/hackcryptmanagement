// FILE: src/app/(app)/tasks/[id]/page.tsx
// Server component page for task detail view.

import { notFound } from "next/navigation";

import { requireActiveProfile } from "@/lib/auth";
import { getAssignableProfiles, getPhases, getTaskById, getTaskComments, getTaskHistory } from "@/lib/tasks/queries";
import { TaskDetailClient } from "./task-detail-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTaskById(id);
  if (!task) return { title: "Task Not Found · HackCrypt Management System" };
  return {
    title: `${task.title} · Tasks · HackCrypt Management System`,
    description: task.description ?? "Task details and discussion.",
  };
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireActiveProfile();

  const task = await getTaskById(id);
  if (!task) {
    notFound();
  }

  const [comments, history, profiles, phases] = await Promise.all([
    getTaskComments(id),
    getTaskHistory(id),
    getAssignableProfiles(),
    getPhases(),
  ]);

  return (
    <TaskDetailClient
      task={task}
      comments={comments}
      history={history}
      currentUser={profile}
      profiles={profiles}
      phases={phases}
    />
  );
}
