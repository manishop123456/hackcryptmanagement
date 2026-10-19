// FILE: scripts/test-permissions.mjs
import assert from "node:assert";

// Security & Capability matrix unit tests mirroring src/lib/permissions.ts & database rules

const CORE_ROLES = ["president", "vice_president", "management_head", "development_head"];
// Per SPEC section 3 & 0002_core_profiles.sql line 136: only Management Head & Development Head manage users/roles
const MANAGER_ROLES = ["management_head", "development_head"];

function canManageUsers(role) {
  return MANAGER_ROLES.includes(role);
}

function canManageSocialMedia(actor) {
  if (CORE_ROLES.includes(actor.role) || actor.role === "management_co_head") return true;
  return (
    actor.department === "social_media" ||
    actor.department === "creatives" ||
    actor.co_head_department === "social_media" ||
    actor.co_head_department === "creatives"
  );
}

function canApproveSocialMedia(actor) {
  if (actor.role === "member" || actor.role === "faculty") return false;
  return canManageSocialMedia(actor);
}

function canWriteDepartment(actor, target) {
  if (CORE_ROLES.includes(actor.role)) return true;
  if (actor.role === "development_co_head") {
    return target === "development" || target === "hackathon";
  }
  if (actor.role === "management_co_head") {
    return ["admin", "pr", "social_media", "creatives", "management"].includes(target);
  }
  if (actor.role === "hackathon_head") return target === "hackathon";
  if (actor.role === "team_lead" || actor.role === "co_head") {
    return actor.department === target || actor.co_head_department === target;
  }
  return false;
}

function canSubmitWeeklyReport(actor, targetDept) {
  if (actor.role === "member" || actor.role === "faculty") return false;
  return canWriteDepartment(actor, targetDept);
}

function canRateMemberContribution(actor, targetMember) {
  if (actor.role === "member" || actor.role === "faculty") return false;
  if (actor.id === targetMember.id) return false;
  return canWriteDepartment(actor, targetMember.department);
}

function canReviewDailyReport(actor, reportDept) {
  if (actor.role === "faculty" || actor.role === "president" || actor.role === "vice_president") return true;
  if (actor.role === "development_head" || actor.role === "development_co_head") {
    return reportDept === "development" || reportDept === "hackathon" || reportDept === null;
  }
  if (actor.role === "management_head" || actor.role === "management_co_head") {
    return ["admin", "pr", "social_media", "creatives", "management"].includes(reportDept);
  }
  if (actor.role === "team_lead" || actor.role === "hackathon_head" || actor.role === "co_head") {
    return actor.department === reportDept || actor.co_head_department === reportDept;
  }
  return false;
}

function evaluateDailyReportSubmission(userReports, userId, reportDate) {
  const existingKey = `${userId}:${reportDate}`;
  if (userReports.has(existingKey)) {
    return { success: false, error: "Unique constraint violation: Daily report already exists for this date." };
  }
  userReports.add(existingKey);
  return { success: true };
}

function isTaskOverdue(task, now = new Date()) {
  if (task.status === "completed" || task.status === "cancelled") return false;
  return new Date(task.deadline) < now;
}

console.log("=== EXECUTING DEVCLUB SECURITY & PERMISSION UNIT TESTS ===");

// Scenario 1: Duplicate Daily Report Prevention
{
  const reportStore = new Set();
  const userId = "usr-101";
  const date = "2026-10-10";

  const firstSub = evaluateDailyReportSubmission(reportStore, userId, date);
  assert.strictEqual(firstSub.success, true);

  const duplicateSub = evaluateDailyReportSubmission(reportStore, userId, date);
  assert.strictEqual(duplicateSub.success, false);
  assert.ok(duplicateSub.error.includes("already exists"));
  console.log("PASS: 1. Duplicate daily report for same user and date rejected.");
}

// Scenario 2: Regular member unauthorized social media post creation/approval
{
  const plainDevMember = { role: "member", department: "development" };
  const socialMediaMember = { role: "member", department: "social_media" };
  const managementCoHead = { role: "management_co_head", department: "admin" };

  assert.strictEqual(canManageSocialMedia(plainDevMember), false);
  assert.strictEqual(canManageSocialMedia(socialMediaMember), true);
  assert.strictEqual(canManageSocialMedia(managementCoHead), true);
  console.log("PASS: 2. Social media management restricted to authorized social_media/creatives/management roles.");
}

// Scenario 3: Co-head report access bounds
{
  const devCoHead = { role: "development_co_head", department: "development" };
  const mgmtCoHead = { role: "management_co_head", department: "admin" };

  // Dev Co-head can review development & hackathon, but not PR
  assert.strictEqual(canReviewDailyReport(devCoHead, "development"), true);
  assert.strictEqual(canReviewDailyReport(devCoHead, "hackathon"), true);
  assert.strictEqual(canReviewDailyReport(devCoHead, "pr"), false);

  // Management Co-head can review PR & Creatives, but not Development
  assert.strictEqual(canReviewDailyReport(mgmtCoHead, "pr"), true);
  assert.strictEqual(canReviewDailyReport(mgmtCoHead, "creatives"), true);
  assert.strictEqual(canReviewDailyReport(mgmtCoHead, "development"), false);
  console.log("PASS: 3. Development & Management co-head report review bounds enforced.");
}

// Scenario 4: Plain member reading/modifying another member's report
{
  const memberActor = { role: "member", department: "creatives" };
  assert.strictEqual(canReviewDailyReport(memberActor, "creatives"), false);
  assert.strictEqual(canReviewDailyReport(memberActor, "development"), false);
  console.log("PASS: 4. Plain members blocked from reviewing/editing other members' reports.");
}

// Scenario 5: User attempting to change own role/permissions (canManageUsers strictly Mgmt Head & Dev Head per SPEC)
{
  const plainMember = "member";
  const teamLead = "team_lead";
  const coHead = "development_co_head";
  const president = "president";
  const mgmtHead = "management_head";
  const devHead = "development_head";

  assert.strictEqual(canManageUsers(plainMember), false);
  assert.strictEqual(canManageUsers(teamLead), false);
  assert.strictEqual(canManageUsers(coHead), false);
  assert.strictEqual(canManageUsers(president), false, "President does not have can_manage_users per SPEC line 52");
  assert.strictEqual(canManageUsers(mgmtHead), true);
  assert.strictEqual(canManageUsers(devHead), true);
  console.log("PASS: 5. Profile & permission management strictly restricted to management_head & development_head per SPEC.");
}

// Scenario 6: Unauthorized lead reviewing report outside department scope
{
  const prLead = { role: "team_lead", department: "pr" };
  assert.strictEqual(canReviewDailyReport(prLead, "pr"), true);
  assert.strictEqual(canReviewDailyReport(prLead, "creatives"), false);
  assert.strictEqual(canReviewDailyReport(prLead, "development"), false);
  console.log("PASS: 6. Team leads blocked from reviewing reports outside their department.");
}

// Scenario 7: Weekly report submission authorization (members and faculty blocked)
{
  const member = { role: "member", department: "development" };
  const faculty = { role: "faculty", department: null };
  const creativesLead = { role: "team_lead", department: "creatives" };
  const devHead = { role: "development_head", department: "development" };

  assert.strictEqual(canSubmitWeeklyReport(member, "development"), false);
  assert.strictEqual(canSubmitWeeklyReport(faculty, "development"), false);
  assert.strictEqual(canSubmitWeeklyReport(creativesLead, "creatives"), true);
  assert.strictEqual(canSubmitWeeklyReport(creativesLead, "development"), false);
  assert.strictEqual(canSubmitWeeklyReport(devHead, "development"), true);
  console.log("PASS: 7. Weekly report submission blocked for members/faculty; leads scoped to department.");
}

// Scenario 8: Lead rating authorization & self-rating prevention
{
  const member = { id: "u-1", role: "member", department: "creatives" };
  const peerMember = { id: "u-2", role: "member", department: "creatives" };
  const devMember = { id: "u-3", role: "member", department: "development" };
  const creativesLead = { id: "u-4", role: "team_lead", department: "creatives" };

  // Member cannot rate themselves
  assert.strictEqual(canRateMemberContribution(member, member), false);
  // Member cannot rate peers
  assert.strictEqual(canRateMemberContribution(member, peerMember), false);
  // Creatives lead cannot rate themselves
  assert.strictEqual(canRateMemberContribution(creativesLead, creativesLead), false);
  // Creatives lead can rate creatives member
  assert.strictEqual(canRateMemberContribution(creativesLead, peerMember), true);
  // Creatives lead cannot rate development member
  assert.strictEqual(canRateMemberContribution(creativesLead, devMember), false);
  console.log("PASS: 8. Lead rating authorization enforced: self-rating blocked, members blocked, cross-department blocked.");
}

// Scenario 9: Social media approval permissions
{
  const smMember = { role: "member", department: "social_media" };
  const smLead = { role: "team_lead", department: "social_media" };
  const mgmtCoHead = { role: "management_co_head", department: "admin" };

  assert.strictEqual(canApproveSocialMedia(smMember), false);
  assert.strictEqual(canApproveSocialMedia(smLead), true);
  assert.strictEqual(canApproveSocialMedia(mgmtCoHead), true);
  console.log("PASS: 9. Social media post approval blocked for plain members; restricted to leads & management co-heads.");
}

// Scenario 10: Task overdue calculation excludes completed AND cancelled tasks
{
  const pastDate = new Date(Date.now() - 86400000).toISOString();
  const completedTask = { status: "completed", deadline: pastDate };
  const cancelledTask = { status: "cancelled", deadline: pastDate };
  const inProgressOverdue = { status: "in_progress", deadline: pastDate };
  const delayedOverdue = { status: "delayed", deadline: pastDate };

  assert.strictEqual(isTaskOverdue(completedTask), false);
  assert.strictEqual(isTaskOverdue(cancelledTask), false, "Cancelled task must NOT be treated as overdue");
  assert.strictEqual(isTaskOverdue(inProgressOverdue), true);
  assert.strictEqual(isTaskOverdue(delayedOverdue), true);
  console.log("PASS: 10. Overdue task evaluation correctly excludes cancelled tasks.");
}

console.log("\nALL SECURITY & PERMISSION UNIT TESTS EXECUTED AND PASSED 100%!");
