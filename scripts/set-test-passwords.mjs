// FILE: scripts/set-test-passwords.mjs
// DevClub Management & Accountability System
// Secure QA Account Password Utility

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { createClient } from "@supabase/supabase-js";

const EXPECTED_PROJECT_REF = "fyjsdgufcnnnukcfsdio";
const MIN_PASSWORD_LENGTH = 8;

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

console.log("=============================================================");
console.log(" DEVCLUB MANAGEMENT SYSTEM — QA ACCOUNT PASSWORD UTILITY");
console.log("=============================================================");

if (!SUPABASE_URL) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL is missing in environment or .env.local.");
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error("❌ ERROR: SUPABASE_SERVICE_ROLE_KEY is missing in .env.local.");
  console.error("   Setting auth passwords via Admin API requires SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

// Extract and verify project ref
const urlMatch = SUPABASE_URL.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
const projectRef = urlMatch ? urlMatch[1] : null;

if (!projectRef || projectRef !== EXPECTED_PROJECT_REF) {
  console.error(`❌ ERROR: Target project ref '${projectRef}' does not match expected ref '${EXPECTED_PROJECT_REF}'.`);
  console.error("   Aborting to prevent changing passwords on an unexpected environment.");
  process.exit(1);
}

// Complete 17 QA Account Allowlist strictly scoped to TEST_DOMAIN
// The real owner account is strictly EXCLUDED from this list.
export const QA_TARGET_EMAILS = [
  `test.faculty@${TEST_DOMAIN}`,
  `test.president@${TEST_DOMAIN}`,
  `test.vp@${TEST_DOMAIN}`,
  `test.development_head@${TEST_DOMAIN}`,
  `test.cohead.dev@${TEST_DOMAIN}`,
  `test.management_head@${TEST_DOMAIN}`,
  `test.cohead.mgmt@${TEST_DOMAIN}`,
  `test.hackathon_head@${TEST_DOMAIN}`,
  `test.lead.admin@${TEST_DOMAIN}`,
  `test.lead.pr@${TEST_DOMAIN}`,
  `test.lead.social_media@${TEST_DOMAIN}`,
  `test.lead.creatives@${TEST_DOMAIN}`,
  `test.cohead.creatives@${TEST_DOMAIN}`,
  `test.member.dev@${TEST_DOMAIN}`,
  `test.member.mgmt@${TEST_DOMAIN}`,
  `test.member.hackathon@${TEST_DOMAIN}`,
  `test.member.creatives@${TEST_DOMAIN}`,
].map((e) => e.toLowerCase());

// Parse command line arguments:
// node scripts/set-test-passwords.mjs [--account=<email>] [--confirm]
const args = process.argv.slice(2);
const accountArg = args.find((a) => a.startsWith("--account="));
const singleAccountEmail = accountArg ? accountArg.split("=")[1].trim().toLowerCase() : null;
const autoConfirm = args.includes("--confirm") || args.includes("-y");

// HARD SAFETY CHECK: Never allow the owner account to be targeted
if (singleAccountEmail === OWNER_EMAIL) {
  console.error(`❌ CRITICAL SECURITY ERROR: The primary owner account '${OWNER_EMAIL}' is strictly protected.`);
  console.error("   It cannot be targeted for password resets via test account utilities.");
  process.exit(1);
}

// Determine active target list
let targetsToUpdate = [];
if (singleAccountEmail) {
  if (!QA_TARGET_EMAILS.includes(singleAccountEmail)) {
    console.error(`❌ ERROR: '${singleAccountEmail}' is not an authorized QA test account.`);
    console.error("   Authorized QA test accounts must belong to @devclub.test.");
    process.exit(1);
  }
  targetsToUpdate = [singleAccountEmail];
  console.log(`🎯 Mode: SINGLE QA ACCOUNT UPDATE (${singleAccountEmail})`);
} else {
  targetsToUpdate = QA_TARGET_EMAILS;
  console.log(`🎯 Mode: ALL QA ACCOUNTS UPDATE (${targetsToUpdate.length} accounts)`);
}

// Extra safety assertion: Ensure owner email is not in targetsToUpdate
if (targetsToUpdate.includes(OWNER_EMAIL)) {
  console.error(`❌ FATAL: Owner account '${OWNER_EMAIL}' detected in targets list. Aborting immediately.`);
  process.exit(1);
}

console.log(`📌 Target Project Ref: ${projectRef}`);
console.log(`🛡️ Protected Owner Account: ${OWNER_EMAIL} (Excluded from update)`);
console.log("-------------------------------------------------------------\n");

// Initialize server-side administrative Supabase client
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function promptText(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function promptHidden(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    let muted = false;
    rl._writeToOutput = function writeToOutput(stringToWrite) {
      if (muted) {
        if (stringToWrite === "\r\n" || stringToWrite === "\n") {
          process.stdout.write("\n");
        } else {
          process.stdout.write("*");
        }
      } else {
        process.stdout.write(stringToWrite);
      }
    };

    rl.question(query, (value) => {
      rl.close();
      resolve(value.trim());
    });
    muted = true;
  });
}

async function setTestPasswords() {
  // Step 1: Resolve Auth Users and Profiles
  console.log("🔍 Resolving target Auth user IDs and verifying active profiles...");
  const { data: userListData, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (listErr) {
    console.error(`❌ Failed to list Auth users: ${listErr.message}`);
    process.exit(1);
  }

  const { data: profileList, error: profErr } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active");

  if (profErr) {
    console.error(`❌ Failed to query profiles: ${profErr.message}`);
    process.exit(1);
  }

  const allAuthUsers = userListData?.users || [];
  const profileMap = new Map((profileList || []).map((p) => [p.email.toLowerCase(), p]));

  const resolvedTargets = [];
  const missingAccounts = [];

  for (const email of targetsToUpdate) {
    const authUser = allAuthUsers.find((u) => u.email?.toLowerCase() === email);
    const profile = profileMap.get(email);

    if (authUser && profile && profile.is_active) {
      resolvedTargets.push({
        id: authUser.id,
        email: email,
        fullName: profile.full_name,
        role: profile.role,
      });
    } else {
      missingAccounts.push({
        email,
        hasAuth: Boolean(authUser),
        hasProfile: Boolean(profile),
        isActive: profile?.is_active ?? false,
      });
    }
  }

  if (missingAccounts.length > 0) {
    console.error(`❌ ERROR: ${missingAccounts.length} target accounts are missing or incomplete in Supabase:`);
    missingAccounts.forEach((m) => {
      console.error(`   - ${m.email} (Auth User: ${m.hasAuth ? "YES" : "NO"}, Profile: ${m.hasProfile ? "YES" : "NO"}, Active: ${m.isActive})`);
    });
    console.error("\nRun 'npm run seed:test-users -- --apply' first to provision all missing accounts before setting passwords.");
    process.exit(1);
  }

  console.log(`✅ All ${resolvedTargets.length} target accounts verified in Supabase Auth & Profiles.\n`);
  console.log("📋 Target Accounts:");
  resolvedTargets.forEach((t, idx) => {
    console.log(`  ${idx + 1}. ${t.email} — "${t.fullName}" (${t.role})`);
  });
  console.log("");

  // Step 2: Acquire Password
  let password = process.env.TEST_ACCOUNTS_PASSWORD;

  if (password) {
    console.log("🔑 Password provided via environment variable TEST_ACCOUNTS_PASSWORD.");
    if (password.length < MIN_PASSWORD_LENGTH) {
      console.error(`❌ ERROR: TEST_ACCOUNTS_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      process.exit(1);
    }
  } else if (!process.stdin.isTTY) {
    console.error("❌ ERROR: Terminal is not interactive and TEST_ACCOUNTS_PASSWORD is not set.");
    console.error("   Usage in non-interactive environments: TEST_ACCOUNTS_PASSWORD=your_password node scripts/set-test-passwords.mjs");
    process.exit(1);
  } else {
    password = await promptHidden(`🔑 Enter temporary password for ${resolvedTargets.length} account(s) (min ${MIN_PASSWORD_LENGTH} chars): `);
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      console.error(`\n❌ ERROR: Password must be at least ${MIN_PASSWORD_LENGTH} characters long. Aborting.`);
      process.exit(1);
    }

    const confirmPassword = await promptHidden("🔑 Confirm temporary password: ");
    if (password !== confirmPassword) {
      console.error("\n❌ ERROR: Password confirmation does not match. Aborting.");
      process.exit(1);
    }
  }

  // Step 3: Confirmation
  if (!autoConfirm && process.stdin.isTTY) {
    console.log("\n-------------------------------------------------------------");
    console.log(`⚠️ CONFIRMATION: You are about to update passwords for ${resolvedTargets.length} QA account(s).`);
    console.log(`   Target Project: ${projectRef}`);
    console.log(`   Protected Owner: ${OWNER_EMAIL} (Will not be touched)`);
    console.log("-------------------------------------------------------------");

    const confirmChoice = await promptText("Proceed with password update? (y/N): ");
    if (confirmChoice.toLowerCase() !== "y" && confirmChoice.toLowerCase() !== "yes") {
      console.log("\n🛑 Operation cancelled. No passwords were changed.");
      process.exit(0);
    }
  }

  // Step 4: Execute Password Updates
  console.log("\n🚀 Updating passwords across target accounts...");
  let successCount = 0;
  let failCount = 0;

  for (const target of resolvedTargets) {
    try {
      const { error: updateErr } = await supabase.auth.admin.updateUserById(target.id, {
        password: password,
      });

      if (updateErr) {
        console.error(`  ❌ Failed to update password for ${target.email}: ${updateErr.message}`);
        failCount++;
      } else {
        console.log(`  ✅ Password updated: ${target.email} ("${target.fullName}")`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ❌ Unexpected error updating ${target.email}:`, err.message || err);
      failCount++;
    }
  }

  console.log("\n=============================================================");
  console.log(` PASSWORD UPDATE SUMMARY: ${successCount} Succeeded | ${failCount} Failed`);
  console.log("=============================================================\n");

  if (failCount > 0) {
    console.error("❌ One or more account password updates failed. Exit code 1.");
    process.exit(1);
  }

  console.log(`🎉 Successfully updated passwords for ${successCount} QA accounts!`);
  console.log("💡 You can now log in at /login with these accounts individually.");
}

setTestPasswords().catch((err) => {
  console.error("Fatal error during password update:", err);
  process.exit(1);
});
