// FILE: src/lib/permissions.ts
// The capability matrix from SPEC section 3 and DevClub System extensions.

import type { AppRole, Department } from "@/lib/constants";

export type Actor = {
  role: AppRole;
  department: Department | null;
  co_head_department?: Department | null;
};

/** President, Vice President, Management Head, Development Head. */
export const CORE_ROLES: readonly AppRole[] = [
  "president",
  "vice_president",
  "management_head",
  "development_head",
];

export const CO_HEAD_ROLES: readonly AppRole[] = [
  "development_co_head",
  "management_co_head",
  "co_head",
];

/** Everyone who sees every department: core roles plus pillar co-heads & Hackathon Head. */
export const ALL_DEPARTMENT_ROLES: readonly AppRole[] = [
  ...CORE_ROLES,
  "development_co_head",
  "management_co_head",
  "hackathon_head",
];

/** Roles allowed to add/edit approved emails and profiles (per SPEC section 3 & 0002_core_profiles.sql). */
export const MANAGER_ROLES: readonly AppRole[] = [
  "management_head",
  "development_head",
];

/** Roles allowed to read the audit log. Faculty gets read-only access. */
export const AUDIT_ROLES: readonly AppRole[] = ["faculty", ...CORE_ROLES];

export function isCoreRole(role: AppRole): boolean {
  return CORE_ROLES.includes(role);
}

export function isCoHead(role: AppRole): boolean {
  return CO_HEAD_ROLES.includes(role);
}

export function hasAllDepartmentAccess(role: AppRole): boolean {
  return ALL_DEPARTMENT_ROLES.includes(role);
}

export function canManageUsers(role: AppRole): boolean {
  return MANAGER_ROLES.includes(role);
}

export function canManageTasks(role: AppRole): boolean {
  return role !== "member" && role !== "faculty";
}

export function canViewAudit(role: AppRole): boolean {
  return AUDIT_ROLES.includes(role);
}

export function isTeamLead(role: AppRole): boolean {
  return role === "team_lead" || isCoHead(role);
}

export function isReadOnlyRole(role: AppRole): boolean {
  return role === "faculty";
}

export function canReadDepartment(actor: Actor, target: Department | null): boolean {
  if (actor.role === "faculty") return true;
  if (hasAllDepartmentAccess(actor.role)) return true;
  if (isTeamLead(actor.role)) {
    return actor.department === target || actor.co_head_department === target;
  }
  return false;
}

export function canWriteDepartment(actor: Actor, target: Department | null): boolean {
  if (isCoreRole(actor.role)) return true;
  if (actor.role === "development_co_head") {
    return target === "development" || target === "hackathon";
  }
  if (actor.role === "management_co_head") {
    return target === "admin" || target === "pr" || target === "social_media" || target === "creatives" || target === "management";
  }
  if (actor.role === "hackathon_head") return target === "hackathon";
  if (isTeamLead(actor.role)) {
    return actor.department === target || actor.co_head_department === target;
  }
  return false;
}

/** Check if an actor can assign a task to a target member in target department */
export function canAssignTaskTo(actor: Actor, targetDept: Department | null): boolean {
  if (actor.role === "president" || actor.role === "vice_president") return true;
  if (actor.role === "development_head" || actor.role === "development_co_head") {
    return targetDept === "development" || targetDept === "hackathon" || targetDept === null;
  }
  if (actor.role === "management_head" || actor.role === "management_co_head") {
    return targetDept === "admin" || targetDept === "pr" || targetDept === "social_media" || targetDept === "creatives" || targetDept === "management";
  }
  if (actor.role === "hackathon_head") return targetDept === "hackathon";
  if (isTeamLead(actor.role)) {
    return actor.department === targetDept || actor.co_head_department === targetDept;
  }
  return false;
}

/** Check if an actor can review daily reports for a target department */
export function canReviewDailyReport(actor: Actor, reportDept: Department | null): boolean {
  if (actor.role === "faculty" || actor.role === "president" || actor.role === "vice_president") return true;
  if (actor.role === "development_head" || actor.role === "development_co_head") {
    return reportDept === "development" || reportDept === "hackathon" || reportDept === null;
  }
  if (actor.role === "management_head" || actor.role === "management_co_head") {
    return reportDept === "admin" || reportDept === "pr" || reportDept === "social_media" || reportDept === "creatives" || reportDept === "management";
  }
  if (isTeamLead(actor.role) || actor.role === "hackathon_head") {
    return actor.department === reportDept || actor.co_head_department === reportDept;
  }
  return false;
}

export function canReadAttendanceDepartment(actor: Actor, target: Department | null): boolean {
  if (canReadDepartment(actor, target)) return true;
  return isTeamLead(actor.role) && actor.department === "admin";
}

export function canWriteAttendanceDepartment(actor: Actor, target: Department | null): boolean {
  return canWriteDepartment(actor, target);
}

export function canCreateSessionFor(actor: Actor, target: Department | null): boolean {
  if (isCoreRole(actor.role)) return true;
  if (actor.role === "hackathon_head") return true;
  if (isTeamLead(actor.role)) {
    return actor.department === target || actor.co_head_department === target;
  }
  return false;
}

export function canViewCoordinatesFor(actor: Actor, target: Department | null): boolean {
  if (hasAllDepartmentAccess(actor.role)) return true;
  if (isTeamLead(actor.role)) {
    return actor.department === target || actor.department === "admin" || actor.co_head_department === target;
  }
  return false;
}

export function isPlainMember(role: AppRole): boolean {
  return role === "member";
}

export function canManageSocialMedia(actor: Actor): boolean {
  if (isCoreRole(actor.role) || actor.role === "management_co_head") return true;
  return (
    actor.department === "social_media" ||
    actor.department === "creatives" ||
    actor.co_head_department === "social_media" ||
    actor.co_head_department === "creatives"
  );
}
