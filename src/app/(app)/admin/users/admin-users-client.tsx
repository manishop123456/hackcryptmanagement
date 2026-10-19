// FILE: src/app/(app)/admin/users/admin-users-client.tsx
"use client";

import * as React from "react";
import { useActionState, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleUser,
  Pencil,
  ShieldOff,
  UserPlus,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { DepartmentBadge, RoleBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  APP_ROLES,
  DEPARTMENTS,
  DEPARTMENT_LABELS,
  ROLE_LABELS,
  type AppRole,
  type Department,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { INITIAL_ADMIN_STATE, type AdminActionState } from "@/app/(app)/admin/users/constants";
import {
  addApprovedEmail,
  revokeApprovedEmail,
  setProfileActive,
  updateApprovedEmail,
} from "@/app/(app)/admin/users/actions";

export type ApprovedEmailItem = {
  email: string;
  full_name: string;
  role: AppRole;
  department: Department | null;
  created_at: string;
  hasSignedIn: boolean;
};

export type ProfileItem = {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
  department: Department | null;
  is_active: boolean;
  created_at: string;
};

/** Radix Select cannot submit an empty string, so "no department" has a sentinel value. */
const NO_DEPARTMENT = "none";

export function AdminUsersClient({
  approved,
  profiles,
  signedInViewerEmail,
}: {
  approved: ApprovedEmailItem[];
  profiles: ProfileItem[];
  signedInViewerEmail: string;
}) {
  return (
    <div className="space-y-6">
      <AddApprovedEmailForm />
      <ApprovedEmailList items={approved} viewerEmail={signedInViewerEmail} />
      <ProfileList items={profiles} viewerEmail={signedInViewerEmail} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function RoleSelect({
  id,
  name,
  defaultValue,
  describedBy,
}: {
  id: string;
  name: string;
  defaultValue: AppRole;
  describedBy?: string;
}) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger id={id} aria-describedby={describedBy}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {APP_ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {ROLE_LABELS[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DepartmentSelect({
  id,
  name,
  defaultValue,
  describedBy,
}: {
  id: string;
  name: string;
  defaultValue: string;
  describedBy?: string;
}) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger id={id} aria-describedby={describedBy}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_DEPARTMENT}>No department</SelectItem>
        {DEPARTMENTS.map((department) => (
          <SelectItem key={department} value={department}>
            {DEPARTMENT_LABELS[department]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ActionFeedback({ state }: { state: AdminActionState }) {
  if (state.status === "idle" || state.message.length === 0) return null;

  if (state.status === "success") {
    return (
      <Alert variant="success" className="sm:col-span-2">
        <CheckCircle2 />
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" role="alert" className="sm:col-span-2">
      <AlertTriangle />
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}

function RoleDepartmentBadges({
  role,
  department,
}: {
  role: AppRole;
  department: Department | null;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <RoleBadge role={role} />
      <DepartmentBadge department={department} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Add an approved email
// ---------------------------------------------------------------------------

function AddApprovedEmailForm() {
  const [state, formAction] = useActionState(addApprovedEmail, INITIAL_ADMIN_STATE);
  const formId = "add-approved-email-form";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="size-4 text-accent" />
          Add an approved email
        </CardTitle>
        <CardDescription>
          Use the member&apos;s email address. They get access the first time they sign in, and
          only then.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id={formId} action={formAction} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="add-full-name">
            <Input
              id="add-full-name"
              name="full_name"
              required
              maxLength={120}
              autoComplete="off"
              placeholder="Member's full name"
            />
          </Field>

          <Field label="Email" htmlFor="add-email">
            <Input
              id="add-email"
              name="email"
              type="email"
              required
              maxLength={200}
              autoComplete="off"
              inputMode="email"
              placeholder="name@example.com"
              className="font-mono text-xs"
            />
          </Field>

          <Field
            label="Role"
            htmlFor="add-role"
            hint="A team lead must also be given a department."
          >
            <RoleSelect id="add-role" name="role" defaultValue="member" />
          </Field>

          <Field label="Department" htmlFor="add-department">
            <DepartmentSelect
              id="add-department"
              name="department"
              defaultValue={NO_DEPARTMENT}
            />
          </Field>

          <ActionFeedback state={state} />

          <div className="sm:col-span-2">
            <SubmitButton pendingLabel="Adding…">
              <UserPlus />
              Add to approved list
            </SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Approved emails
// ---------------------------------------------------------------------------

function ApprovedEmailList({
  items,
  viewerEmail,
}: {
  items: ApprovedEmailItem[];
  viewerEmail: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-4 text-accent" />
          Approved emails
        </CardTitle>
        <CardDescription>
          {items.length === 0
            ? "Nobody is on the list yet."
            : `${items.length} ${items.length === 1 ? "email" : "emails"} can sign in.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="No approved emails yet"
            description="Add the first member above. Until an email is on this list, a sign-in shows the waiting screen and no club data."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Signed in</TableHead>
                    <TableHead className="text-right">Manage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.email}>
                      <TableCell>
                        <p className="font-medium text-strong">{item.full_name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{item.email}</p>
                      </TableCell>
                      <TableCell>
                        <RoleDepartmentBadges role={item.role} department={null} />
                      </TableCell>
                      <TableCell>
                        <DepartmentBadge department={item.department} />
                      </TableCell>
                      <TableCell>
                        {item.hasSignedIn ? (
                          <Badge variant="success">Signed in</Badge>
                        ) : (
                          <Badge variant="muted">Not yet</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <ApprovedEmailActions item={item} viewerEmail={viewerEmail} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Phone cards */}
            <ul className="space-y-3 md:hidden">
              {items.map((item) => (
                <li
                  key={item.email}
                  className="rounded-2xl border border-border bg-surface-2/50 p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-strong">{item.full_name}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {item.email}
                      </p>
                    </div>
                    {item.hasSignedIn ? (
                      <Badge variant="success">Signed in</Badge>
                    ) : (
                      <Badge variant="muted">Not yet</Badge>
                    )}
                  </div>
                  <div className="mt-3">
                    <RoleDepartmentBadges role={item.role} department={item.department} />
                  </div>
                  <div className="mt-3">
                    <ApprovedEmailActions item={item} viewerEmail={viewerEmail} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ApprovedEmailActions({
  item,
  viewerEmail,
}: {
  item: ApprovedEmailItem;
  viewerEmail: string;
}) {
  const isSelf = item.email === viewerEmail;

  return (
    <EditApprovedEmailDialog
      item={item}
      trigger={
        <Button variant="secondary" size="sm" disabled={isSelf}>
          <Pencil />
          {isSelf ? "This is you" : "Edit"}
        </Button>
      }
    />
  );
}

function EditApprovedEmailDialog({
  item,
  trigger,
}: {
  item: ApprovedEmailItem;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [updateState, setUpdateState] = useState<AdminActionState>(INITIAL_ADMIN_STATE);
  const [revokeState, setRevokeState] = useState<AdminActionState>(INITIAL_ADMIN_STATE);
  const formId = `edit-approved-email-${item.email}`;

  // Form actions, so the dialog can close itself the moment the server confirms the
  // change. No effect is needed and no state is set during render.
  async function submitUpdate(formData: FormData): Promise<void> {
    const result = await updateApprovedEmail(INITIAL_ADMIN_STATE, formData);
    setUpdateState(result);
    if (result.status === "success") setOpen(false);
  }

  async function submitRevoke(formData: FormData): Promise<void> {
    const result = await revokeApprovedEmail(INITIAL_ADMIN_STATE, formData);
    setRevokeState(result);
    if (result.status === "success") setOpen(false);
  }

  function handleOpenChange(next: boolean): void {
    setOpen(next);
    if (!next) {
      setUpdateState(INITIAL_ADMIN_STATE);
      setRevokeState(INITIAL_ADMIN_STATE);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit access</DialogTitle>
          <DialogDescription>
            Changes are written to the audit log, and the member&apos;s profile is updated at
            the same time.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} action={submitUpdate} className="mt-5 grid gap-4">
          <input type="hidden" name="email" value={item.email} />

          <Field label="Full name" htmlFor={`${formId}-name`}>
            <Input
              id={`${formId}-name`}
              name="full_name"
              defaultValue={item.full_name}
              required
              maxLength={120}
            />
          </Field>

          <div className="rounded-xl border border-border bg-surface-2 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
            <p className="font-mono text-xs break-all text-foreground">{item.email}</p>
          </div>

          <Field label="Role" htmlFor={`${formId}-role`}>
            <RoleSelect
              id={`${formId}-role`}
              name="role"
              defaultValue={item.role}
            />
          </Field>

          <Field label="Department" htmlFor={`${formId}-department`}>
            <DepartmentSelect
              id={`${formId}-department`}
              name="department"
              defaultValue={item.department ?? NO_DEPARTMENT}
            />
          </Field>

          <ActionFeedback state={updateState} />
        </form>

        <Separator className="my-5" />

        <div className="rounded-xl border border-danger/30 bg-danger/5 p-3.5">
          <p className="flex items-center gap-2 text-sm font-medium text-danger">
            <ShieldOff className="size-4" />
            Revoke access
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Removes the email from the approved list and pauses this profile. Their existing
            tasks and attendance records stay in the system.
          </p>
          <form action={submitRevoke} className="mt-3">
            <input type="hidden" name="email" value={item.email} />
            <SubmitButton variant="destructive" size="sm" pendingLabel="Revoking…">
              <ShieldOff />
              Revoke this email
            </SubmitButton>
          </form>
          <ActionFeedback state={revokeState} />
        </div>

        <DialogFooter>
          <Button variant="ghost" type="button" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <SubmitButton form={formId} pendingLabel="Saving…">
            Save changes
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Signed-in members
// ---------------------------------------------------------------------------

function ProfileList({
  items,
  viewerEmail,
}: {
  items: ProfileItem[];
  viewerEmail: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleUser className="size-4 text-accent" />
          Signed-in members
        </CardTitle>
        <CardDescription>
          People who have signed in at least once. Pausing someone keeps their history but
          stops all access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={CircleUser}
            title="Nobody has signed in yet"
            description="Profiles appear here automatically the first time an approved email signs in."
          />
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium text-strong">{item.full_name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{item.email}</p>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={item.role} />
                      </TableCell>
                      <TableCell>
                        <DepartmentBadge department={item.department} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <ProfileAccessControl item={item} viewerEmail={viewerEmail} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className="space-y-3 md:hidden">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-border bg-surface-2/50 p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-strong">{item.full_name}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {item.email}
                      </p>
                    </div>
                    {item.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="danger">Paused</Badge>
                    )}
                  </div>
                  <div className="mt-3">
                    <RoleDepartmentBadges role={item.role} department={item.department} />
                  </div>
                  <div className="mt-3">
                    <ProfileAccessControl item={item} viewerEmail={viewerEmail} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ProfileAccessControl({
  item,
  viewerEmail,
}: {
  item: ProfileItem;
  viewerEmail: string;
}) {
  const [state, formAction] = useActionState(setProfileActive, INITIAL_ADMIN_STATE);
  const isSelf = item.email === viewerEmail;

  return (
    <div className="space-y-2">
      <form action={formAction} className="flex items-center gap-2 md:justify-end">
        <input type="hidden" name="profile_id" value={item.id} />
        <input type="hidden" name="is_active" value={item.is_active ? "false" : "true"} />
        <SubmitButton
          variant={item.is_active ? "ghost" : "secondary"}
          size="sm"
          disabled={isSelf}
          pendingLabel="Saving…"
        >
          {item.is_active ? "Pause access" : "Restore access"}
        </SubmitButton>
      </form>
      {isSelf ? (
        <p className="text-xs text-muted-foreground md:text-right">
          You cannot change your own access.
        </p>
      ) : (
        <ActionFeedback state={state} />
      )}
    </div>
  );
}
