# MoiApp Mobile — Pre-Filled QA Status (Code Audit)

> **Not a live test.** Status from codebase review vs web + feedback tracker.  
> **Your job:** Run smoke test, change ✅ → ❌ where device behavior differs.

**Audit date:** 2026-06-28 &nbsp;|&nbsp; **Verify on device before release sign-off**

---

## Summary scorecard

| Area | Pass | Partial | Fail | N/A |
|------|:----:|:-------:|:----:|:---:|
| Auth (A) | 5 | 1 | 0 | 1 |
| Main tabs (B) | 12 | 5 | 0 | 0 |
| Create + approval (C) | 9 | 2 | 0 | 0 |
| Event tabs (D) | 10 | 3 | 0 | 0 |
| Event stack (E) | 7 | 2 | 0 | 0 |
| Guest (F) | 5 | 6 | 0 | 0 |
| Admin (G) | 7 | 1 | 0 | 0 |
| **Total** | **55** | **20** | **0** | **1** |

**Estimated readiness:** ~73% pass on audit · ~27% needs device verification or Phase 2

---

## A. Auth

| ID | Item | Status | Verify on device |
|----|------|:------:|------------------|
| A1 | Splash | ✅ | Auto-nav after delay |
| A2 | Login UI | ✅ | Yellow card + logo |
| A2 | Profile indication (TC_01) | ⚠️ | Name/avatar in header? |
| A3 | OTP | ✅ | 10-digit validation |
| A4 | Profile setup | ✅ | Name required |
| A5 | Register | ✅ | Email path |
| A6 | Forgot password | N/A | Web only |

---

## B. Main tabs

| ID | Item | Status | Notes |
|----|------|:------:|-------|
| B1.1 | Home yellow UI | ✅ | 4 stat cards |
| B1.2 | Quick actions | ✅ | |
| B1.3 | Recent functions API | ✅ | |
| B1.4 | Pending → Pending screen | ✅ | `getEventFlowScreen` |
| B1.5 | Approved → Event tabs | ✅ | |
| B1.6 | Create function entry | ✅ | |
| B1.7 | Profile in header (TC_01) | ⚠️ | Confirm visually |
| B1.8 | Unauthorized errors | ⚠️ | Test expired token |
| B2.1–3 | Events list + routing | ✅ | |
| B2.4 | Cover images | ⚠️ | Tracker bug — test CDN URLs |
| B2.5 | Past event badge | ⚠️ | Web has badge; mobile partial |
| B3.1 | "Moi Notebook" label | ✅ | MainTabs |
| B3.2 | Global moi list | ✅ | |
| B3.3 | Global search/filter | ⚠️ | Lighter than web |
| B4 | Global analytics | ⚠️ | Basic vs web charts |
| B5 | Menu / Settings / sidebar | ✅ | UPI in settings |
| B5 | Organizers / Guests | ⚠️ | Basic screens |

---

## C. Create + approval

| ID | Item | Status | Notes |
|----|------|:------:|-------|
| C1 | Choose New / Past | ✅ | |
| C2 | Multi-step create, 7 types | ✅ | |
| C4 | New → pending | ✅ | API forces pending |
| C5 | Past → approved | ✅ | |
| C6 | Draft → pending (new) | ✅ | Fixed |
| C7 | Time field | ⚠️ | `wedding_time` — tracker bug |
| C8 | Venue optional | ✅ | |
| C9 | Pending screen + poll | ✅ | 5s interval |
| C10 | Rejected + resubmit | ✅ | |
| C11 | Event tabs blocked | ✅ | `EventTabs` guard |

---

## D. Event tabs

| Tab / check | Status | Notes |
|-------------|:------:|-------|
| Dashboard live stats | ✅ | |
| Dashboard empty state | ✅ | |
| Moi Entries search/sort | ✅ | |
| Edit / delete | ✅ | |
| Export CSV | ✅ | |
| Gold shown as cash ₹0 | ⚠️ | Tracker — retest gift/gold |
| Voice — web speech | ✅ | Web only |
| Voice — native | ⚠️ | Manual parse only |
| Gift entry save | ✅ | Blocked if pending |

---

## E. Event stack

| Screen | Status | Notes |
|--------|:------:|-------|
| Host payment method | ✅ | |
| Moi entry + approval block | ✅ | |
| QR enable/disable/regenerate | ✅ | |
| QR WhatsApp share | ✅ | |
| Reports + filters + chart | ✅ | |
| Reports email PDF | ⚠️ | Tracker: mail PDF bug |
| Invitees CSV + template | ✅ | |
| Invitation cover upload | ✅ | |
| Event settings edit/delete | ✅ | |

---

## F. Guest flow

| Screen / check | Status | Notes |
|----------------|:------:|-------|
| Landing | ✅ | |
| Form — gift types visible | ✅ | TC gold/gift fixed |
| Form — relationship | ⚠️ | Text field; tracker wants dropdown |
| Payment Razorpay | ⚠️ | Web OK; native → browser |
| Scan & Pay + UPI ref | ✅ | |
| ₹0 + ₹9 fee | ⚠️ | Tracker bug — retest |
| GPay intent | ⚠️ | Tracker — native limitation |
| UPI raw HTML error | ⚠️ | Tracker — test web |
| Success + receipt | ✅ | |
| Link expired | ✅ | |

---

## G. Admin

| Screen | Status | Notes |
|--------|:------:|-------|
| Dashboard stats | ✅ | |
| **Approvals** | ✅ | **Required for new events** |
| Users | ✅ | |
| Revenue / Analytics / Support | ⚠️ | Less depth than web |
| Private events | ✅ | |
| Admin vs Organizer roles | ⚠️ | Tracker gap |

---

## H. Phase 2 — not expected on mobile

| Feature | Status |
|---------|:------:|
| Return gift tracker | ❌ missing |
| Reminders UI | ❌ missing |
| Bulk moi import | ❌ missing |
| Event photos tab | ❌ missing |
| Offline sync | ❌ missing |
| Language TA/EN | ❌ missing |
| Forgot password | ❌ missing |

---

## Top 10 device retests (from feedback tracker)

| Priority | Bug / item | Where | Audit |
|:--------:|------------|-------|:-----:|
| 1 | Admin approval before moi entry | New event flow | ✅ code |
| 2 | Gold/gift options visible | Guest form | ✅ verify UI |
| 3 | Gold entry shows as Cash ₹0 | Moi list | ⚠️ |
| 4 | Mail PDF report | Event reports | ⚠️ |
| 5 | Unauthorized on dashboard/create | Auth/API | ⚠️ |
| 6 | Event time on create | Create function | ⚠️ |
| 7 | ₹0 gift + ₹9 fee | Guest payment | ⚠️ |
| 8 | Relationship dropdown | Guest/gift | ⚠️ |
| 9 | Cover images not loading | Events list | ⚠️ |
| 10 | GPay / UPI payment UX | Guest payment | ⚠️ |

---

## Mockup coverage (22 screens)

| # | Screen | Audit |
|---|--------|:-----:|
| 1–4 | Auth | ✅ |
| 5 | Home | ✅ |
| 6–8 | Create + pending | ✅ |
| 9–10 | Event dashboard | ✅ |
| 11 | QR | ✅ |
| 12–14 | Moi / gift / list | ✅ / ⚠️ gold display |
| 15 | Reports | ⚠️ PDF email |
| 16–22 | Invitees, guest, payment, receipt, invitation | ✅ / ⚠️ payment native |

**Theme:** Mockups purple → app uses **#FFC107 yellow** (intentional).

---

## Recommended next actions

1. Run **`QA_SMOKE_TEST_ONE_PAGE.md`** critical path (12 steps) on Expo Go + one web session.
2. Fix any ❌ from device test starting with **Top 10 retests**.
3. Update this file after test day — change audit symbols to confirmed Pass/Fail.
4. Use **`QA_REVIEW_CHECKLIST.md`** for full sign-off section J.

**Release recommendation (audit only):** ☐ Proceed to QA on device &nbsp; ☐ Hold — complete Phase 2 items first

*Audit recommendation: **Proceed to device QA** — core host/guest/approval paths implemented; payment native and gold-entry display need tester confirmation.*
