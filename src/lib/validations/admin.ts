// FILE: src/lib/validations/admin.ts
// Input validation for the user management screens. Every Server Action re-parses its
// input with these schemas before touching the database.

import { z } from "zod";

import { APP_ROLES, DEPARTMENTS, type AppRole } from "@/lib/constants";

/** Emails are stored lower-case, which the profiles table also enforces with a CHECK. */
export const emailField = z.string().trim().toLowerCase().pipe(z.email().max(200));

const departmentField = z.enum(DEPARTMENTS).nullable();

/** Only a team lead must be attached to a department. */
function leadNeedsDepartment(value: { role: AppRole; department: string | null }): boolean {
  return value.role !== "team_lead" || value.department !== null;
}

const leadDepartmentRule = {
  message: "A team lead must be assigned to a department",
  path: ["department"],
};

/** Adding an approved email, and editing one, take exactly the same fields. */
export const approvedEmailSchema = z
  .object({
    full_name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
    email: emailField,
    role: z.enum(APP_ROLES),
    department: departmentField,
  })
  .refine(leadNeedsDepartment, leadDepartmentRule);

export type ApprovedEmailInput = z.infer<typeof approvedEmailSchema>;

export const revokeApprovedEmailSchema = z.object({
  email: emailField,
});

export const setProfileActiveSchema = z.object({
  profile_id: z.uuid(),
  is_active: z.enum(["true", "false"]).transform((value) => value === "true"),
});

/** Turns a Zod error into a single human-readable sentence for the form. */
export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue?.message ?? "That input is not valid.";
}
