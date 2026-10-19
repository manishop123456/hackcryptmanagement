// FILE: scripts/migrate-email-identities.mjs
// DevClub Management & Accountability System
// Safe, Idempotent Email Identity Provisioning & Migration Utility
//
// Rules & Invariants:
// 1. Dry-run by default. Requires --apply to make changes.
// 2. Strict target environment confirmation (--confirm-production in prod).
// 3. Sanitized project reference display (never prints keys or secrets).
// 4. Owner account (manish.choudhary@devclubtrcac.in) is strictly protected and immutable.
// 5. Preserves existing Supabase Auth UUID (user.id) on all email migrations.
// 6. QA accounts (@devclub.test) are kept isolated and protected.

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Helper to safely load environment variables from .env.local without external deps
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OWNER_EMAIL = (process.env.SEED_ADMIN_EMAIL || "manish.choudhary@devclubtrcac.in").toLowerCase();

// Command-line flag parsing
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run") || !args.includes("--apply");
const isApply = args.includes("--apply");
const confirmProduction = args.includes("--confirm-production");
const targetUserFlag = args.find((a) => a.startsWith("--user="))?.split("=")[1]?.toLowerCase();
const isStatusOnly = args.includes("--status");

console.log("=============================================================");
console.log(" DEVCLUB MANAGEMENT SYSTEM — EMAIL IDENTITY MIGRATION UTILITY");
console.log("=============================================================");

if (!SUPABASE_URL) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL is missing in environment or .env.local.");
  process.exit(1);
}

// Extract and display sanitized project ref
const urlMatch = SUPABASE_URL.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
const rawProjectRef = urlMatch ? urlMatch[1] : "unknown";
const sanitizedProjectRef = rawProjectRef.length > 6
  ? `${rawProjectRef.substring(0, 4)}***${rawProjectRef.slice(-2)}`
  : rawProjectRef;
const projectHost = urlMatch ? new URL(SUPABASE_URL).host : "unknown";

console.log(`📌 Target Project Reference: ${sanitizedProjectRef}`);
console.log(`🌐 Target Supabase Host:     ${projectHost}`);
console.log(`⚙️  Execution Mode:           ${isDryRun ? "🔍 DRY-RUN (Preview only, 0 database writes)" : "🚀 APPLY (Active database updates)"}`);
console.log(`🛡️ Protected Owner Account:   ${OWNER_EMAIL}\n`);

const isProductionEnv = process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";

if (isProductionEnv) {
  console.warn("⚠️ WARNING: Target environment is flagged as PRODUCTION!");
  if (isApply && !confirmProduction) {
    console.error("❌ Aborted. You must specify --confirm-production alongside --apply to write to production.");
    process.exit(1);
  }
}

if (!SERVICE_ROLE_KEY) {
  console.error("❌ ERROR: SUPABASE_SERVICE_ROLE_KEY is missing in .env.local.");
  console.error("   Administrative account provisioning requires the service-role key.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Authoritative Member Roster for DevClub TRCAC
 * From docs/SPEC.md §3.
 */
export const OFFICIAL_MEMBER_ROSTER = [
  {
    full_name: "Prof. Komal Jambhale",
    official_email: "komal.jambhale@devclubtrcac.in",
    role: "faculty",
    department: null,
    co_head_department: null,
    reports_to: null,
    is_owner: false,
  },
  {
    full_name: "Soujas Mane",
    official_email: "soujas.mane@devclubtrcac.in",
    role: "president",
    department: null,
    co_head_department: null,
    reports_to: null,
    is_owner: false,
  },
  {
    full_name: "Omkar More",
    official_email: "omkar.more@devclubtrcac.in",
    role: "vice_president",
    department: null,
    co_head_department: null,
    reports_to: "soujas.mane@devclubtrcac.in",
    is_owner: false,
  },
  {
    full_name: "Manish Choudhary",
    official_email: "manish.choudhary@devclubtrcac.in",
    role: "development_head",
    department: "development",
    co_head_department: null,
    reports_to: "soujas.mane@devclubtrcac.in",
    is_owner: true,
  },
  {
    full_name: "Kinjal More",
    official_email: "kinjal.more@devclubtrcac.in",
    role: "management_head",
    department: "management",
    co_head_department: null,
    reports_to: "soujas.mane@devclubtrcac.in",
    is_owner: false,
  },
  {
    full_name: "Hiya Sonpar",
    official_email: "hiya.sonpar@devclubtrcac.in",
    role: "team_lead",
    department: "creatives",
    co_head_department: null,
    reports_to: "kinjal.more@devclubtrcac.in",
    is_owner: false,
  },
  {
    full_name: "Kunal Sakhiya",
    official_email: "kunal.sakhiya@devclubtrcac.in",
    role: "team_lead",
    department: "admin",
    co_head_department: null,
    reports_to: "kinjal.more@devclubtrcac.in",
    is_owner: false,
  },
  {
    full_name: "Naeva Parmar",
    official_email: "naeva.parmar@devclubtrcac.in",
    role: "team_lead",
    department: "social_media",
    co_head_department: null,
    reports_to: "kinjal.more@devclubtrcac.in",
    is_owner: false,
  },
  {
    full_name: "Darshan Gohil",
    official_email: "darshan.gohil@devclubtrcac.in",
    role: "team_lead",
    department: "pr",
    co_head_department: null,
    reports_to: "kinjal.more@devclubtrcac.in",
    is_owner: false,
  },
  {
    full_name: "Yash Khanvilkar",
    official_email: "yash.khanvilkar@devclubtrcac.in",
    role: "member",
    department: "management",
    co_head_department: null,
    reports_to: "kinjal.more@devclubtrcac.in",
    is_owner: false,
  },
  {
    full_name: "Shubham Dayama",
    official_email: "shubham.dayama@devclubtrcac.in",
    role: "member",
    department: "management",
    co_head_department: null,
    reports_to: "kinjal.more@devclubtrcac.in",
    is_owner: false,
  },
];

async function main() {
  console.log("--- Reading Database State ---");

  // Fetch approved_emails
  const { data: approvedList, error: appErr } = await supabase
    .from("approved_emails")
    .select("email, full_name, role, department, reporting_head_id, co_head_department");

  if (appErr) {
    console.error("❌ Failed to query approved_emails:", appErr.message);
    process.exit(1);
  }

  // Fetch profiles
  const { data: profileList, error: profErr } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, department, is_active, reporting_head_id, co_head_department");

  if (profErr) {
    console.error("❌ Failed to query profiles:", profErr.message);
    process.exit(1);
  }

  // Fetch Auth Users
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authErr) {
    console.error("❌ Failed to query Auth users:", authErr.message);
    process.exit(1);
  }

  const authUsers = authData.users || [];
  const approvedMap = new Map(approvedList.map((a) => [a.email.toLowerCase(), a]));
  const profileMap = new Map(profileList.map((p) => [p.email.toLowerCase(), p]));
  const authMap = new Map(authUsers.map((u) => [(u.email || "").toLowerCase(), u]));

  console.log(`Found ${approvedList.length} approved emails, ${profileList.length} profiles, and ${authUsers.length} Supabase Auth users.\n`);

  if (isStatusOnly) {
    console.log("=== AUDIT SUMMARY ===");
    console.log("Official Member Identities:");
    for (const m of OFFICIAL_MEMBER_ROSTER) {
      const email = m.official_email.toLowerCase();
      const inApp = approvedMap.has(email);
      const inProf = profileMap.has(email);
      const inAuth = authMap.has(email);
      const isOwner = email === OWNER_EMAIL;
      console.log(`- ${m.full_name} <${email}>`);
      console.log(`  Role: ${m.role} | Dept: ${m.department || "none"} | Owner: ${isOwner}`);
      console.log(`  Status: Approved: ${inApp ? "✅" : "❌"} | Profile: ${inProf ? "✅" : "❌"} | AuthUser: ${inAuth ? "✅" : "❌"}`);
    }
    return;
  }

  // Filter roster if targetUserFlag is specified
  const targetRoster = targetUserFlag
    ? OFFICIAL_MEMBER_ROSTER.filter((m) => m.official_email.toLowerCase() === targetUserFlag)
    : OFFICIAL_MEMBER_ROSTER;

  if (targetUserFlag && targetRoster.length === 0) {
    console.error(`❌ User ${targetUserFlag} not found in the official roster.`);
    process.exit(1);
  }

  console.log(`=== EVALUATING ${targetRoster.length} ROSTER IDENTITIES ===\n`);

  const actions = [];

  for (const member of targetRoster) {
    const targetEmail = member.official_email.toLowerCase();

    // Invariant: Owner account is strictly protected
    if (targetEmail === OWNER_EMAIL) {
      console.log(`🛡️  SKIPPING Protected Owner: ${member.full_name} (${targetEmail}) — Account is immutable.`);
      continue;
    }

    const currentApproved = approvedMap.get(targetEmail);
    const currentProfile = profileMap.get(targetEmail);
    const currentAuth = authMap.get(targetEmail);

    if (currentApproved && currentProfile && currentAuth) {
      console.log(`✅ ${member.full_name} (${targetEmail}) already fully active in DB & Auth.`);
      continue;
    }

    if (!currentApproved) {
      actions.push({
        type: "PRE_APPROVE_EMAIL",
        member,
        description: `Add ${targetEmail} to approved_emails with role "${member.role}" and dept "${member.department || "none"}"`,
      });
    }

    if (!currentAuth) {
      actions.push({
        type: "AWAIT_PROVIDER_ONBOARDING",
        member,
        description: `Mailbox ${targetEmail} needs provider provisioning before invite or password setup`,
      });
    }
  }

  console.log(`\n--- Plan Summary (${actions.length} planned actions) ---`);
  actions.forEach((act, idx) => {
    console.log(`${idx + 1}. [${act.type}] ${act.description}`);
  });

  if (isDryRun) {
    console.log("\n=============================================================");
    console.log("🔍 DRY-RUN COMPLETE: 0 database writes were performed.");
    console.log("   To execute approved database changes, re-run with --apply.");
    console.log("=============================================================");
    return;
  }

  // If --apply is given, perform safe updates
  console.log("\n🚀 APPLYING APPROVED IDENTITIES TO DATABASE...");

  for (const act of actions) {
    if (act.type === "PRE_APPROVE_EMAIL") {
      const { member } = act;
      console.log(`Writing approved_email: ${member.official_email}...`);
      const { error: insErr } = await supabase.from("approved_emails").upsert({
        email: member.official_email.toLowerCase(),
        full_name: member.full_name,
        role: member.role,
        department: member.department,
        co_head_department: member.co_head_department,
      });

      if (insErr) {
        console.error(`❌ Failed to approve ${member.official_email}:`, insErr.message);
      } else {
        console.log(`✅ Approved ${member.official_email}`);
      }
    }
  }

  console.log("\n✅ Application phase complete.");
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
