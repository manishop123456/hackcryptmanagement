// FILE: src/lib/notifications/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveProfile } from "@/lib/auth";

export async function createNotification(params: {
  userId: string;
  kind: string;
  title: string;
  message: string;
  link?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    kind: params.kind,
    title: params.title,
    message: params.message,
    link: params.link || null,
  });

  return !error;
}

export async function markNotificationReadAction(formData: FormData) {
  const notificationId = formData.get("notificationId")?.toString();
  if (!notificationId) return;

  const profile = await requireActiveProfile();
  const supabase = await createClient();

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", profile.id);

  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const profile = await requireActiveProfile();
  const supabase = await createClient();

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .is("read_at", null);

  revalidatePath("/notifications");
}
