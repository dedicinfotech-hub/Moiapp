# MoiApp — Prioritized Feature Document
**For:** Arunugam (Developer)  
**Date:** 2026-06-04  
**Goal:** Launch-ready feature list focusing on Weddings & Birthday Parties

---

## Current State of MoiApp

### What Already Exists ✅
| Feature | Status |
|---------|--------|
| User registration & login (JWT auth) | ✅ Done |
| Create wedding event (bride + groom names, date, venue) | ✅ Done |
| Public event listing page | ✅ Done |
| Public event detail page with photos | ✅ Done |
| Guest moi entry form (cash/gold/gift) | ✅ Done |
| Payment mode selection (cash/UPI/card/cheque) | ✅ Done |
| Cover photo upload | ✅ Done |
| Photo gallery for events | ✅ Done |
| CSV export of moi entries | ✅ Done |
| Dashboard with stats | ✅ Done |
| Responsive mobile UI | ✅ Done |
| WhatsApp share link | ✅ Done |
| Venue map integration | ✅ Done |

### Implementation Status
| Feature | Status |
|---------|--------|
| Event type selection (wedding vs birthday vs other) | ✅ Done |
| Birthday party event creation flow | ✅ Done |
| PDF export (not just CSV) | ✅ Done |
| Email sending of PDF to organizer | ✅ Done |
| QR code generation for UPI payment | ✅ Done |
| Thank you note / confirmation message after moi entry | ✅ Done |
| Online payment collection (UPI deep link) | ❌ Priority 2 |
| Digital conversion of old physical moi notes | ❌ Priority 2 |
| Multi-event type support in DB | ✅ Done |

---

## PRIORITY 1 — MUST HAVE FOR LAUNCH 🚨

### 1.1 Event Type System ✅ COMPLETED
**Why:** Customer wants to limit to Weddings & Birthday Parties first. Need to support both event types.

**Changes Required:**

#### Database
```sql
-- Add event_type column to events table
ALTER TABLE events ADD COLUMN event_type ENUM('wedding','birthday') NOT NULL DEFAULT 'wedding';

-- For birthday events, we don't need bride/groom — add optional fields
ALTER TABLE events ADD COLUMN birthday_person_name VARCHAR(100) NULL AFTER groom_name;
ALTER TABLE events ADD COLUMN birthday_person_age INT NULL AFTER birthday_person_name;
```
**Status:** ✅ Migration script created at `scripts/migrate_event_types.php`

#### Backend (api/events.php)
- Modify `POST` create event to accept `event_type` parameter
- Modify `PUT` update event to accept `event_type`
- Validation: if `event_type = 'wedding'` → require `bride_name` + `groom_name`; if `birthday` → require `birthday_person_name`
- Update slug generation to handle both types
**Status:** ✅ Implemented in `api/events.php`

#### Frontend
- **New event form** (`frontend/app/dashboard/page.tsx`): Add event type selector (Wedding / Birthday) at top
- Show conditional fields based on type:
  - Wedding: Bride Name, Groom Name
  - Birthday: Person Name, Age
- Update event cards to show appropriate icon (💍 vs 🎂)
- Update public event page to show correct category pill
**Status:** ✅ Implemented in dashboard modals, event cards, and public event page

---

### 1.2 PDF Export + Email Delivery ✅ COMPLETED
**Why:** Customer explicitly said: "Whatever the data they input, it should be sent as PDF Document via mail for safety."

**Changes Required:**

#### Backend (new file: `api/pdf.php`)
```php
// Endpoint: GET /api/pdf.php?event_id=X
// Generates PDF of all moi entries and emails to organizer
```
**Status:** ✅ Implemented at `api/pdf.php`
- Generates styled HTML report with event details, moi entries table, and summary stats
- Emails report link to organizer via PHP `mail()`
- Uses browser print-to-PDF approach (simplest, no external library needed)

**PDF Content:**
- Event header: Type, Names, Date, Venue
- Table: #, Guest Name, Amount, Gift Type, Relation, Payment Mode, Note, Date
- Summary: Total amount, Total guests, Breakdown by payment mode
- Footer: Generated timestamp, MoiApp branding

**Email:**
- Send PDF as attachment to organizer's email
- Subject: "Moi Report — [Event Name]"
- Body: Brief summary + PDF attached

#### Frontend
- Add "Send PDF via Email" button in dashboard and event detail page
- Show loading state while generating
- Show success/error toast
**Status:** ✅ Implemented in dashboard event tables (desktop + mobile)

---

### 1.3 Thank You Note / Confirmation After Moi Entry ✅ COMPLETED
**Why:** Customer wants guests to get confirmation on WhatsApp with a thank you note.

**Changes Required:**

#### Frontend (EventPublicClient.tsx — SuccessView)
After guest submits moi entry, show:
- Thank you message: "🙏 Thank you, [Guest Name]! Your moi has been recorded."
- WhatsApp share button with pre-filled message:
  ```
  "I just gave moi to [Bride/Groom Name]'s [Wedding/Birthday]! 🎉
  Event: [Event Name]
  Date: [Date]
  Venue: [Venue]
  Give moi here: [Event URL]"
  ```
- Option to copy link
- Option to view event details
**Status:** ✅ Implemented in `SuccessView` component with WhatsApp share card

---

### 1.4 QR Code for UPI Payment ✅ COMPLETED
**Why:** Customer mentioned "QR Code at the Wedding" for online payments.

**Changes Required:**

#### Backend
- Add `upi_qr_code_url` field to users table (or generate on-the-fly)
- QR code should contain: `upi://pay?pa=[UPI_ID]&pn=[Name]&am=[Amount]&cu=INR`
**Status:** ✅ QR code generated on-the-fly using `api.qrserver.com` API

#### Frontend
- After moi entry submission (if payment_mode = UPI), show QR code
- QR code image generated using a library like `qrcode.react` or API like `goqr.me`
- Show UPI ID text below QR code for manual entry
- Note: "Scan to pay" + "Or pay manually to UPI ID: [upi_id]"
**Status:** ✅ Implemented in `SuccessView` with QR code, copy UPI ID, and "Open UPI App" button

---

## PRIORITY 2 — POST LAUNCH (Within 2-4 weeks)

### 2.1 Online Payment Collection
**Why:** "They can collect the money online" — for GenZ weddings.

**Approach:**
- UPI Deep Link: Generate `upi://pay` link with pre-filled amount
- Show on success page after moi entry
- Track payment status (pending/confirmed) in moi_entries table
- Add `payment_status` column: `pending`, `confirmed`, `failed`

**Database:**
```sql
ALTER TABLE moi_entries ADD COLUMN payment_status ENUM('pending','confirmed','failed') DEFAULT 'pending';
ALTER TABLE moi_entries ADD COLUMN upi_transaction_id VARCHAR(100) NULL;
```

---

### 2.2 Digital Conversion of Old Moi Notes
**Why:** "You can convert your Old Moi Note into Digital so that you can refer anytime."

**Feature:**
- Bulk import page in dashboard
- CSV/Excel upload of old moi entries
- Manual entry form for old entries (with date picker for past dates)
- Tag entries as "digitized" vs "live"
- Search and filter across all entries

**Database:**
```sql
ALTER TABLE moi_entries ADD COLUMN is_digitized TINYINT(1) DEFAULT 0;
ALTER TABLE moi_entries ADD COLUMN original_entry_date DATE NULL;
```

---

### 2.3 Multi-Organizer Support
**Why:** Weddings often have multiple organizers (bride's family + groom's family).

**Changes:**
- Add `organizers` table linking users to events
- Allow multiple users to manage same event
- Each organizer gets their own login

---

## PRIORITY 3 — FUTURE (1-3 months)

### 3.1 Additional Event Types
- Engagement (நிச்சயத்தாரtham)
- Valakaappu (வளக்காடு)
- Housewarming (குடியேற்றம்)
- Baby shower / Seemantham
- Generic "Other Function"

**Approach:** Make `event_type` an extensible enum or separate table.

### 3.2 WhatsApp Bot Integration
- Guests send moi via WhatsApp message
- Bot parses message and creates entry
- Auto-reply with thank you + QR code

### 3.3 SMS Notifications
- Send SMS to guests with event link
- Reminder SMS before event

### 3.4 Advanced Analytics
- Guest demographics
- Payment trends
- Relation-wise breakdown charts

---

## TECHNICAL NOTES

### Database Changes Summary
```sql
-- 1. Event type support
ALTER TABLE events 
  ADD COLUMN event_type ENUM('wedding','birthday') NOT NULL DEFAULT 'wedding',
  ADD COLUMN birthday_person_name VARCHAR(100) NULL AFTER groom_name,
  ADD COLUMN birthday_person_age INT NULL AFTER birthday_person_name;

-- 2. Payment tracking
ALTER TABLE moi_entries 
  ADD COLUMN payment_status ENUM('pending','confirmed','failed') DEFAULT 'pending',
  ADD COLUMN upi_transaction_id VARCHAR(100) NULL;

-- 3. Digitized entries
ALTER TABLE moi_entries 
  ADD COLUMN is_digitized TINYINT(1) DEFAULT 0,
  ADD COLUMN original_entry_date DATE NULL;
```

### Composer Dependencies to Add
```
composer require mpdf/mpdf
composer require phpmailer/phpmailer
```

### Frontend Dependencies to Add
```
npm install qrcode.react
npm install react-toastify  (for notifications)
```

### File Structure Changes
```
api/
  pdf.php              ← NEW: PDF generation + email
  events.php           ← MODIFY: Add event_type support
  scripts/
    migrate_event_types.php  ← NEW: Database migration

frontend/
  app/
    e/[slug]/
      EventPublicClient.tsx  ← MODIFY: Thank you + QR code + birthday-aware UI
    dashboard/
      page.tsx       ← MODIFY: Event type selector + PDF email button
    events/
      page.tsx       ← MODIFY: Birthday-aware event cards
  lib/
    api.ts            ← MODIFY: Added emailPDF() + Event type fields
```

---

## LAUNCH CHECKLIST

### Before Launch (Priority 1) — ALL COMPLETED ✅
- [x] Event type selector (Wedding / Birthday)
- [x] Conditional form fields based on event type
- [x] PDF generation with HTML report
- [x] Email sending to organizer
- [x] Thank you page with WhatsApp share
- [x] QR code display for UPI payments
- [ ] Test on mobile (venue halls with good internet)
- [ ] Test CSV export still works

### Post Launch (Priority 2)
- [ ] UPI deep link payment flow
- [ ] Bulk import for old moi notes
- [ ] Multi-organizer support

---

## CAUTIONS FROM CUSTOMER

1. **"Whatever the data they input, it should be sent as PDF Document via mail for safety"** → Priority 1, non-negotiable
2. **"People who can pay Online with basic"** → Keep UPI flow simple, no complex payment gateway
3. **"Wedding Halls with good Internet Access by the users"** → Optimize for mobile, fast loading
4. **"For GenZ Weddings & Parents of Genz will be in their 80s"** → Large fonts, simple UI, minimal steps
5. **"Limit the options"** → Don't overwhelm users — focus on Weddings & Birthday Parties only for now

---

## ESTIMATED EFFORT

| Feature | Backend | Frontend | Testing | Total |
|---------|---------|----------|---------|-------|
| Event Type System | 2 hrs | 3 hrs | 1 hr | 6 hrs |
| PDF + Email | 3 hrs | 1 hr | 1 hr | 5 hrs |
| Thank You + WhatsApp | 0 hrs | 2 hrs | 0.5 hr | 2.5 hrs |
| QR Code for UPI | 1 hr | 2 hrs | 0.5 hr | 3.5 hrs |
| **Priority 1 Total** | **6 hrs** | **8 hrs** | **3 hrs** | **~17 hrs** |
