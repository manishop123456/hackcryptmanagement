import { test, expect, type Page, type TestInfo } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * Sanitize sensitive values (tokens, passwords, keys) from logged messages.
 */
function sanitize(input: string): string {
  if (!input) return "";
  return input
    .replace(/bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [REDACTED]")
    .replace(/(password|token|secret|key|anon_key|service_role)=[^&\s]+/gi, "$1=[REDACTED]")
    .replace(/apikey:\s*["']?[A-Za-z0-9\-._~+/]+["']?/gi, "apikey: [REDACTED]");
}

/**
 * Helper to inspect the page for Next.js error overlays or fatal application crash text.
 */
async function detectFatalOverlayOrCrash(page: Page): Promise<string | null> {
  // Check for Next.js error overlay dialog / toast
  const overlayLocator = page.locator("nextjs-portal, [data-nextjs-dialog-overlay], #nextjs__container_errors__");
  const count = await overlayLocator.count();
  if (count > 0) {
    const isVisible = await overlayLocator.first().isVisible().catch(() => false);
    if (isVisible) {
      const text = await overlayLocator.first().innerText().catch(() => "");
      return `Next.js runtime error overlay detected: ${sanitize(text.slice(0, 300))}`;
    }
  }

  // Check for fatal error message text in DOM
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

/**
 * Error collection state per page session.
 */
interface DiagnosticCollector {
  pageErrors: Array<{ message: string; stack?: string }>;
  consoleErrors: Array<{ type: string; text: string; location?: string }>;
  failedRequests: Array<{ url: string; method: string; failureText: string }>;
  serverErrors: Array<{ url: string; status: number; statusText: string }>;
  attachToReport: (name?: string) => Promise<void>;
}

function setupDiagnosticCollector(page: Page, testInfo: TestInfo): DiagnosticCollector {
  const pageErrors: Array<{ message: string; stack?: string }> = [];
  const consoleErrors: Array<{ type: string; text: string; location?: string }> = [];
  const failedRequests: Array<{ url: string; method: string; failureText: string }> = [];
  const serverErrors: Array<{ url: string; status: number; statusText: string }> = [];

  page.on("pageerror", (err) => {
    pageErrors.push({
      message: sanitize(err.message),
      stack: sanitize(err.stack || ""),
    });
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push({
        type: msg.type(),
        text: sanitize(msg.text()),
        location: msg.location() ? `${msg.location().url}:${msg.location().lineNumber}` : undefined,
      });
    }
  });

  page.on("requestfailed", (req) => {
    const failure = req.failure();
    const failureText = failure?.errorText || "unknown error";
    // Filter normal aborted navigations/prefetches
    if (failureText.includes("ERR_ABORTED")) {
      return;
    }
    failedRequests.push({
      url: sanitize(req.url()),
      method: req.method(),
      failureText: sanitize(failureText),
    });
  });

  page.on("response", (res) => {
    if (res.status() >= 500) {
      serverErrors.push({
        url: sanitize(res.url()),
        status: res.status(),
        statusText: res.statusText(),
      });
    }
  });

  const attachToReport = async (name = "browser-diagnostics.json") => {
    const diagnostics = {
      testTitle: testInfo.title,
      url: sanitize(page.url()),
      timestamp: new Date().toISOString(),
      pageErrors,
      consoleErrors,
      failedRequests,
      serverErrors,
    };
    await testInfo.attach(name, {
      body: JSON.stringify(diagnostics, null, 2),
      contentType: "application/json",
    });
  };

  return {
    pageErrors,
    consoleErrors,
    failedRequests,
    serverErrors,
    attachToReport,
  };
}

test.describe("Smoke Tests", () => {
  test("TEST 1 — Login page loads", async ({ page }, testInfo) => {
    const collector = setupDiagnosticCollector(page, testInfo);

    // Navigate to /login
    const response = await page.goto("/login", { waitUntil: "domcontentloaded" });
    expect(response, "Expected a valid response from /login").not.toBeNull();
    expect(response!.status(), "Expected HTTP 200 on /login").toBe(200);

    // Verify navigation completed to /login
    await expect(page).toHaveURL(/\/login/);

    // Confirm that the page contains the actual login form
    const loginForm = page.locator("form");
    await expect(loginForm, "Expected login form to be visible").toBeVisible();

    const emailInput = page.locator("#login-email");
    await expect(emailInput, "Expected email input #login-email to be visible").toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");

    const passwordInput = page.locator("#login-password");
    await expect(passwordInput, "Expected password input #login-password to be visible").toBeVisible();

    const submitButton = page.locator("button[type='submit']");
    await expect(submitButton, "Expected submit button to be visible").toBeVisible();
    await expect(submitButton).toContainText(/Sign In/i);

    // Verify that the page does not display a Next.js runtime error overlay
    const fatalError = await detectFatalOverlayOrCrash(page);
    expect(fatalError, "Fatal error or Next.js overlay found on /login").toBeNull();

    // Attach diagnostics
    await collector.attachToReport();

    // Fail if an uncaught page error occurred
    expect(collector.pageErrors, "Uncaught page errors occurred on /login").toHaveLength(0);
  });

  test("TEST 2 — Main routes do not crash", async ({ page }, testInfo) => {
    const collector = setupDiagnosticCollector(page, testInfo);

    const routesToCheck = [
      { route: "/daily-reports", filePath: "src/app/(app)/daily-reports/page.tsx" },
      { route: "/daily-reports/new", filePath: "src/app/(app)/daily-reports/new/page.tsx" },
      { route: "/daily-reports/digest", filePath: "src/app/(app)/daily-reports/digest/page.tsx" },
      { route: "/social-media", filePath: "src/app/(app)/social-media/page.tsx" },
      { route: "/radar", filePath: "src/app/(app)/radar/page.tsx" },
      { route: "/tasks", filePath: "src/app/(app)/tasks/page.tsx" },
      { route: "/attendance", filePath: "src/app/(app)/attendance/page.tsx" },
      { route: "/attendance/new", filePath: "src/app/(app)/attendance/new/page.tsx" },
      { route: "/admin/users", filePath: "src/app/(app)/admin/users/page.tsx" },
    ];

    interface RouteCheckRecord {
      route: string;
      existsInApp: boolean;
      initialStatus: number | null;
      finalUrl: string;
      passed: boolean;
      failureDetails?: string;
    }

    const routeRecords: RouteCheckRecord[] = [];
    const confirmedFailures: Array<{ route: string; reason: string }> = [];

    for (const item of routesToCheck) {
      await test.step(`Check route: ${item.route}`, async () => {
        const fullPath = path.resolve(process.cwd(), item.filePath);
        const existsOnDisk = fs.existsSync(fullPath);

        if (!existsOnDisk) {
          routeRecords.push({
            route: item.route,
            existsInApp: false,
            initialStatus: null,
            finalUrl: "",
            passed: true,
            failureDetails: "Marked as not applicable: route file does not exist on disk",
          });
          return;
        }

        const prePageErrorsCount = collector.pageErrors.length;
        const preServerErrorsCount = collector.serverErrors.length;

        try {
          // Direct navigation to route
          const response = await page.goto(item.route, { waitUntil: "domcontentloaded" });
          const status = response ? response.status() : null;
          const currentUrl = page.url();

          // Fail on HTTP 500 responses
          if (status !== null && status >= 500) {
            const failMsg = `HTTP ${status} server error when navigating to ${item.route}`;
            confirmedFailures.push({ route: item.route, reason: failMsg });
            routeRecords.push({
              route: item.route,
              existsInApp: true,
              initialStatus: status,
              finalUrl: currentUrl,
              passed: false,
              failureDetails: failMsg,
            });
            return;
          }

          // Check for Next.js runtime crashes or error overlays
          const fatalOverlay = await detectFatalOverlayOrCrash(page);
          if (fatalOverlay) {
            confirmedFailures.push({ route: item.route, reason: fatalOverlay });
            routeRecords.push({
              route: item.route,
              existsInApp: true,
              initialStatus: status,
              finalUrl: currentUrl,
              passed: false,
              failureDetails: fatalOverlay,
            });
            return;
          }

          // Check for new uncaught page errors
          if (collector.pageErrors.length > prePageErrorsCount) {
            const newError = collector.pageErrors[collector.pageErrors.length - 1];
            const failMsg = `Uncaught page error: ${newError.message}`;
            confirmedFailures.push({ route: item.route, reason: failMsg });
            routeRecords.push({
              route: item.route,
              existsInApp: true,
              initialStatus: status,
              finalUrl: currentUrl,
              passed: false,
              failureDetails: failMsg,
            });
            return;
          }

          // Check for new HTTP 500 responses
          if (collector.serverErrors.length > preServerErrorsCount) {
            const newServerError = collector.serverErrors[collector.serverErrors.length - 1];
            const failMsg = `HTTP 500 response observed: ${newServerError.url} (${newServerError.status})`;
            confirmedFailures.push({ route: item.route, reason: failMsg });
            routeRecords.push({
              route: item.route,
              existsInApp: true,
              initialStatus: status,
              finalUrl: currentUrl,
              passed: false,
              failureDetails: failMsg,
            });
            return;
          }

          // Passed - redirect to /login or /pending or rendering is allowed behavior
          routeRecords.push({
            route: item.route,
            existsInApp: true,
            initialStatus: status,
            finalUrl: currentUrl,
            passed: true,
          });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          const failMsg = `Navigation error on ${item.route}: ${errMsg}`;
          confirmedFailures.push({ route: item.route, reason: failMsg });
          routeRecords.push({
            route: item.route,
            existsInApp: true,
            initialStatus: null,
            finalUrl: page.url(),
            passed: false,
            failureDetails: failMsg,
          });
        }
      });
    }

    // Attach route check results to report
    await testInfo.attach("route-audit-results.json", {
      body: JSON.stringify(routeRecords, null, 2),
      contentType: "application/json",
    });

    await collector.attachToReport();

    // Fail test if any route experienced a crash or HTTP 500
    expect(
      confirmedFailures,
      `Route crash failures detected:\n${confirmedFailures.map((f) => `- ${f.route}: ${f.reason}`).join("\n")}`,
    ).toHaveLength(0);
  });

  test("TEST 3 — Browser error collection", async ({ page }, testInfo) => {
    const collector = setupDiagnosticCollector(page, testInfo);

    // Exercise key routes to capture browser runtime behavior
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.locator("form")).toBeVisible();

    // Navigate to a protected route to verify normal redirect behavior
    await page.goto("/tasks", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/);

    // Check for fatal errors
    const fatal = await detectFatalOverlayOrCrash(page);

    // Compile comprehensive diagnostics report
    const diagnosticsSummary = {
      timestamp: new Date().toISOString(),
      url: sanitize(page.url()),
      uncaughtPageErrorsCount: collector.pageErrors.length,
      pageErrors: collector.pageErrors,
      consoleErrorsCount: collector.consoleErrors.length,
      consoleErrors: collector.consoleErrors,
      failedNetworkRequestsCount: collector.failedRequests.length,
      failedRequests: collector.failedRequests,
      server500ErrorsCount: collector.serverErrors.length,
      server500Errors: collector.serverErrors,
      fatalErrorDetected: fatal,
    };

    await testInfo.attach("diagnostics-summary.json", {
      body: JSON.stringify(diagnosticsSummary, null, 2),
      contentType: "application/json",
    });

    // Assert that no uncaught exceptions, fatal overlays, or HTTP 500s occurred
    expect(collector.pageErrors, "Uncaught page errors were detected").toHaveLength(0);
    expect(collector.serverErrors, "HTTP 500 server errors were detected").toHaveLength(0);
    expect(fatal, "Fatal Next.js overlay or error text was detected").toBeNull();
  });
});
