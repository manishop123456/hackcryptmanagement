import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * DevClub QA — Role-by-Role Authenticated Browser Test Suite
 *
 * Covers all 17 QA accounts from docs/ROLE_BY_ROLE_TESTING_GUIDE.md.
 * For each account:
 *  1. Checks if credentials are provided (E2E_TEST_PASSWORD or account-specific env var)
 *  2. Opens /login and submits credentials
 *  3. Verifies successful authentication and account identity in UI
 *  4. Verifies session persistence on reload
 *  5. Verifies authorized role-based routes load cleanly without NoAccess or fatal errors
 *  6. Verifies restricted routes are correctly blocked (redirected or NoAccess UI)
 *  7. Signs out and verifies protected route access is denied
 *  8. Captures console errors, network failures, and 500 errors
 */

// Helper to load .env.local into process.env if present
function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), ".env.local");
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

function sanitize(input: string): string {
  if (!input) return "";
  return input
    .replace(/bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [REDACTED]")
    .replace(/(password|token|secret|key|anon_key|service_role)=[^&\s]+/gi, "$1=[REDACTED]")
    .replace(/apikey:\s*["']?[A-Za-z0-9\-._~+/]+["']?/gi, "apikey: [REDACTED]");
}

async function detectFatalOverlayOrCrash(page: Page): Promise<string | null> {
  const overlayLocator = page.locator("nextjs-portal, [data-nextjs-dialog-overlay], #nextjs__container_errors__");
  if ((await overlayLocator.count()) > 0) {
    const isVisible = await overlayLocator.first().isVisible().catch(() => false);
    if (isVisible) {
      const text = await overlayLocator.first().innerText().catch(() => "");
      return `Next.js runtime error overlay detected: ${sanitize(text.slice(0, 300))}`;
    }
  }

  const bodyText = await page.locator("body").innerText().catch(() => "");
  if (bodyText.includes("Application error: a client-side exception has occurred")) {
    return "Application error: a client-side exception has occurred";
  }
  if (bodyText.includes("Unhandled Runtime Error")) {
    return "Unhandled Runtime Error displayed on page";
  }
  if (bodyText.includes("500: Internal Server Error")) {
    return "500: Internal Server Error displayed on page";
  }

  return null;
}

export interface QAAccountConfig {
  email: string;
  role: string;
  fullName: string;
  department: string | null;
  authorizedRoutes: string[];
  restrictedRoutes: Array<{
    route: string;
    expectedType: "no_access" | "redirect";
    redirectTo?: string;
  }>;
}

export const QA_ACCOUNTS: QAAccountConfig[] = [
  {
    email: "test.faculty@devclub.test",
    role: "faculty",
    fullName: "Faculty — QA Account",
    department: null,
    authorizedRoutes: ["/daily-reports", "/daily-reports/digest", "/tasks", "/attendance", "/reports", "/admin/audit"],
    restrictedRoutes: [
      { route: "/admin/users", expectedType: "no_access" },
      { route: "/attendance/new", expectedType: "redirect", redirectTo: "/attendance" },
    ],
  },
  {
    email: "test.president@devclub.test",
    role: "president",
    fullName: "President — QA Account",
    department: null,
    authorizedRoutes: ["/daily-reports", "/daily-reports/digest", "/social-media", "/radar", "/tasks", "/attendance", "/attendance/new", "/admin/audit", "/reports"],
    restrictedRoutes: [
      { route: "/admin/users", expectedType: "no_access" },
    ],
  },
  {
    email: "test.vp@devclub.test",
    role: "vice_president",
    fullName: "Vice President — QA Account",
    department: null,
    authorizedRoutes: ["/daily-reports", "/daily-reports/digest", "/social-media", "/radar", "/tasks", "/attendance", "/attendance/new", "/admin/audit", "/reports"],
    restrictedRoutes: [
      { route: "/admin/users", expectedType: "no_access" },
    ],
  },
  {
    email: "test.development_head@devclub.test",
    role: "development_head",
    fullName: "Development Head — QA Account",
    department: "development",
    authorizedRoutes: ["/admin/users", "/daily-reports", "/daily-reports/digest", "/radar", "/tasks", "/attendance", "/attendance/new", "/admin/audit", "/reports"],
    restrictedRoutes: [],
  },
  {
    email: "test.cohead.dev@devclub.test",
    role: "development_co_head",
    fullName: "Development Co-head — QA Account",
    department: "development",
    authorizedRoutes: ["/daily-reports", "/daily-reports/digest", "/tasks", "/attendance", "/radar"],
    restrictedRoutes: [
      { route: "/admin/users", expectedType: "no_access" },
      { route: "/attendance/new", expectedType: "redirect", redirectTo: "/attendance" },
    ],
  },
  {
    email: "test.management_head@devclub.test",
    role: "management_head",
    fullName: "Management Head — QA Account",
    department: "management",
    authorizedRoutes: ["/admin/users", "/daily-reports", "/daily-reports/digest", "/social-media", "/radar", "/tasks", "/attendance", "/attendance/new", "/admin/audit", "/reports"],
    restrictedRoutes: [],
  },
  {
    email: "test.cohead.mgmt@devclub.test",
    role: "management_co_head",
    fullName: "Management Co-head — QA Account",
    department: "management",
    authorizedRoutes: ["/daily-reports", "/daily-reports/digest", "/social-media", "/radar", "/tasks", "/attendance"],
    restrictedRoutes: [
      { route: "/admin/users", expectedType: "no_access" },
      { route: "/attendance/new", expectedType: "redirect", redirectTo: "/attendance" },
    ],
  },
  {
    email: "test.hackathon_head@devclub.test",
    role: "hackathon_head",
    fullName: "Hackathon Head — QA Account",
    department: "hackathon",
    authorizedRoutes: ["/daily-reports", "/daily-reports/digest", "/tasks", "/attendance", "/attendance/new"],
    restrictedRoutes: [
      { route: "/admin/users", expectedType: "no_access" },
    ],
  },
  {
    email: "test.lead.admin@devclub.test",
    role: "team_lead",
    fullName: "Admin Team Lead — QA Account",
    department: "admin",
    authorizedRoutes: ["/daily-reports", "/daily-reports/digest", "/tasks", "/attendance", "/attendance/new"],
    restrictedRoutes: [
      { route: "/admin/users", expectedType: "no_access" },
    ],
  },
  {
    email: "test.lead.pr@devclub.test",
    role: "team_lead",
    fullName: "PR Team Lead — QA Account",
    department: "pr",
    authorizedRoutes: ["/daily-reports", "/daily-reports/digest", "/tasks", "/attendance", "/attendance/new"],
    restrictedRoutes: [
      { route: "/admin/users", expectedType: "no_access" },
    ],
  },
  {
    email: "test.lead.social_media@devclub.test",
    role: "team_lead",
    fullName: "Social Media Team Lead — QA Account",
    department: "social_media",
    authorizedRoutes: ["/daily-reports", "/daily-reports/digest", "/social-media", "/tasks", "/attendance", "/attendance/new"],
    restrictedRoutes: [
      { route: "/admin/users", expectedType: "no_access" },
    ],
  },
  {
    email: "test.lead.creatives@devclub.test",
    role: "team_lead",
    fullName: "Creatives Team Lead — QA Account",
    department: "creatives",
    authorizedRoutes: ["/daily-reports", "/daily-reports/digest", "/social-media", "/tasks", "/attendance", "/attendance/new"],
    restrictedRoutes: [
      { route: "/admin/users", expectedType: "no_access" },
    ],
  },
  {
    email: "test.cohead.creatives@devclub.test",
    role: "co_head",
    fullName: "Creatives Co-head — QA Account",
    department: "creatives",
    authorizedRoutes: ["/daily-reports", "/daily-reports/digest", "/tasks", "/attendance"],
    restrictedRoutes: [
      { route: "/admin/users", expectedType: "no_access" },
      { route: "/attendance/new", expectedType: "redirect", redirectTo: "/attendance" },
    ],
  },
  {
    email: "test.member.dev@devclub.test",
    role: "member",
    fullName: "Development Member — QA Account",
    department: "development",
    authorizedRoutes: ["/daily-reports", "/daily-reports/new", "/tasks", "/attendance"],
    restrictedRoutes: [
      { route: "/admin/users", expectedType: "no_access" },
      { route: "/daily-reports/digest", expectedType: "redirect", redirectTo: "/daily-reports" },
      { route: "/attendance/new", expectedType: "redirect", redirectTo: "/attendance" },
    ],
  },
  {
    email: "test.member.mgmt@devclub.test",
    role: "member",
    fullName: "Management Member — QA Account",
    department: "management",
    authorizedRoutes: ["/daily-reports", "/daily-reports/new", "/tasks", "/attendance"],
    restrictedRoutes: [
      { route: "/admin/users", expectedType: "no_access" },
      { route: "/daily-reports/digest", expectedType: "redirect", redirectTo: "/daily-reports" },
      { route: "/attendance/new", expectedType: "redirect", redirectTo: "/attendance" },
    ],
  },
  {
    email: "test.member.hackathon@devclub.test",
    role: "member",
    fullName: "Hackathon Member — QA Account",
    department: "hackathon",
    authorizedRoutes: ["/daily-reports", "/daily-reports/new", "/tasks", "/attendance"],
    restrictedRoutes: [
      { route: "/admin/users", expectedType: "no_access" },
      { route: "/daily-reports/digest", expectedType: "redirect", redirectTo: "/daily-reports" },
      { route: "/attendance/new", expectedType: "redirect", redirectTo: "/attendance" },
    ],
  },
  {
    email: "test.member.creatives@devclub.test",
    role: "member",
    fullName: "Creatives Member — QA Account",
    department: "creatives",
    authorizedRoutes: ["/daily-reports", "/daily-reports/new", "/tasks", "/attendance"],
    restrictedRoutes: [
      { route: "/admin/users", expectedType: "no_access" },
      { route: "/daily-reports/digest", expectedType: "redirect", redirectTo: "/daily-reports" },
      { route: "/attendance/new", expectedType: "redirect", redirectTo: "/attendance" },
    ],
  },
];

function getAccountPassword(email: string): string | null {
  loadEnvLocal();
  // 1. Account specific: E2E_PASSWORD_<sanitized_email>
  const envKey = "E2E_PASSWORD_" + email.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  if (process.env[envKey]) return process.env[envKey]!;

  // 2. Global shared test password
  if (process.env.E2E_TEST_PASSWORD) return process.env.E2E_TEST_PASSWORD;
  if (process.env.TEST_ACCOUNTS_PASSWORD) return process.env.TEST_ACCOUNTS_PASSWORD;

  return null;
}

test.describe("Authenticated Role-by-Role QA Tests", () => {
  for (const account of QA_ACCOUNTS) {
    test(`QA Role: ${account.role} (${account.email})`, async ({ browser }, testInfo) => {
      // 1. Check for configured credentials
      const password = getAccountPassword(account.email);
      if (!password) {
        test.skip(
          true,
          `Account ${account.email} is NOT CONFIGURED: Credentials missing (set E2E_TEST_PASSWORD or E2E_PASSWORD_${account.email.toUpperCase().replace(/[^A-Z0-9]/g, "_")})`,
        );
        return;
      }

      // 2. Create isolated browser context for this account
      const context = await browser.newContext();
      const page = await context.newPage();

      const pageErrors: Array<{ message: string }> = [];
      const consoleErrors: Array<{ text: string }> = [];
      const serverErrors: Array<{ url: string; status: number }> = [];

      page.on("pageerror", (err) => pageErrors.push({ message: sanitize(err.message) }));
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push({ text: sanitize(msg.text()) });
      });
      page.on("response", (res) => {
        if (res.status() >= 500) {
          serverErrors.push({ url: sanitize(res.url()), status: res.status() });
        }
      });

      try {
        // Step 1: Open /login
        await page.goto("/login", { waitUntil: "domcontentloaded" });
        await expect(page.locator("form")).toBeVisible();

        // Step 2: Enter credentials
        await page.locator("#login-email").fill(account.email);
        await page.locator("#login-password").fill(password);

        // Step 3: Submit login form
        await page.locator("button[type='submit']").click();

        // Step 4 & 5: Wait for actual result & verify authentication succeeded
        await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
        expect(page.url()).not.toContain("/login");

        // Step 6: Verify correct account identity in rendered application
        // The top bar renders the member's full name in the user menu button
        const identityLocator = page.locator(`header text="${account.fullName}"`);
        await expect(identityLocator).toBeVisible({ timeout: 10000 });

        // Step 7: Reload and confirm session remains valid
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(identityLocator).toBeVisible({ timeout: 10000 });

        // Step 8: Verify Authorized Role Routes
        const routeResults: Array<{ route: string; status: "authorized" | "restricted"; passed: boolean; details: string }> = [];

        for (const authRoute of account.authorizedRoutes) {
          await test.step(`Authorized route check: ${authRoute}`, async () => {
            const resp = await page.goto(authRoute, { waitUntil: "domcontentloaded" });
            const status = resp ? resp.status() : 200;

            // Fail on HTTP 500
            expect(status).toBeLessThan(500);

            // Must not redirect back to /login or /pending
            expect(page.url()).not.toContain("/login");
            expect(page.url()).not.toContain("/pending");

            // Must not display NoAccess error state
            const noAccessCount = await page.locator("text=You do not have access to this screen").count();
            expect(noAccessCount, `Unexpected NoAccess on authorized route ${authRoute}`).toBe(0);

            // Must not display fatal crash overlay
            const fatal = await detectFatalOverlayOrCrash(page);
            expect(fatal, `Fatal overlay detected on ${authRoute}`).toBeNull();

            routeResults.push({
              route: authRoute,
              status: "authorized",
              passed: true,
              details: `Authorized access confirmed (HTTP ${status})`,
            });
          });
        }

        // Step 9: Verify Restricted Role Routes
        for (const restRoute of account.restrictedRoutes) {
          await test.step(`Restricted route check: ${restRoute.route}`, async () => {
            const resp = await page.goto(restRoute.route, { waitUntil: "domcontentloaded" });
            const status = resp ? resp.status() : 200;
            expect(status).toBeLessThan(500);

            const fatal = await detectFatalOverlayOrCrash(page);
            expect(fatal, `Fatal overlay detected on restricted route ${restRoute.route}`).toBeNull();

            if (restRoute.expectedType === "redirect") {
              const currentUrl = page.url();
              expect(
                currentUrl.includes(restRoute.redirectTo || ""),
                `Expected redirect to ${restRoute.redirectTo}, but stayed on ${currentUrl}`,
              ).toBe(true);

              routeResults.push({
                route: restRoute.route,
                status: "restricted",
                passed: true,
                details: `Correctly redirected to ${currentUrl}`,
              });
            } else if (restRoute.expectedType === "no_access") {
              const hasNoAccess = await page.locator("text=You do not have access to this screen").count();
              expect(hasNoAccess, `Expected NoAccess screen on ${restRoute.route}`).toBeGreaterThan(0);

              routeResults.push({
                route: restRoute.route,
                status: "restricted",
                passed: true,
                details: "Correctly rendered NoAccess state",
              });
            }
          });
        }

        // Step 10: Sign Out
        await test.step("Sign out flow", async () => {
          // Open user menu dropdown
          await identityLocator.click();
          const signOutBtn = page.locator("text=Sign out");
          await signOutBtn.click();

          // Wait for redirect to /login
          await page.waitForURL(/\/login/, { timeout: 10000 });
          await expect(page.locator("form")).toBeVisible();
        });

        // Step 11: Verify protected access is denied after logout
        await test.step("Verify protected access blocked after logout", async () => {
          await page.goto("/tasks", { waitUntil: "domcontentloaded" });
          await expect(page).toHaveURL(/\/login\?next=%2Ftasks/);
        });

        // Attach telemetry to report
        await testInfo.attach("role-test-results.json", {
          body: JSON.stringify(
            {
              account: account.email,
              role: account.role,
              fullName: account.fullName,
              routeResults,
              pageErrors,
              consoleErrors,
              serverErrors,
            },
            null,
            2,
          ),
          contentType: "application/json",
        });

        // Assert no uncaught errors or 500s occurred
        expect(pageErrors, "Uncaught page errors were detected").toHaveLength(0);
        expect(serverErrors, "HTTP 500 errors were detected").toHaveLength(0);
      } finally {
        await context.close();
      }
    });
  }
});
