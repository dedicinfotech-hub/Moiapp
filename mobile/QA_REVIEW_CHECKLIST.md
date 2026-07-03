# MoiApp Mobile — QA Review Checklist

Use this document to review **each tab and screen** against mockups, web behavior, and the [Product Feedback Tracker](../MoiApp%20-%20Product%20Feedback%20Tracker%20(2).xlsx) / [FEEDBACK_TRACKER_SUMMARY.md](../FEEDBACK_TRACKER_SUMMARY.md).

## Before you start

| Item | Value |
|------|--------|
| **Build** | Expo Go / APK / `npm run web` |
| **API** | `app.json` → `extra.apiUrl` |
| **Test date** | |
| **Reviewer** | |
| **Device / OS** | |

### Test accounts

| Role | Email / phone | Notes |
|------|---------------|--------|
| Host | | Normal organizer |
| Admin | | For Approvals tab |
| Guest | | No login — use QR / guest link |

Create **two** functions during testing:

1. **New Event** — must stay on Pending until admin approves  
2. **Past Event** — auto-approved, no guest QR  

### Status legend

| Mark | Meaning |
|------|---------|
| ✅ | Pass — matches mockup + web logic |
| ⚠️ | Partial — works with known gaps |
| ❌ | Fail — broken or missing |
| 🔒 | Expected block (e.g. moi entry before approval) |
| N/A | Not applicable on mobile |

---

## Review process (5 steps)

1. Log in as **Host** and complete one full host path (create → pending → approve → entry → QR).  
2. Log in as **Admin** and approve/reject at least one event.  
3. Open **Guest link** (scan QR or paste URL) and complete payment path.  
4. For each row below: **UI** (mockup) | **Logic** (API same as web) | **Tracker** (known bugs).  
5. Record screenshot + steps for every ❌ or ⚠️ in the feedback tracker.

---

## A. Auth flow (no bottom tabs)

| # | Mockup | Screen | File | UI | Logic | Tracker | Pass/Fail | Notes |
|---|--------|--------|------|----|-------|---------|-----------|-------|
| A1 | 1 | Splash | `screens/auth/SplashScreen.tsx` | | | | | |
| A2 | 2 | Login | `screens/auth/LoginScreen.tsx` | | | TC_01 profile hint | | |
| A3 | 3 | OTP | `screens/auth/OTPScreen.tsx` | | | 10-digit, resend | | |
| A4 | 4 | Profile setup | `screens/auth/ProfileSetupScreen.tsx` | | | Name required | | |
| A5 | — | Register | `screens/auth/RegisterScreen.tsx` | | | | | |
| A6 | — | Forgot password | Web + Mobile (`ForgotPasswordScreen`) | ✅ | ✅ | | | |

**Auth sign-off:** Reviewer __________ Date __________ Pass / Fail __________

---

## B. Main bottom tabs (logged-in host)

### B1. Home

| # | Check | UI | Logic | Tracker | Pass/Fail | Notes |
|---|--------|----|-------|---------|-----------|-------|
| B1.1 | Yellow dashboard layout (4 stat cards) | | | | | |
| B1.2 | Quick actions navigate correctly | | | | | |
| B1.3 | Recent functions list loads from API | | | | | |
| B1.4 | Tap **pending** event → Pending Approval (not dashboard) | | | | | |
| B1.5 | Tap **approved** event → Event tabs | | | | | |
| B1.6 | Create New Function → Choose type | | | | | |
| B1.7 | Header / profile indication (TC_01) | | | TC_01 | | |
| B1.8 | No “Unauthorized” errors on load | | | Tracker | | |

**File:** `screens/home/HomeScreen.tsx`

---

### B2. Events (Functions tab)

| # | Check | UI | Logic | Tracker | Pass/Fail | Notes |
|---|--------|----|-------|---------|-----------|-------|
| B2.1 | All host events listed | | | | | |
| B2.2 | Status badge: pending / approved / rejected | | | | | |
| B2.3 | Pending → Pending Approval screen | | | | | |
| B2.4 | Cover images load | | | Event images bug | | |
| B2.5 | Past Event distinguishable | | | Past badge | | |

**File:** `screens/home/FunctionsScreen.tsx`

---

### B3. Moi Notebook

| # | Check | UI | Logic | Tracker | Pass/Fail | Notes |
|---|--------|----|-------|---------|-----------|-------|
| B3.1 | Tab label is **Moi Notebook** (not Payments) | | | Rename | | |
| B3.2 | Global moi entries list | | | | | |
| B3.3 | Search / filter (if shown) | | | | | |

**File:** `screens/home/GlobalScreens.tsx` → `GlobalMoiListScreen`

---

### B4. Analytics (global tab)

| # | Check | UI | Logic | Tracker | Pass/Fail | Notes |
|---|--------|----|-------|---------|-----------|-------|
| B4.1 | Summary / charts render | | | | | |
| B4.2 | Data matches web analytics (approx.) | | | | | |

**File:** `screens/home/GlobalScreens.tsx` → `GlobalReportsScreen`

---

### B5. Menu (More tab + drawer)

| Module | Screen | File | UI | Logic | Pass/Fail | Notes |
|--------|--------|------|----|-------|-----------|-------|
| Menu list | More | `screens/settings/MoreScreen.tsx` | | | | |
| Settings | Settings | `screens/settings/SettingsScreen.tsx` | | | UPI/bank for Scan & Pay | |
| Organizers | Organizers | `screens/dashboard/OrganizersScreen.tsx` | | | | |
| Guests | Guests | `screens/dashboard/GuestsScreen.tsx` | | | | |
| Analytics (menu) | Analytics | `screens/dashboard/AnalyticsScreen.tsx` | | | | |
| Features | Features | `screens/dashboard/FeaturesScreen.tsx` | | | Admin only | |
| Sidebar drawer | App sidebar | `components/layout/AppSidebarContent.tsx` | | | Matches web nav | |

**Main tabs sign-off:** Reviewer __________ Date __________ Pass / Fail __________

---

## C. Create function flow

| # | Mockup | Screen | File | UI | Logic | Pass/Fail | Notes |
|---|--------|--------|------|----|-------|-----------|-------|
| C1 | 6 | Choose Event Type | `ChooseEventTypeScreen.tsx` | | New vs Past | | |
| C2 | 7 | Create Function | `CreateFunctionScreen.tsx` | | 7 types, steps | | |
| C3 | — | | All function types (wedding, birthday, …) | | | | |
| C4 | — | | **New** → approval_status pending | | | | |
| C5 | — | | **Past** → auto-approved | | | | |
| C6 | — | | Draft does not skip approval (new) | | | | |
| C7 | — | | Time field saves (`event_time`) | | | Tracker: time bug | |
| C8 | — | | Venue/city optional on create | | | | |
| C9 | 8 | Pending Approval | `PendingApprovalScreen.tsx` | | Poll 5s → redirect when approved | | |
| C10 | — | | Rejected: reason + Edit + Resubmit | | | | |
| C11 | 🔒 | | Cannot open Event tabs while pending | | | Expected | |

**Create flow sign-off:** Reviewer __________ Date __________ Pass / Fail __________

---

## D. Event bottom tabs (approved or past event only)

Open an **approved New Event** or **Past Event**.

| Tab | Mockup | File | UI | Logic | Pass/Fail | Notes |
|-----|--------|------|----|-------|-----------|-------|
| Dashboard | 9, 10 | `EventDashboardScreen.tsx` | | Stats, quick actions, empty state | | |
| Moi Entries | 14 | `MoiEntriesScreen.tsx` | | Search, sort, edit, delete, export CSV | | |
| Voice Entry | — | `VoiceEntryScreen.tsx` | | Web: speech; Native: manual parse | | |
| Gift Entry | 13 | `GiftEntryScreen.tsx` | | Save gift via API | | |
| More | — | `EventMoreScreen.tsx` | | Links to sub-screens | | |

### D1. Event dashboard checks

| # | Check | Pass/Fail | Notes |
|---|--------|-----------|-------|
| D1.1 | Live collection stats correct | | |
| D1.2 | Recent entries (max 5) | | |
| D1.3 | Empty state + Share QR (mockup 10) | | |
| D1.4 | Quick action: QR, Manual entry, Reports | | |
| D1.5 | Manual entry → Payment method → Moi entry | | |

### D2. Moi entries list checks

| # | Check | Pass/Fail | Notes |
|---|--------|-----------|-------|
| D2.1 | Search by name | | |
| D2.2 | Sort: newest / amount | | |
| D2.3 | Edit entry modal | | |
| D2.4 | Delete with confirmation | | |
| D2.5 | Export CSV shares file | | |
| D2.6 | Gold/gift entries display correctly | | Tracker: gold as cash ₹0 |

**Event tabs sign-off:** Reviewer __________ Date __________ Pass / Fail __________

---

## E. Event stack screens (from More / quick actions)

| # | Mockup | Screen | File | UI | Logic | Pass/Fail | Notes |
|---|--------|--------|------|----|-------|-----------|-------|
| E1 | — | Host payment method | `HostPaymentMethodScreen.tsx` | | Before moi entry | | |
| E2 | 12 | Moi entry | `MoiEntryScreen.tsx` | | Blocked if pending 🔒 | | |
| E3 | 13 | Gift entry | `GiftEntryScreen.tsx` | | Blocked if pending 🔒 | | |
| E4 | 11 | QR code | `QRCodeScreen.tsx` | | Copy, WhatsApp, enable/disable, regenerate | | |
| E5 | 15 | Reports | `EventReportsScreen.tsx` | | Filters, chart, export CSV, email PDF | | |
| E6 | 16 | Invitees upload | `InviteesUploadScreen.tsx` | | CSV upload + sample template | | |
| E7 | 22 | Invitation upload | `InvitationUploadScreen.tsx` | | Cover photo upload | | |
| E8 | — | Event settings | `EventSettingsScreen.tsx` | | Edit, delete, resubmit if rejected | | |

### E — Approval gate (retest every release)

| # | Scenario | Expected | Pass/Fail | Notes |
|---|----------|----------|-----------|-------|
| E-A1 | New event, not approved → open Event tabs | Redirect to Pending Approval | | |
| E-A2 | Try Save on Moi / Gift / Voice | Blocked UI + API 403 message | | |
| E-A3 | Admin approves → host auto-redirects | Event tabs unlock within ~5s | | |
| E-A4 | Past event | Moi entry works without admin | | |

**Event stack sign-off:** Reviewer __________ Date __________ Pass / Fail __________

---

## F. Guest flow (no login)

Guest URL: `https://moipassbook.com/g/{token}` (or in-app Guest stack)

| # | Mockup | Screen | File | UI | Logic | Pass/Fail | Notes |
|---|--------|--------|------|----|-------|-----------|-------|
| F1 | — | Landing | `GuestLandingScreen.tsx` | | | | |
| F2 | 17 | Guest form | `GuestFormScreen.tsx` | | Cash/Gold/Silver/Gift visible | TC gold/gift | |
| F3 | 18–19 | Payment | `GuestPaymentScreen.tsx` | | Razorpay + Scan & Pay | | |
| F4 | 20 | Payment success | `PaymentSuccessScreen.tsx` | | | | |
| F5 | 21 | Receipt | `GuestReceiptScreen.tsx` | | API receipt | | |
| F6 | — | Link expired | `LinkExpiredScreen.tsx` | | QR closed / not approved | | |

### F — Guest payment tracker bugs

| # | Bug (from tracker) | Pass/Fail | Notes |
|---|-------------------|-----------|-------|
| F-P1 | ₹0 gift + ₹9 convenience fee | | |
| F-P2 | Name & City mandatory | | |
| F-P3 | GPay / PhonePe opens correctly | | Native may use browser |
| F-P4 | UPI — no raw HTML error page | | Test on web build |
| F-P5 | Gold/Silver/Gift item name field | | |
| F-P6 | Relationship dropdown (not free text) | | |

**Guest flow sign-off:** Reviewer __________ Date __________ Pass / Fail __________

---

## G. Admin panel (admin user only)

**Path:** Menu → Admin Panel (or sidebar Admin section)

| # | Screen | File | UI | Logic | Pass/Fail | Notes |
|---|--------|------|----|-------|-----------|-------|
| G1 | Admin dashboard | `AdminScreens.tsx` | | Stats load | | |
| G2 | **Event approvals** | `AdminApprovals` | | Approve / reject | **Critical** | |
| G3 | User management | `AdminUsers` | | | | |
| G4 | Revenue | `AdminRevenue` | | | | |
| G5 | Analytics | `AdminAnalytics` | | | | |
| G6 | Support | `AdminSupport` | | | | |
| G7 | Private events | `AdminPrivateEvents` | | | | |
| G8 | Feature toggles | `AdminFeatures` | | | | |

### G — Approval E2E script

| Step | Action | Pass/Fail | Notes |
|------|--------|-----------|-------|
| 1 | Host creates **New Event** | | |
| 2 | Host sees Pending Approval | | |
| 3 | Host **cannot** save moi entry | | |
| 4 | Admin → Approvals → **Approve** | | |
| 5 | Host redirected to Event tabs | | |
| 6 | QR code visible; guest link works | | |

**Admin sign-off:** Reviewer __________ Date __________ Pass / Fail __________

---

## H. Known web features — not on mobile (Phase 2)

Do **not** fail mobile QA for these unless product says otherwise:

| Feature | Web | Mobile |
|---------|-----|--------|
| Return gift tracker | ✅ | ❌ |
| Scheduled reminders (3-day, day-of) | ✅ backend | ❌ UI |
| Bulk CSV moi import | ✅ | ❌ |
| Event photos tab | ✅ | ❌ |
| Offline entry sync | ✅ | ❌ |
| Language toggle (TA / EN) | ✅ | ❌ |
| Forgot / reset password | ✅ | ✅ |
| Native Razorpay SDK | ✅ web | ⚠️ browser on native |
| Invitation auto-match dashboard | ✅ | ⚠️ partial (invitees list) |
| Admin vs Organizer role split | ✅ | ⚠️ partial |

---

## I. Mockup screen index (22 screens)

Map design mockups → mobile implementation:

| # | Mockup title | Mobile route / screen | Section above |
|---|--------------|----------------------|---------------|
| 1 | Splash | Auth → Splash | A1 |
| 2 | Login | Auth → Login | A2 |
| 3 | OTP | Auth → OTP | A3 |
| 4 | Profile | Auth → Profile Setup | A4 |
| 5 | Home Dashboard | Tab Home | B1 |
| 6 | Choose Event Type | EventFlow → ChooseEventType | C1 |
| 7 | Create Function | EventFlow → CreateFunction | C2 |
| 8 | Pending Approval | EventFlow → PendingApproval | C9 |
| 9 | Event Dashboard (live) | EventTabs → Dashboard | D |
| 10 | Event Dashboard (empty) | EventTabs → Dashboard (no entries) | D1.3 |
| 11 | QR Code | EventFlow → QRCode | E4 |
| 12 | Moi Entry | EventFlow → MoiEntry | E2 |
| 13 | Gift Entry | EventTabs → GiftEntry | E3 |
| 14 | Moi Entries List | EventTabs → MoiEntries | D2 |
| 15 | Reports | EventFlow → EventReports | E5 |
| 16 | Invitees Upload | EventFlow → InviteesUpload | E6 |
| 17 | Guest Form | GuestFlow → GuestForm | F2 |
| 18 | Guest Payment | GuestFlow → GuestPayment | F3 |
| 19 | Payment Method | GuestFlow → GuestPayment (methods list) | F3 |
| 20 | Payment Successful | GuestFlow → PaymentSuccess | F4 |
| 21 | Thank You / Receipt | GuestFlow → GuestReceipt | F5 |
| 22 | Invitation Upload | EventFlow → InvitationUpload | E7 |

**Theme:** Mockups may show purple; production mobile uses **yellow `#FFC107`**.

---

## J. Final release sign-off

| Area | Pass/Fail | Blocker count | Reviewer | Date |
|------|-----------|---------------|----------|------|
| Auth | | | | |
| Main tabs (B1–B5) | | | | |
| Create + approval (C) | | | | |
| Event tabs (D) | | | | |
| Event stack (E) | | | | |
| Guest flow (F) | | | | |
| Admin (G) | | | | |

**Overall mobile release:** Pass / Fail  

**Notes / blockers:**

```
( paste failed items + ticket IDs here )
```

---

## References

- Web API client: `frontend/lib/api.ts`
- Web approval helpers: `frontend/lib/eventHelpers.ts`
- Mobile event helpers: `mobile/src/utils/eventHelpers.ts`
- Flow verification (web): `FLOW_VERIFICATION_REPORT.md`
- Feedback summary: `FEEDBACK_TRACKER_SUMMARY.md`
- Full tracker Excel: `MoiApp - Product Feedback Tracker (2).xlsx`
- **One-page smoke test:** `QA_SMOKE_TEST_ONE_PAGE.md`
- **Pre-filled audit status:** `QA_REVIEW_PREFILLED.md`
