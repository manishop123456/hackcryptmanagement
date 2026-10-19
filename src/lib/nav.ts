// FILE: src/lib/nav.ts
// Navigation items for the DevClub TRCAC Command Center layout.

import {
  Award,
  Bell,
  CalendarCheck,
  ClipboardList,
  FileCheck,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  Rocket,
  Share2,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
  ScrollText,
  UserCog,
  Zap,
} from "lucide-react";

import type { AppRole } from "@/lib/constants";
import { canManageUsers, canViewAudit } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  visibleTo?: (role: AppRole) => boolean;
  available: boolean;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, available: true },
  { href: "/tasks", label: "Tasks", icon: ClipboardList, available: true },
  { href: "/daily-reports", label: "Daily Reports", icon: FileCheck, available: true },
  { href: "/radar", label: "Radar", icon: ShieldAlert, available: true },
  { href: "/social-media", label: "Social Media", icon: Share2, available: true },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck, available: true },
  { href: "/timeline", label: "Timeline", icon: ScrollText, available: true },
  { href: "/reviews", label: "Reviews", icon: FileText, available: true },
  { href: "/contribution", label: "Contribution", icon: Award, available: true },
  { href: "/notifications", label: "Notifications", icon: Bell, available: true },
  { href: "/issues", label: "Issues", icon: LifeBuoy, available: true },
  { href: "/levelup", label: "Level Up", icon: GraduationCap, available: true },
  { href: "/hackcrypt", label: "HackCrypt", icon: Rocket, available: true },
  { href: "/reports", label: "Reports", icon: FileSpreadsheet, available: true },
  { href: "/event-day", label: "Event Day", icon: Zap, available: true },
  {
    href: "/admin/users",
    label: "Users",
    icon: UserCog,
    visibleTo: canManageUsers,
    available: true,
  },
  {
    href: "/admin/audit",
    label: "Audit",
    icon: ShieldCheck,
    visibleTo: canViewAudit,
    available: true,
  },
];

export function navItemsFor(role: AppRole): NavItem[] {
  return NAV_ITEMS.filter((item) => (item.visibleTo ? item.visibleTo(role) : true));
}

export function bottomNavItemsFor(role: AppRole): NavItem[] {
  const items = navItemsFor(role).filter((item) => !item.visibleTo);
  return (items.length > 0 ? items : navItemsFor(role)).slice(0, 4);
}

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
