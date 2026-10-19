# Official DevClub Email Directory & Identity Specification
**Organization:** DevClub, TRCAC  
**Domain:** `devclubtrcac.in`  
**DNS Provider:** Vercel DNS (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`)  
**Status:** Audit & Proposal Stage (Pre-provisioning)  

---

## 1. Architecture & Security Principles

1. **Individual Authentication & Accountability:**
   - Every human member uses an individual personal email address (`firstname.lastname@devclubtrcac.in`) for Supabase authentication and day-to-day login.
   - Shared mailboxes with shared passwords are **strictly prohibited** for application login to maintain tamper-proof audit logs, task ownership, attendance tracking, and reviewer signatures.
2. **Role-Based Addresses as Distribution Lists / Aliases:**
   - Functional role-based addresses (`president@...`, `admin@...`, etc.) are configured solely in the email provider as **Aliases** or **Distribution Lists** routing to designated individual mailboxes.
   - Role addresses do NOT log directly into the management web application.
3. **Protected Owner Identity:**
   - `manish.choudhary@devclubtrcac.in` is the designated primary owner and Development Head. It is protected against automated modification, deletion, or bulk password resets.
4. **Separation of QA / Automated Testing Accounts:**
   - Automated testing and Playwright E2E suites retain dedicated `@devclub.test` addresses. They are never conflated with `@devclubtrcac.in` identities.

---

## 2. Proposed Role-Based Addresses (Aliases & Distribution Lists)

These addresses are configured in the email provider dashboard (Google Workspace, Zoho Mail, or Microsoft 365) as aliases or distribution groups. They do not hold individual Supabase application logins.

| Role / Team | Proposed Address | Account Type | Target Recipient(s) | Exists on Provider? | App Login? | Migration Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **President** | `president@devclubtrcac.in` | Alias / Group | `soujas.mane@devclubtrcac.in` | ❌ Pending Provider Setup | No (Alias) | Staged Proposal |
| **Vice President** | `vicepresident@devclubtrcac.in` | Alias / Group | `omkar.more@devclubtrcac.in` | ❌ Pending Provider Setup | No (Alias) | Staged Proposal |
| **Development Head** | `development.head@devclubtrcac.in` | Alias / Group | `manish.choudhary@devclubtrcac.in` | ❌ Pending Provider Setup | No (Alias) | Staged Proposal |
| **Development Co-Head** | `development.cohead@devclubtrcac.in` | Alias / Group | Development Co-Head personal mailbox | ❌ Pending Provider Setup | No (Alias) | Staged Proposal |
| **Management Head** | `management.head@devclubtrcac.in` | Alias / Group | `kinjal.more@devclubtrcac.in` | ❌ Pending Provider Setup | No (Alias) | Staged Proposal |
| **Management Co-Head** | `management.cohead@devclubtrcac.in` | Alias / Group | Management Co-Head personal mailbox | ❌ Pending Provider Setup | No (Alias) | Staged Proposal |
| **Hackathon Head** | `hackathon@devclubtrcac.in` | Distribution List | Hackathon Lead & Core Team | ❌ Pending Provider Setup | No (Group) | Staged Proposal |
| **Admin Team** | `admin@devclubtrcac.in` | Distribution List | `kunal.sakhiya@devclubtrcac.in` + Admin team | ❌ Pending Provider Setup | No (Group) | Staged Proposal |
| **PR Team** | `pr@devclubtrcac.in` | Distribution List | `darshan.gohil@devclubtrcac.in` + PR team | ❌ Pending Provider Setup | No (Group) | Staged Proposal |
| **Social Media Team** | `socialmedia@devclubtrcac.in` | Distribution List | `naeva.parmar@devclubtrcac.in` + Social Media team | ❌ Pending Provider Setup | No (Group) | Staged Proposal |
| **Creatives Team** | `creatives@devclubtrcac.in` | Distribution List | `hiya.sonpar@devclubtrcac.in` + Creatives team | ❌ Pending Provider Setup | No (Group) | Staged Proposal |

---

## 3. Individual Member Directory (Personal Mailboxes & App Logins)

Derived directly from the authoritative Plan of Action roster in `docs/SPEC.md` (§3). Every active member receives an individual primary mailbox and authenticates to the DevClub Management System using this identity.

| Intended Person | Club Role | Department | Proposed Official Address | Account Type | Exists in DB? | Provider Mailbox Status | App Login? | Migration / Setup Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Prof. Komal Jambhale** | Faculty Head / DevClub Incharge | None | `komal.jambhale@devclubtrcac.in` | Primary Mailbox | ❌ Missing | ❌ Requires Provisioning | Yes | Pending Provider & Approval |
| **Soujas Mane** | President | None | `soujas.mane@devclubtrcac.in` | Primary Mailbox | ❌ Missing | ❌ Requires Provisioning | Yes | Pending Provider & Approval |
| **Omkar More** | Vice President | None | `omkar.more@devclubtrcac.in` | Primary Mailbox | ❌ Missing | ❌ Requires Provisioning | Yes | Pending Provider & Approval |
| **Manish Choudhary** | Development Head (Primary Owner) | `development` | `manish.choudhary@devclubtrcac.in` | Primary Mailbox | ✅ Active (ID Preserved) | ⚠️ Requires MX Activation | Yes | Active in DB; Awaiting MX setup |
| **Kinjal More** | Management Head | `management` | `kinjal.more@devclubtrcac.in` | Primary Mailbox | ❌ Missing | ❌ Requires Provisioning | Yes | Pending Provider & Approval |
| **Hiya Sonpar** | Team Lead | `creatives` | `hiya.sonpar@devclubtrcac.in` | Primary Mailbox | ❌ Missing | ❌ Requires Provisioning | Yes | Pending Provider & Approval |
| **Kunal Sakhiya** | Team Lead | `admin` | `kunal.sakhiya@devclubtrcac.in` | Primary Mailbox | ❌ Missing | ❌ Requires Provisioning | Yes | Pending Provider & Approval |
| **Naeva Parmar** | Team Lead | `social_media` | `naeva.parmar@devclubtrcac.in` | Primary Mailbox | ❌ Missing | ❌ Requires Provisioning | Yes | Pending Provider & Approval |
| **Darshan Gohil** | Team Lead | `pr` | `darshan.gohil@devclubtrcac.in` | Primary Mailbox | ❌ Missing | ❌ Requires Provisioning | Yes | Pending Provider & Approval |
| **Yash Khanvilkar** | Management Associate (Member) | `management` | `yash.khanvilkar@devclubtrcac.in` | Primary Mailbox | ❌ Missing | ❌ Requires Provisioning | Yes | Pending Provider & Approval |
| **Shubham Dayama** | Management Associate (Member) | `management` | `shubham.dayama@devclubtrcac.in` | Primary Mailbox | ❌ Missing | ❌ Requires Provisioning | Yes | Pending Provider & Approval |

---

## 4. Email Provider Infrastructure Requirements

Public DNS audit for `devclubtrcac.in` conducted on 2026-10-19:
- **Nameservers:** `ns1.vercel-dns.com`, `ns2.vercel-dns.com` (Vercel DNS)
- **MX Records:** **None found.**
- **SPF Records:** **None found.**
- **DKIM Records:** **None found.**

### Provider Selection & Setup Checklist
To activate these email addresses, the domain administrator must select an email provider and add the required DNS records into the Vercel DNS dashboard:

1. **Option A: Google Workspace (Recommended for Google OAuth integration)**
   - Add MX records pointing to Google:
     - `1 ASPMX.L.GOOGLE.COM`
     - `5 ALT1.ASPMX.L.GOOGLE.COM`
     - `5 ALT2.ASPMX.L.GOOGLE.COM`
     - `10 ALT3.ASPMX.L.GOOGLE.COM`
     - `10 ALT4.ASPMX.L.GOOGLE.COM`
   - Add TXT verification string: `google-site-verification=...`
   - Add SPF TXT record: `v=spf1 include:_spf.google.com ~all`
   - Configure DKIM in Google Admin Console and publish the TXT record on Vercel DNS.
2. **Option B: Zoho Mail (Free tier / Cost effective for student clubs)**
   - Add MX records:
     - `10 mx.zoho.in`
     - `20 mx2.zoho.in`
     - `50 mx3.zoho.in`
   - Add SPF TXT record: `v=spf1 include:zoho.in ~all`
   - Add DKIM TXT record: `zoho._domainkey.devclubtrcac.in`
3. **Option C: Microsoft 365**
   - Add MX record: `devclubtrcac-in.mail.protection.outlook.com`
   - Add SPF TXT record: `v=spf1 include:spf.protection.outlook.com ~all`

> **IMPORTANT:** No email address can send or receive external mail until this DNS configuration is completed in Vercel DNS.

---

## 5. Password & MFA Onboarding Protocol

1. **Self-Service Initial Password Establishment:**
   - Once a member's mailbox is active at the provider, the Supabase Auth invitation link or password reset link is sent to their verified mailbox (`https://<app-domain>/auth/callback?next=/reset-password`).
   - The user clicks their one-time cryptographically secure recovery token and sets their private password directly on `/reset-password`.
2. **Zero Password Exposure:**
   - No shared, predictable, or sequential passwords (e.g. `12345678`, `password123`) are ever issued.
   - Passwords are never committed, logged, or transmitted across team chat channels.
3. **Multi-Factor Authentication (MFA):**
   - Mandatory TOTP MFA recommended at the email provider level and Supabase Auth level for privileged management roles (`development_head`, `management_head`, `president`, `vice_president`, `admin`).
