// FILE: scripts/seed-test-accounts.mjs
// DevClub Management & Accountability System
// Safe & Idempotent Test Account Seeding & Standardization Utility

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Helper to load .env.local manually in pure Node
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
const TEST_DOMAIN = (process.env.TEST_EMAIL_DOMAIN || "devclub.test").toLowerCase();

// Command-line flag parsing
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run") || !args.includes("--apply");
const isApply = args.includes("--apply");
const confirmProduction = args.includes("--confirm-production");

console.log("=============================================================");
console.log(" DEVCLUB MANAGEMENT SYSTEM — QA ACCOUNT SETUP & STANDARDIZATION");
console.log("=============================================================");

if (!SUPABASE_URL) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL is missing in environment or .env.local.");
  process.exit(1);
}

// Extract and verify project ref without printing keys
const urlMatch = SUPABASE_URL.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
const projectRef = urlMatch ? urlMatch[1] : "unknown";
const projectHost = urlMatch ? new URL(SUPABASE_URL).host : "unknown";

console.log(`📌 Target Project Reference: ${projectRef}`);
console.log(`🌐 Target Supabase Host:     ${projectHost}`);
console.log(`⚙️  Execution Mode:           ${isDryRun ? "🔍 DRY-RUN (Preview only, 0 database writes)" : "🚀 APPLY (Active database updates)"}`);
console.log(`🛡️ Protected Owner Account:   ${OWNER_EMAIL}\n`);

if (process.env.NODE_ENV === "production" || process.env.APP_ENV === "production") {
  console.warn("⚠️ WARNING: Running against PRODUCTION environment!");
  if (!confirmProduction && isApply) {
    console.error("❌ Aborted. Pass --confirm-production with --apply to force execution in production.");
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
 * Authoritative QA Account Roster
 * Uses exact schema enums (AppRole and Department).
 * Standardized role-based display names ("Role — QA Account").
 */
export const QA_ACCOUNT_ROSTER = [
  // 1. Executive Leadership & Faculty
  {
    full_name: "Faculty — QA Account",
    email: `test.faculty@${TEST_DOMAIN}`,
    role: "faculty",
    department: null,
    co_head_department: null,
    reports_to: null,
  },
  {
    full_name: "President — QA Account",
    email: `test.president@${TEST_DOMAIN}`,
    role: "president",
    department: null,
    co_head_department: null,
    reports_to: null,
  },
  {
    full_name: "Vice President — QA Account",
    email: `test.vp@${TEST_DOMAIN}`,
    role: "vice_president",
    department: null,
    co_head_department: null,
    reports_to: `test.president@${TEST_DOMAIN}`,
  },

  // 2. Pillar Heads & Co-heads
  {
    full_name: "Development Head — QA Account",
    email: `test.development_head@${TEST_DOMAIN}`,
    role: "development_head",
    department: "development",
    co_head_department: null,
    reports_to: `test.president@${TEST_DOMAIN}`,
  },
  {
    full_name: "Development Co-head — QA Account",
    email: `test.cohead.dev@${TEST_DOMAIN}`,
    role: "development_co_head",
    department: "development",
    co_head_department: null,
    reports_to: `test.development_head@${TEST_DOMAIN}`,
  },
  {
    full_name: "Management Head — QA Account",
    email: `test.management_head@${TEST_DOMAIN}`,
    role: "management_head",
    department: "management",
    co_head_department: null,
    reports_to: `test.president@${TEST_DOMAIN}`,
  },
  {
    full_name: "Management Co-head — QA Account",
    email: `test.cohead.mgmt@${TEST_DOMAIN}`,
    role: "management_co_head",
    department: "management",
    co_head_department: null,
    reports_to: `test.management_head@${TEST_DOMAIN}`,
  },
  {
    full_name: "Hackathon Head — QA Account",
    email: `test.hackathon_head@${TEST_DOMAIN}`,
    role: "hackathon_head",
    department: "hackathon",
    co_head_department: null,
    reports_to: `test.president@${TEST_DOMAIN}`,
  },

  // 3. Department Team Leads
  {
    full_name: "Admin Team Lead — QA Account",
    email: `test.lead.admin@${TEST_DOMAIN}`,
    role: "team_lead",
    department: "admin",
    co_head_department: null,
    reports_to: `test.management_head@${TEST_DOMAIN}`,
  },
  {
    full_name: "PR Team Lead — QA Account",
    email: `test.lead.pr@${TEST_DOMAIN}`,
    role: "team_lead",
    department: "pr",
    co_head_department: null,
    reports_to: `test.management_head@${TEST_DOMAIN}`,
  },
  {
    full_name: "Social Media Team Lead — QA Account",
    email: `test.lead.social_media@${TEST_DOMAIN}`,
    role: "team_lead",
    department: "social_media",
    co_head_department: null,
    reports_to: `test.management_head@${TEST_DOMAIN}`,
  },
  {
    full_name: "Creatives Team Lead — QA Account",
    email: `test.lead.creatives@${TEST_DOMAIN}`,
    role: "team_lead",
    department: "creatives",
    co_head_department: null,
    reports_to: `test.management_head@${TEST_DOMAIN}`,
  },

  // 4. Department Co-heads
  {
    full_name: "Creatives Co-head — QA Account",
    email: `test.cohead.creatives@${TEST_DOMAIN}`,
    role: "co_head",
    department: "creatives",
    co_head_department: "creatives",
    reports_to: `test.lead.creatives@${TEST_DOMAIN}`,
  },

  // 5. Regular Department Members
  {
    full_name: "Development Member — QA Account",
    email: `test.member.dev@${TEST_DOMAIN}`,
    role: "member",
    department: "development",
    co_head_department: null,
    reports_to: `test.development_head@${TEST_DOMAIN}`,
  },
  {
    full_name: "Management Member — QA Account",
    email: `test.member.mgmt@${TEST_DOMAIN}`,
    role: "member",
    department: "management",
    co_head_department: null,
    reports_to: `test.management_head@${TEST_DOMAIN}`,
  },
  {
    full_name: "Hackathon Member — QA Account",
    email: `test.member.hackathon@${TEST_DOMAIN}`,
    role: "member",
    department: "hackathon",
    co_head_department: null,
    reports_to: `test.hackathon_head@${TEST_DOMAIN}`,
  },
  {
    full_name: "Creatives Member — QA Account",
    email: `test.member.creatives@${TEST_DOMAIN}`,
    role: "member",
    department: "creatives",
    co_head_department: null,
    reports_to: `test.lead.creatives@${TEST_DOMAIN}`,
  },
];

async function syncQAAccounts() {
  console.log("-------------------------------------------------------------");
  console.log("STEP 1: VERIFYING PRIMARY OWNER ACCOUNT SAFETY");
  console.log("-------------------------------------------------------------");

  const { data: ownerProfile, error: ownerProfErr } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, department, is_active")
    .eq("email", OWNER_EMAIL)
    .maybeSingle();

  if (ownerProfErr) {
    console.warn(`  ⚠️ Warning querying owner profile: ${ownerProfErr.message}`);
  } else if (ownerProfile) {
    console.log(`  🛡️ Owner Account Verified: ${ownerProfile.email}`);
    console.log(`     Display Name: "${ownerProfile.full_name}" | Role: ${ownerProfile.role} | Active: ${ownerProfile.is_active}`);
    console.log("     STATUS: PROTECTED (Will NOT be altered, renamed, or modified)\n");
  } else {
    console.log(`  ℹ️  Owner account ${OWNER_EMAIL} not currently in profiles table.\n`);
  }

  console.log("-------------------------------------------------------------");
  console.log(`STEP 2: EVALUATING ${QA_ACCOUNT_ROSTER.length} QA ACCOUNTS (${isDryRun ? "DRY-RUN PREVIEW" : "APPLYING CHANGES"})`);
  console.log("-------------------------------------------------------------");

  // Fetch current database state
  const { data: existingApproved } = await supabase
    .from("approved_emails")
    .select("email, full_name, role, department, co_head_department, reporting_head_id");

  const { data: existingProfiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, department, is_active, co_head_department, reporting_head_id");

  const { data: authUsersData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const allAuthUsers = authUsersData?.users || [];

  const approvedMap = new Map((existingApproved || []).map((a) => [a.email.toLowerCase(), a]));
  const profileMap = new Map((existingProfiles || []).map((p) => [p.email.toLowerCase(), p]));
  const authUserMap = new Map((allAuthUsers || []).map((u) => [u.email.toLowerCase(), u]));

  let toCreateApproved = 0;
  let toUpdateApproved = 0;
  let verifiedApproved = 0;

  let toCreateAuth = 0;
  let toUpdateAuth = 0;
  let verifiedAuth = 0;

  let toCreateProfile = 0;
  let toUpdateProfile = 0;
  let verifiedProfile = 0;

  for (const acc of QA_ACCOUNT_ROSTER) {
    const email = acc.email.toLowerCase();
    const currApproved = approvedMap.get(email);
    const currAuth = authUserMap.get(email);
    const currProfile = profileMap.get(email);

    console.log(`🔍 [${acc.role}] ${email}`);

    // Part A: Approved Emails
    if (!currApproved) {
      toCreateApproved++;
      console.log(`   ➕ approved_emails: Plan INSERT -> name: "${acc.full_name}", role: ${acc.role}, dept: ${acc.department || "null"}`);
      if (isApply) {
        const { error: insErr } = await supabase.from("approved_emails").insert({
          email: email,
          full_name: acc.full_name,
          role: acc.role,
          department: acc.department,
          co_head_department: acc.co_head_department,
        });
        if (insErr) console.error(`      ❌ Error inserting approved_emails: ${insErr.message}`);
        else console.log(`      ✅ Inserted approved_email record.`);
      }
    } else {
      const needsNameUpdate = currApproved.full_name !== acc.full_name;
      const needsRoleUpdate = currApproved.role !== acc.role;
      const needsDeptUpdate = currApproved.department !== acc.department;
      const needsCoHeadUpdate = (currApproved.co_head_department ?? null) !== (acc.co_head_department ?? null);

      if (needsNameUpdate || needsRoleUpdate || needsDeptUpdate || needsCoHeadUpdate) {
        toUpdateApproved++;
        console.log(`   🔄 approved_emails: Plan UPDATE -> rename "${currApproved.full_name}" -> "${acc.full_name}"`);
        if (isApply) {
          const { error: updErr } = await supabase
            .from("approved_emails")
            .update({
              full_name: acc.full_name,
              role: acc.role,
              department: acc.department,
              co_head_department: acc.co_head_department,
            })
            .eq("email", email);
          if (updErr) console.error(`      ❌ Error updating approved_emails: ${updErr.message}`);
          else console.log(`      ✅ Updated approved_email record.`);
        }
      } else {
        verifiedApproved++;
        console.log(`   ✓ approved_emails: Verified (name: "${currApproved.full_name}")`);
      }
    }

    // Part B: Auth User
    let authUserId = currAuth?.id;
    if (!currAuth) {
      toCreateAuth++;
      console.log(`   ➕ auth.users: Plan CREATE -> email_confirm: true, metadata: { full_name: "${acc.full_name}" }`);
      if (isApply) {
        const { data: newAuth, error: createAuthErr } = await supabase.auth.admin.createUser({
          email: email,
          email_confirm: true,
          user_metadata: { full_name: acc.full_name },
        });
        if (createAuthErr) {
          console.error(`      ❌ Error creating auth user: ${createAuthErr.message}`);
        } else if (newAuth?.user) {
          authUserId = newAuth.user.id;
          console.log(`      ✅ Auth user created with ID: ${authUserId}`);
        }
      }
    } else {
      const currMetaName = currAuth.user_metadata?.full_name;
      if (currMetaName !== acc.full_name) {
        toUpdateAuth++;
        console.log(`   🔄 auth.users: Plan UPDATE metadata -> "${currMetaName || "none"}" -> "${acc.full_name}"`);
        if (isApply) {
          const { error: updAuthErr } = await supabase.auth.admin.updateUserById(currAuth.id, {
            user_metadata: { ...currAuth.user_metadata, full_name: acc.full_name },
          });
          if (updAuthErr) console.error(`      ❌ Error updating auth metadata: ${updAuthErr.message}`);
          else console.log(`      ✅ Updated auth user metadata.`);
        }
      } else {
        verifiedAuth++;
        console.log(`   ✓ auth.users: Verified (confirmed: ${Boolean(currAuth.email_confirmed_at)})`);
      }
    }

    // Part C: Profiles
    if (!currProfile) {
      toCreateProfile++;
      console.log(`   ➕ profiles: Plan INSERT -> name: "${acc.full_name}", role: ${acc.role}, active: true`);
      if (isApply && authUserId) {
        const { error: insProfErr } = await supabase.from("profiles").insert({
          id: authUserId,
          email: email,
          full_name: acc.full_name,
          role: acc.role,
          department: acc.department,
          co_head_department: acc.co_head_department,
          is_active: true,
        });
        if (insProfErr) console.error(`      ❌ Error inserting profile: ${insProfErr.message}`);
        else console.log(`      ✅ Profile created.`);
      }
    } else {
      const needsName = currProfile.full_name !== acc.full_name;
      const needsRole = currProfile.role !== acc.role;
      const needsDept = currProfile.department !== acc.department;
      const needsActive = !currProfile.is_active;
      const needsCoHead = (currProfile.co_head_department ?? null) !== (acc.co_head_department ?? null);

      if (needsName || needsRole || needsDept || needsActive || needsCoHead) {
        toUpdateProfile++;
        console.log(`   🔄 profiles: Plan UPDATE -> rename "${currProfile.full_name}" -> "${acc.full_name}" (active: true)`);
        if (isApply) {
          const { error: updProfErr } = await supabase
            .from("profiles")
            .update({
              full_name: acc.full_name,
              role: acc.role,
              department: acc.department,
              co_head_department: acc.co_head_department,
              is_active: true,
            })
            .eq("email", email);
          if (updProfErr) console.error(`      ❌ Error updating profile: ${updProfErr.message}`);
          else console.log(`      ✅ Profile updated.`);
        }
      } else {
        verifiedProfile++;
        console.log(`   ✓ profiles: Verified (name: "${currProfile.full_name}")`);
      }
    }
    console.log("");
  }

  // Part D: Reporting Head Hierarchy Linking
  console.log("-------------------------------------------------------------");
  console.log("STEP 3: RESOLVING REPORTING HEAD RELATIONSHIPS");
  console.log("-------------------------------------------------------------");

  // Re-fetch profiles to map reporting head UUIDs
  const { data: updatedProfiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, department, reporting_head_id");

  const emailToId = new Map((updatedProfiles || []).map((p) => [p.email.toLowerCase(), p.id]));

  let linksUpdated = 0;
  for (const acc of QA_ACCOUNT_ROSTER) {
    if (!acc.reports_to) continue;

    const email = acc.email.toLowerCase();
    const targetHeadEmail = acc.reports_to.toLowerCase();
    const targetHeadId = emailToId.get(targetHeadEmail);

    if (!targetHeadId) {
      console.warn(`  ⚠️ Target head ${targetHeadEmail} not yet in profiles (will resolve on apply).`);
      continue;
    }

    const currentProfile = (updatedProfiles || []).find((p) => p.email.toLowerCase() === email);
    if (currentProfile && currentProfile.reporting_head_id !== targetHeadId) {
      linksUpdated++;
      console.log(`  🔗 Plan Link: ${email} -> reports to ${targetHeadEmail} (${targetHeadId})`);
      if (isApply) {
        await supabase
          .from("profiles")
          .update({ reporting_head_id: targetHeadId })
          .eq("email", email);

        await supabase
          .from("approved_emails")
          .update({ reporting_head_id: targetHeadId })
          .eq("email", email);
      }
    } else {
      console.log(`  ✓ Hierarchy Verified: ${email} -> ${targetHeadEmail}`);
    }
  }

  console.log("\n=============================================================");
  console.log(` SETUP SUMMARY RESULT (${isDryRun ? "DRY-RUN PREVIEW" : "APPLY COMPLETE"})`);
  console.log("=============================================================");
  console.log(`  • Approved Emails:   ${toCreateApproved} to create | ${toUpdateApproved} to update | ${verifiedApproved} verified`);
  console.log(`  • Auth Users:        ${toCreateAuth} to create | ${toUpdateAuth} to update | ${verifiedAuth} verified`);
  console.log(`  • Member Profiles:   ${toCreateProfile} to create | ${toUpdateProfile} to update | ${verifiedProfile} verified`);
  console.log(`  • Reporting Links:   ${linksUpdated} relationships to link`);
  console.log("=============================================================\n");

  if (isDryRun) {
    console.log("💡 DRY-RUN FINISHED: No changes were written to the database.");
    console.log("   To apply these updates, run:");
    console.log("   node scripts/seed-test-accounts.mjs --apply\n");
  } else {
    console.log("🎉 ALL QA ACCOUNTS SUCCESSFULLY STANDARDIZED & SYNCHRONIZED!");
    console.log("   Next step: Run 'npm run set:test-passwords' to set secure passwords.\n");
  }
}

syncQAAccounts().catch((err) => {
  console.error("Fatal error during QA account synchronization:", err);
  process.exit(1);
});
