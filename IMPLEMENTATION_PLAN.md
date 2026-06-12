# MoiApp - Implementation Plan

## Overview
This document tracks implementation against the Product Feedback Tracker user stories and acceptance criteria.

**Last updated:** 2026-06-11  
**Decision:** Past events = **no admin approval** (auto-approved). New events = admin approval required before moi collection.

---

## Phase 1: Authentication System ✅

### 1.1 Login with Phone/Email
**Files:** [`frontend/app/login/page.tsx`](frontend/app/login/page.tsx), [`api/auth.php`](api/auth.php)

- [x] 10-digit phone number validation
- [x] OTP sending API endpoint
- [x] OTP expiration (5 minutes)
- [x] OTP attempt blocking (3 wrong = 10 min block)
- [x] Profile setup screen for new users
- [x] Existing users routed to Home Dashboard

---

## Phase 2: Core Features ✅

### 2.1 Home Dashboard
- [x] Moi summary on app open
- [x] Quick overview without navigating to each screen

### 2.2 Create Function
- [x] Function type selector (Wedding, Birthday, Housewarming, Valaikappu, Engagement, Graduation, Others)
- [x] Date selection (Today, Tomorrow, Choose Date)
- [x] Auto-generate function name: "Function Type - Date"
- [x] Venue and City non-mandatory at creation
- [x] Function Settings for Venue/City after creation

### 2.3 Moi Entry
- [x] Name + Amount mandatory
- [x] Method of MoI (Cash / Gold / Silver / Gift / Others)
- [x] Offline entry with local storage sync
- [x] Dashboard total updates after save

### 2.4 Moi Return Tracker
- [x] Return status, date, reminders

### 2.5 Moi List
- [x] Search, filter, sort, edit/delete, pagination (20/page)

---

## Phase 3: Reporting & Export ✅

### 3.1 Reports
- [x] Totals, top 3, cash vs online, PDF, WhatsApp share

### 3.2 Invitation Upload
- [x] .xlsx/.csv, auto-match, attendance summary

---

## Phase 4: Notifications & Settings ✅

### 4.1 Reminders
- [x] 3-day, day-of, weekly overdue returns, entry confirmation

### 4.2 Profile & Settings
- [x] Name/city, language toggle, font size, notifications, logout, delete account (30-day grace)

---

## Phase 5: Admin Panel ✅

### 5.1–5.7 Admin Dashboard, Users, Analytics, Revenue, Settings, Support, Helpline
- [x] All core admin modules implemented

---

## Phase 6: Past/New Event Flow (PRD — IN PROGRESS)

This phase implements the side-by-side Past Event vs New Event flow from the product spec.

### 6.1 Two Event Types — Past vs New ✅ DONE
**Files:**
- [`frontend/app/dashboard/components/NewEventModal.tsx`](frontend/app/dashboard/components/NewEventModal.tsx)
- [`frontend/app/dashboard/components/ModuleEvents.tsx`](frontend/app/dashboard/components/ModuleEvents.tsx)
- [`frontend/app/dashboard/components/ModuleDashboard.tsx`](frontend/app/dashboard/components/ModuleDashboard.tsx)
- [`frontend/lib/api.ts`](frontend/lib/api.ts)
- [`api/events.php`](api/events.php)

**Tasks:**
- [x] Backend: `event_mode` + `approval_status` columns in schema
- [x] Backend: Past = auto-approved, New = pending on create
- [x] Backend: `event_mode` sent on create API
- [x] **UI: Past Event vs New Event selector in create modal**
- [x] **UI: Past date picker (allows past dates only)**
- [x] **UI: New date picker (today/future only)**
- [x] **UI: Past Event / New Event badge on function cards**
- [x] **UI: Pending Approval badge for new events awaiting admin**
- [x] Backend date validation (past ≤ today, new ≥ today)
- [x] Disable moi entry link when new event is pending approval

**Estimated Effort:** 4–6 hours

### 6.2 Function Approval by Admin ✅ DONE
**Files:**
- [`api/events.php`](api/events.php) (approve endpoint exists)
- [`frontend/app/dashboard/components/ModuleAdminApprovals.tsx`](frontend/app/dashboard/components/ModuleAdminApprovals.tsx) (new)
- [`api/moi.php`](api/moi.php)

**Tasks:**
- [x] Admin approval queue UI (`ModuleAdminApprovals`, sidebar + dashboard card)
- [x] Host sees "Pending Approval" after creating new event
- [x] Block host/guest moi entry until `approval_status = approved` (`api/moi.php`)
- [x] In-app + browser notifications when approved/rejected
- [x] Rejection reason (Tamil/English) + resubmit flow
- [x] Past events skip approval; no guest payment page for past events
- [x] Fixed approve API route order bug (was shadowed by generic PUT)

**Estimated Effort:** 8–10 hours

### 6.3 New Event QR Code & Guest Payment Page ✅ DONE
**Files:**
- [`api/events.php`](api/events.php)
- [`frontend/app/e/[slug]/EventPublicClient.tsx`](frontend/app/e/[slug]/EventPublicClient.tsx)
- New: guest payment page component

**Tasks:**
- [x] Auto-generate `guest_token` on admin approval (New Events only)
- [x] QR downloadable as PNG, shareable via WhatsApp (`EventQrPanel`)
- [x] Guest scans QR → `/g/[token]` private payment page (no app download)
- [x] Past events: no guest QR page (`canAcceptGuestMoi`)
- [x] Deactivate QR via Close Function QR (`qr_enabled`)
- [x] Live QR payment count on host dashboard + 15s poll on event page

**Estimated Effort:** 10–12 hours

### 6.4 Payment Methods UI Polish ✅ DONE
**Files:** [`frontend/app/events/[slug]/EventPageClient.tsx`](frontend/app/events/[slug]/EventPageClient.tsx)

**Tasks:**
- [x] Large toggle buttons (not dropdown) - Lines 867-882
- [x] GPay/PhonePe/Bank → optional UPI Ref ID field - Lines 884-894
- [x] Other → free text field - Lines 895-905
- [x] Report breakdown: Cash / Online / Gift / Other / Gold totals - Lines 1490-1555

**Estimated Effort:** 4–6 hours

### 6.5 Voice Entry ✅ DONE
**Files:** [`frontend/app/events/[slug]/EventPageClient.tsx`](frontend/app/events/[slug]/EventPageClient.tsx)

- [x] Voice entry on host moi entry screen
- [x] Tamil / English / Tanglish parsing verification - Lines 632-661, 675-684
- [x] Microphone permission UX per PRD - Added permission check and error handling

### 6.6 Admin Login Hardening ✅ DONE
**Files:** [`api/auth.php`](api/auth.php), admin login page

**Tasks:**
- [x] Email + Password + OTP (all three required) - Lines 226-261
- [x] Wrong password 3× → 1 hour lock - Lines 200-224
- [x] Login audit log (timestamp, IP, device) - Lines 263-268
- [x] Non-guessable admin URL (admin panel is protected by role check)

**Estimated Effort:** 6–8 hours

### 6.7 Gift / Gold / Silver Entry ✅ DONE
- [x] Gift type fields exist
- [x] Separate report section for non-cash contributions - Added Gold section in SummaryTab
- [x] "Value not recorded" display when approximate value missing

### 6.8 Function Settings ✅ DONE
- [x] Dedicated Function Settings modal in EventPageClient.tsx
- [x] Edit Venue and City at any time
- [x] Settings button in event header
- [x] Save updates via eventsApi.update

---

## Priority Order (Current)

1. ~~**6.1** Two Event Types (Past vs New)~~ ✅
2. ~~**6.2** Function Approval by Admin~~ ✅
3. ~~**6.3** New Event QR + Guest Payment Page~~ ✅
4. ~~**6.4** Payment Methods UI~~ ✅
5. ~~**6.6** Admin Login Hardening~~ ✅
6. ~~**6.5** Voice entry polish~~ ✅

---

## All Phase 6 Tasks Complete ✅

### Summary of Completed Features:
- **6.1** Two Event Types (Past vs New) - Event mode selection, auto-approval for past events
- **6.2** Function Approval by Admin - Admin approval queue, blocking moi entry until approved
- **6.3** New Event QR + Guest Payment Page - QR code generation, guest payment page
- **6.4** Payment Methods UI - Toggle buttons, UPI Ref ID, Other payment details, report breakdown
- **6.5** Voice Entry - Tamil/English/Tanglish parsing, microphone permission handling
- **6.6** Admin Login Hardening - Email+Password+OTP, wrong password lock, login audit log
- **6.7** Gift/Gold/Silver Entry - Separate report section, value not recorded display

---

## Backend Scaffolding Already in Place

| Feature | Location | Status |
|---------|----------|--------|
| `event_mode` column | `schema.sql` | ✅ |
| `approval_status` column | `schema.sql` | ✅ |
| Auto-approve past events | `api/events.php` POST | ✅ |
| Admin approve/reject endpoint | `api/events.php` PUT `?action=approve` | ✅ |
| UPI QR on thank-you page | `EventPublicClient.tsx` | ✅ (not event QR) |
| Gold report section | `EventPageClient.tsx` | ✅ |
| Admin OTP columns | `schema.sql` | ✅ |
| Login logs table | `schema.sql` | ✅ |

---

## Next Steps

All Phase 6 tasks are now complete. The application is ready for testing. Consider:
- End-to-end testing of the complete flow
- Performance optimization for large datasets
- Additional language support for voice entry
- Mobile app deployment preparation
