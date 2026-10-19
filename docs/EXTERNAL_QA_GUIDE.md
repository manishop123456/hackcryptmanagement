# DevClub Management & Accountability System
## External QA Testing Guide — Staging Preview Release

**Document Version:** 1.0.0  
**Target Environment:** Vercel Staging Preview (`https://<staging-preview-url>.vercel.app`)  
**Target Audience:** DevClub TRCAC Members, Team Leads, Heads, and Faculty QA Testers  
**Protected Primary Owner:** `manish.choudhary@devclubtrcac.in` (Strictly excluded from test logins)

---

### 1. Crucial Security Notice & Environment Distinction

> [!IMPORTANT]
> **STAGING ENVIRONMENT VS PRODUCTION APPLICATION**
> - You are accessing a **Staging Preview Environment** designed specifically for QA testing, device verification, and feedback.
> - **DO NOT** use your personal Google accounts, real passwords, or sensitive personal data.
> - **DO NOT** attempt to sign in with `@devclubtrcac.in` production credentials on this staging environment.
> - Use **ONLY** your assigned `@devclub.test` QA account from the roster below.
> - The staging application communicates with an isolated test database. All tasks, attendance records, and logs generated during this testing phase are synthetic test data.

---

### 2. How to Access the Staging Application

1. **Obtain the Staging URL**: The staging link will be shared by the Management/Development Head via our internal club Discord/WhatsApp announcement channel. It will look like:
   ```
   https://hackcryptmanagement-<hash>-devclub.vercel.app
   ```
   *(Ensure the URL begins with `https://`. HTTPS is mandatory for browser geolocation to function on mobile phones).*
2. **Accessing from Desktop or Laptop**: Open the link in Google Chrome, Brave, Firefox, or Safari.
3. **Accessing from Mobile (Android / iOS)**:
   - Open the link in Chrome (Android) or Safari (iOS).
   - **Optional PWA Installation**: You can tap the browser menu (⋮ on Chrome or Share button on Safari) and select **"Add to Home Screen"** or **"Install App"** to experience the app in full-screen standalone mode.

---

### 3. QA Account Roster & Login Instructions

All testers are assigned one of the 17 standardized QA accounts.

#### How to Sign In:
1. Navigate to `/login` on the staging URL.
2. Enter your assigned **Login Email** from the table below.
3. Enter the common **Staging QA Password** (distributed securely via internal club channels; never posted publicly).
4. Click **Sign In**.
5. Confirm that the top navigation bar displays your account display name (e.g., `"PR Team Lead — QA Account"`).

#### Role Assignment Matrix:

| Role | QA Display Name | Login Email | Assigned Department | Focus Modules to Test |
| :--- | :--- | :--- | :---: | :--- |
| **Faculty** | Faculty — QA Account | `test.faculty@devclub.test` | *None* | Read-only inspection of `/reports`, `/admin/audit`, `/daily-reports/digest`. Verify write operations are locked out. |
| **President** | President — QA Account | `test.president@devclub.test` | *None* | Executive dashboard `/`, urgent deadline radar `/radar`, task oversight, review approvals, reports. |
| **Vice President** | Vice President — QA Account | `test.vp@devclub.test` | *None* | Operations oversight `/radar`, contribution scores `/contribution`, weekly reports. |
| **Development Head** | Development Head — QA Account | `test.development_head@devclub.test` | `development` | User admin `/admin/users`, Level Up lectures `/levelup`, HackCrypt module `/hackcrypt`, dev tasks. |
| **Development Co-head** | Development Co-head — QA Account | `test.cohead.dev@devclub.test` | `development` | Development task assignment, reviewing dev daily reports `/daily-reports/digest`, attendance. |
| **Management Head** | Management Head — QA Account | `test.management_head@devclub.test` | `management` | User admin `/admin/users`, social media approvals `/social-media`, operations radar `/radar`. |
| **Management Co-head** | Management Co-head — QA Account | `test.cohead.mgmt@devclub.test` | `management` | Management tasks, reviewing non-technical daily reports, approving social media post drafts. |
| **Hackathon Head** | Hackathon Head — QA Account | `test.hackathon_head@devclub.test` | `hackathon` | HackCrypt module `/hackcrypt`, opening event attendance sessions `/attendance/new`, event tasks. |
| **Admin Lead** | Admin Team Lead — QA Account | `test.lead.admin@devclub.test` | `admin` | Organization-wide attendance viewing `/attendance`, admin tasks, attendance session creation. |
| **PR Lead** | PR Team Lead — QA Account | `test.lead.pr@devclub.test` | `pr` | PR tasks, PR member daily report reviews, PR attendance sessions. |
| **Social Media Lead** | Social Media Team Lead — QA Account | `test.lead.social_media@devclub.test` | `social_media` | Social Media Control Room `/social-media`, drafting & approving posts, validating live URL requirement. |
| **Creatives Lead** | Creatives Team Lead — QA Account | `test.lead.creatives@devclub.test` | `creatives` | Creatives task assignment, reviewing design assets for social media posts. |
| **Creatives Co-head** | Creatives Co-head — QA Account | `test.cohead.creatives@devclub.test` | `creatives` | Reviewing creatives daily reports, managing design tasks. |
| **Dev Member** | Development Member — QA Account | `test.member.dev@devclub.test` | `development` | Daily work log submission `/daily-reports/new`, task comments, mobile attendance check-in. |
| **Mgmt Member** | Management Member — QA Account | `test.member.mgmt@devclub.test` | `management` | Daily work log submission `/daily-reports/new`, viewing personal contribution, attendance check-in. |
| **Hackathon Member** | Hackathon Member — QA Account | `test.member.hackathon@devclub.test` | `hackathon` | Working on hackathon deliverables, submitting daily work logs, checking in to sessions. |
| **Creatives Member** | Creatives Member — QA Account | `test.member.creatives@devclub.test` | `creatives` | Submitting design work logs `/daily-reports/new`, task status updates, attendance check-in. |

---

### 4. How to Test Location-Verified Attendance on a Mobile Phone

The location check-in flow uses the device's native GPS hardware and the server-side Haversine formula to verify physical presence.

#### Mobile Check-in Procedure:
1. **Enable Location**: On your phone, turn on GPS / Location Services.
2. **Open Session**: Sign in on your phone and navigate to `/attendance`.
3. **Select Active Session**: Click on the active attendance session scheduled for testing.
4. **Browser Permission Prompt**:
   - When you tap **"Check In"**, your browser will display: *"hackcryptmanagement... wants to know your location"*.
   - Tap **"Allow"** or **"While using the app"**.
5. **Enter Passcode**: Enter the active 6-digit dynamic passcode displayed on the lead's presenter screen (the code rotates every 30 seconds).
6. **Submit**: Tap **Submit Check-in**.
7. **Verify Feedback**:
   - **Inside Venue**: Status displays green `Verified` with calculated distance in meters.
   - **Outside Venue (>100m)**: Status displays amber `Flagged` (`outside_area`) with the measured distance from the venue.
   - **Permission Denied**: Clear error message explaining that location is mandatory for self check-in.

> [!NOTE]
> Location coordinates are queried only once at the exact instant the submit button is pressed. The application never tracks members in the background.

---

### 5. Role Boundary Verification (Security Testing)

Each tester should actively verify that unauthorized screens are properly locked:
1. **Non-Managers accessing `/admin/users`**:
   - If you are signed in as President, VP, Lead, or Member, navigate directly to `/admin/users`.
   - **Expected Result**: Displays the `<NoAccess />` screen: *"Only the Management Head and the Development Head can add or edit users and roles."*
2. **Regular Members accessing `/daily-reports/digest`**:
   - Sign in as a Member and navigate directly to `/daily-reports/digest`.
   - **Expected Result**: Automatically redirected back to `/daily-reports`.
3. **Regular Members creating attendance sessions**:
   - Sign in as a Member and navigate to `/attendance/new`.
   - **Expected Result**: Automatically redirected to `/attendance`.

---

### 6. How to Report Bugs & Issues

If you encounter an unexpected error, visual glitch, or broken flow:

1. **In-App Issue Submission**:
   - Navigate to `/issues/new` directly in the staging app.
   - Select your department, issue type (Bug, UI Glitch, Permission Error, or Data Issue), and priority.
   - Provide a concise description.
2. **What to Include**:
   - **Account Used**: (e.g. `test.lead.creatives@devclub.test`)
   - **Device & Browser**: (e.g. Samsung Galaxy S23 / Chrome 124, or iPhone 15 / Safari iOS 17)
   - **URL/Screen**: (e.g. `/attendance/session-id-123`)
   - **Exact Steps to Reproduce**:
     1. Clicked on...
     2. Entered...
     3. Observed error...
   - **Screenshot or Screen Recording**: Capture the error banner or broken layout.
3. **Never Include Sensitive Credentials**: Do not post passwords or session cookies in issue descriptions.

---

### 7. Sign Out & Session Hygiene

- When you finish testing a role, tap your name in the top right menu and select **Sign Out**.
- Do not remain logged into multiple accounts across different browser tabs simultaneously; use an Incognito / Private window if switching between accounts rapidly.
- Never share staging login passwords outside the authorized DevClub QA team.
