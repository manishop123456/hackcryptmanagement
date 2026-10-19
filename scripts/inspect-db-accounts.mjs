// FILE: scripts/inspect-db-accounts.mjs
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

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

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: approved, error: appErr } = await supabase
    .from("approved_emails")
    .select("email, full_name, role, department, reporting_head_id, co_head_department")
    .order("email");

  if (appErr) {
    console.error("Error reading approved_emails:", appErr.message);
  } else {
    console.log(`=== APPROVED EMAILS IN DB (${approved.length}) ===`);
    approved.forEach((a) => {
      console.log(`- ${a.email} | ${a.role} | ${a.department || "none"} | "${a.full_name}"`);
    });
  }

  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, department, is_active, reporting_head_id, co_head_department")
    .order("email");

  if (profErr) {
    console.error("Error reading profiles:", profErr.message);
  } else {
    console.log(`\n=== PROFILES IN DB (${profiles.length}) ===`);
    profiles.forEach((p) => {
      console.log(`- ${p.email} | ${p.role} | ${p.department || "none"} | "${p.full_name}" | active: ${p.is_active}`);
    });
  }

  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authErr) {
    console.error("Error listing Auth users:", authErr.message);
  } else {
    const users = authData.users || [];
    console.log(`\n=== AUTH USERS IN SUPABASE AUTH (${users.length}) ===`);
    users.forEach((u) => {
      console.log(`- ${u.email} | confirmed: ${Boolean(u.email_confirmed_at)} | meta name: "${u.user_metadata?.full_name || ""}"`);
    });
  }
}

main().catch(console.error);
