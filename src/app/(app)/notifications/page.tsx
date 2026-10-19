// FILE: src/app/(app)/notifications/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { getUserNotifications, getUnreadNotificationCount } from "@/lib/notifications/queries";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/lib/notifications/actions";
import { PageHeader } from "@/components/page-header";
import { Starfield } from "@/components/starfield";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Check, CheckCheck, Clock } from "lucide-react";

export const metadata = {
  title: "Notifications | HackCrypt Management",
  description: "Internal system alerts, task assignments, and review notifications",
};

export default async function NotificationsPage() {
  const profile = await requireActiveProfile();
  if (!profile) redirect("/login");

  const notifications = await getUserNotifications(profile.id, 50);
  const unreadCount = await getUnreadNotificationCount(profile.id);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <Starfield density={30} opacity={0.15} />

      <PageHeader
        title="Notification Center"
        description="Internal real-time alerts for task assignments, deadlines, reviews, and escalations."
      />

      {/* Action Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
          <Bell className="w-4 h-4 text-[#00E5FF]" />
          <span>UNREAD ALERTS ({unreadCount})</span>
        </div>

        {unreadCount > 0 && (
          <form action={markAllNotificationsReadAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#00E5FF]" /> Mark All as Read
            </button>
          </form>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-[#111318] border border-zinc-800 rounded-xl p-8 text-center text-zinc-400 text-sm">
            No notifications available. You are all caught up!
          </div>
        ) : (
          notifications.map((n) => {
            const isUnread = !n.read_at;

            return (
              <Card
                key={n.id}
                className={`bg-[#111318] border transition ${
                  isUnread ? "border-[#00E5FF]/40 bg-[#111318]/90 ring-1 ring-[#00E5FF]/20" : "border-zinc-800"
                }`}
              >
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-[#00E5FF]">
                        {n.kind.replace("_", " ")}
                      </span>
                      <h4 className="font-bold text-sm text-zinc-100">{n.title}</h4>
                    </div>
                    <p className="text-xs text-zinc-400">{n.message}</p>
                    <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-2 pt-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                      {n.link && (
                        <Link href={n.link} className="text-[#00E5FF] hover:underline ml-2">
                          View details →
                        </Link>
                      )}
                    </div>
                  </div>

                  {isUnread && (
                    <form action={markNotificationReadAction}>
                      <input type="hidden" name="notificationId" value={n.id} />
                      <button
                        type="submit"
                        title="Mark as Read"
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-emerald-400 transition"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
