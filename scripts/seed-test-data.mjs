// FILE: scripts/seed-test-data.mjs
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
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

console.log("=============================================================");
console.log(" HACKCRYPT MANAGEMENT SYSTEM — TEST DATA SEEDING UTILITY");
console.log("=============================================================");

if (!SUPABASE_URL) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL is missing.");
  process.exit(1);
}

const supabaseKey = SERVICE_ROLE_KEY || ANON_KEY;
if (!supabaseKey) {
  console.error("❌ ERROR: Supabase key missing.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seedTestData() {
  let hasErrors = false;
  let createdCount = 0;
  let existsCount = 0;
  let failedCount = 0;

  // Fetch existing profiles to assign owners
  const { data: profiles, error: profErr } = await supabase.from("profiles").select("id, email, role, department");
  if (profErr || !profiles || profiles.length === 0) {
    console.error(`❌ No profiles found (${profErr ? profErr.message : "table empty"}). Run 'npm run seed:test-users' first.`);
    process.exit(1);
  }

  const devHead = profiles.find((p) => p.role === "development_head") || profiles[0];
  const adminLead = profiles.find((p) => p.department === "admin") || profiles[0];

  console.log(`📌 Seeding test records assigned to author: ${devHead.email}\n`);

  // 1. Seed Tasks
  console.log("📋 Seeding Sample Tasks...");
  const sampleTasks = [
    {
      title: "[TEST] Build HackCrypt Registration Portal",
      description: "Develop responsive registration form with team roster input and problem statement selection.",
      department: "development",
      owner_id: devHead.id,
      assigned_by: devHead.id,
      deadline: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
      priority: "high",
      status: "in_progress",
      output: null,
    },
    {
      title: "[TEST] Design Event Teaser & Posters",
      description: "Create Instagram posters and venue banners in DevClub brand cyan (#00E5FF).",
      department: "creatives",
      owner_id: devHead.id,
      assigned_by: devHead.id,
      deadline: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      priority: "medium",
      status: "completed",
      output: "https://figma.com/file/sample-posters-test",
    },
    {
      title: "[TEST] Finalize Sponsor Proposals",
      description: "Reach out to potential tech sponsors for prize pool funding.",
      department: "pr",
      owner_id: devHead.id,
      assigned_by: devHead.id,
      deadline: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
      priority: "high",
      status: "review",
      output: null,
    },
  ];

  for (const t of sampleTasks) {
    const { data: existing, error: selErr } = await supabase.from("tasks").select("id").eq("title", t.title).maybeSingle();
    if (selErr) {
      console.error(`  ❌ Failed to query task '${t.title}': ${selErr.message}`);
      hasErrors = true;
      failedCount++;
    } else if (existing) {
      console.log(`  ℹ️  [EXISTS] Task: ${t.title}`);
      existsCount++;
    } else {
      const { error } = await supabase.from("tasks").insert(t);
      if (error) {
        console.error(`  ❌ Task insert error '${t.title}': ${error.message}`);
        hasErrors = true;
        failedCount++;
      } else {
        console.log(`  ✅ [CREATED] Task: ${t.title}`);
        createdCount++;
      }
    }
  }

  // 2. Seed Attendance Sessions
  console.log("\n📍 Seeding Sample Attendance Sessions...");
  const sampleSessions = [
    {
      title: "[TEST] HackCrypt General Body Sync",
      type: "meeting",
      department: null,
      starts_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      ends_at: new Date(Date.now() + 7200 * 1000).toISOString(),
      grace_minutes: 15,
      venue_name: "Thakur College Main Auditorium",
      venue_lat: 19.2312,
      venue_lng: 72.8567,
      radius_m: 100,
      require_code: true,
      created_by: devHead.id,
    },
  ];

  for (const s of sampleSessions) {
    const { data: existing, error: selErr } = await supabase.from("attendance_sessions").select("id").eq("title", s.title).maybeSingle();
    if (selErr) {
      console.error(`  ❌ Failed to query session '${s.title}': ${selErr.message}`);
      hasErrors = true;
      failedCount++;
    } else if (existing) {
      console.log(`  ℹ️  [EXISTS] Session: ${s.title}`);
      existsCount++;
    } else {
      const { error } = await supabase.from("attendance_sessions").insert(s);
      if (error) {
        console.error(`  ❌ Session insert error '${s.title}': ${error.message}`);
        hasErrors = true;
        failedCount++;
      } else {
        console.log(`  ✅ [CREATED] Session: ${s.title}`);
        createdCount++;
      }
    }
  }

  // 3. Seed Weekly Review Report
  console.log("\n📊 Seeding Weekly Review Report...");
  const sampleReport = {
    department: "development",
    week_start: new Date().toISOString().split("T")[0],
    assigned: 5,
    completed: 4,
    pending: 1,
    delayed: 0,
    attendance_rate: 95.0,
    status_rag: "green",
    problems: "[TEST] High API rate limit during testing, resolved with caching.",
    next_tasks: "[TEST] Complete end-to-end load testing.",
    author_id: devHead.id,
  };

  const { data: existingReport, error: selRepErr } = await supabase
    .from("weekly_reports")
    .select("id")
    .eq("department", sampleReport.department)
    .eq("week_start", sampleReport.week_start)
    .maybeSingle();

  if (selRepErr) {
    console.error(`  ❌ Failed to query weekly report: ${selRepErr.message}`);
    hasErrors = true;
    failedCount++;
  } else if (existingReport) {
    console.log(`  ℹ️  [EXISTS] Weekly Report for ${sampleReport.department} (${sampleReport.week_start})`);
    existsCount++;
  } else {
    const { error } = await supabase.from("weekly_reports").insert(sampleReport);
    if (error) {
      console.error(`  ❌ Weekly Report insert error: ${error.message}`);
      hasErrors = true;
      failedCount++;
    } else {
      console.log(`  ✅ [CREATED] Weekly Report for ${sampleReport.department}`);
      createdCount++;
    }
  }

  // 4. Seed Level Up Lecture
  console.log("\n🎓 Seeding Level Up Lecture...");
  const sampleLecture = {
    topic: "[TEST] Masterclass: Web3 Security & Auditing",
    speaker: "Dr. Vikram Sharma",
    starts_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    venue: "Lab 402 - DevClub Innovation Hub",
    stage: "preparation",
    checklist: [
      { id: "c1", label: "Finalize presentation slide deck", done: true },
      { id: "c2", label: "Confirm room projector and sound check", done: false },
      { id: "c3", label: "Publish feedback Google form", done: false },
    ],
    feedback_url: "https://forms.gle/sample-levelup-feedback",
    notes: "Requires high-speed Wi-Fi and HDMI adapter.",
    created_by: devHead.id,
  };

  const { data: existingLecture, error: selLecErr } = await supabase
    .from("lectures")
    .select("id")
    .eq("topic", sampleLecture.topic)
    .maybeSingle();

  if (selLecErr) {
    console.error(`  ❌ Failed to query lecture '${sampleLecture.topic}': ${selLecErr.message}`);
    hasErrors = true;
    failedCount++;
  } else if (existingLecture) {
    console.log(`  ℹ️  [EXISTS] Lecture: ${sampleLecture.topic}`);
    existsCount++;
  } else {
    const { error } = await supabase.from("lectures").insert(sampleLecture);
    if (error) {
      console.error(`  ❌ Lecture insert error '${sampleLecture.topic}': ${error.message}`);
      hasErrors = true;
      failedCount++;
    } else {
      console.log(`  ✅ [CREATED] Lecture: ${sampleLecture.topic}`);
      createdCount++;
    }
  }

  // 5. Seed Issues
  console.log("\n⚠️ Seeding Sample Escalation Issue...");
  const sampleIssue = {
    title: "[TEST] Wi-Fi Bandwidth Drop in Innovation Lab 404",
    description: "Network latency spikes above 400ms during peak work sessions.",
    severity: "high",
    department: "admin",
    raised_by: adminLead.id,
    current_level: "team_lead",
    status: "open",
  };

  const { data: existingIssue, error: selIssErr } = await supabase
    .from("issues")
    .select("id")
    .eq("title", sampleIssue.title)
    .maybeSingle();

  if (selIssErr) {
    console.error(`  ❌ Failed to query issue '${sampleIssue.title}': ${selIssErr.message}`);
    hasErrors = true;
    failedCount++;
  } else if (existingIssue) {
    console.log(`  ℹ️  [EXISTS] Issue: ${sampleIssue.title}`);
    existsCount++;
  } else {
    const { error } = await supabase.from("issues").insert(sampleIssue);
    if (error) {
      console.error(`  ❌ Issue insert error '${sampleIssue.title}': ${error.message}`);
      hasErrors = true;
      failedCount++;
    } else {
      console.log(`  ✅ [CREATED] Issue: ${sampleIssue.title}`);
      createdCount++;
    }
  }

  // 6. Seed HackCrypt Problem Statements & Teams
  console.log("\n🚀 Seeding HackCrypt Problem Statements & Teams...");
  const samplePS = {
    title: "[TEST] Autonomous AI Vulnerability Scanner for Smart Contracts",
    source: "Web3 & Cyber Security Track",
    status: "finalised",
    document_url: "https://hackcrypt.devclubtrcac.in/specs/ps-01.pdf",
    notes: "Requires automated AST parsing demo.",
    created_by: devHead.id,
  };

  let psId = null;
  const { data: existingPS, error: selPSErr } = await supabase
    .from("problem_statements")
    .select("id")
    .eq("title", samplePS.title)
    .maybeSingle();

  if (selPSErr) {
    console.error(`  ❌ Failed to query problem statement '${samplePS.title}': ${selPSErr.message}`);
    hasErrors = true;
    failedCount++;
  } else if (existingPS) {
    psId = existingPS.id;
    console.log(`  ℹ️  [EXISTS] Problem Statement: ${samplePS.title}`);
    existsCount++;
  } else {
    const { data: createdPS, error } = await supabase.from("problem_statements").insert(samplePS).select("id").single();
    if (error) {
      console.error(`  ❌ Problem Statement insert error '${samplePS.title}': ${error.message}`);
      hasErrors = true;
      failedCount++;
    } else {
      psId = createdPS.id;
      console.log(`  ✅ [CREATED] Problem Statement: ${samplePS.title}`);
      createdCount++;
    }
  }

  if (psId) {
    const sampleTeam = {
      name: "[TEST] Team CyberKnights",
      college: "Thakur College of Engineering & Technology",
      members: [
        { name: "Aarav Sharma (Lead)", role: "Smart Contract Dev" },
        { name: "Priya Patel", role: "Frontend Lead" },
        { name: "Rohan Verma", role: "Security Auditor" },
      ],
      status: "confirmed",
      problem_statement_id: psId,
      notes: "Emergency contact: +91 98765 43210",
    };

    const { data: existingTeam, error: selTeamErr } = await supabase
      .from("teams")
      .select("id")
      .eq("name", sampleTeam.name)
      .maybeSingle();

    if (selTeamErr) {
      console.error(`  ❌ Failed to query team '${sampleTeam.name}': ${selTeamErr.message}`);
      hasErrors = true;
      failedCount++;
    } else if (existingTeam) {
      console.log(`  ℹ️  [EXISTS] Team: ${sampleTeam.name}`);
      existsCount++;
    } else {
      const { error } = await supabase.from("teams").insert(sampleTeam);
      if (error) {
        console.error(`  ❌ Team insert error '${sampleTeam.name}': ${error.message}`);
        hasErrors = true;
        failedCount++;
      } else {
        console.log(`  ✅ [CREATED] Team: ${sampleTeam.name}`);
        createdCount++;
      }
    }
  }

  console.log("\n=============================================================");
  console.log(` SEEDING SUMMARY: Created: ${createdCount} | Exists: ${existsCount} | Failed: ${failedCount}`);
  console.log("=============================================================\n");

  if (hasErrors) {
    console.error("❌ Seeding completed with errors. One or more tables/records failed to seed.");
    process.exit(1);
  }
}

seedTestData().catch((err) => {
  console.error("Fatal error during test data seeding:", err);
  process.exit(1);
});
