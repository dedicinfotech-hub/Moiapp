# MoiApp — Tester User Manual
**Version:** 1.0 (Launch-ready)  
**Date:** 2026-06-05  
**Application:** MoiApp – Wedding & Event Gift Tracker  
**Tech Stack:** Next.js (Frontend) + PHP/MySQL (Backend)

---

## Table of Contents
1. [Application Overview](#1-application-overview)
2. [User Roles & Access](#2-user-roles--access)
3. [Core Features](#3-core-features)
4. [Testing Scenarios](#4-testing-scenarios)
5. [API Endpoints Reference](#5-api-endpoints-reference)
6. [Database Schema Overview](#6-database-schema-overview)
7. [Edge Cases & Known Limitations](#7-edge-cases--known-limitations)
8. [Mobile vs Desktop Checklist](#8-mobile-vs-desktop-checklist)

---

## 1. Application Overview

MoiApp is a gift-tracking application designed for Indian weddings and family events. It allows:
- **Organizers** to create events, track moi (gift money/gold/gifts) from guests, and export reports.
- **Guests** to browse public events, submit moi entries, and share event links via WhatsApp.

### Supported Event Types
| Type | Icon | Required Fields |
|------|------|-----------------|
| Wedding | 💒 | Bride Name, Groom Name, Date |
| Birthday | 🎂 | Person Name, Age, Date |
| Engagement | 💍 | Partner 1, Partner 2, Parent 1, Parent 2, Mother, Father, Date |
| Valakaappu | 🌺 | Mother Name, Father Name, Date |
| Housewarming | 🏠 | Host Name, Spouse Name, Date |
| Custom | 🎉 | Custom Title, Date |

### Gift Types Supported
- **Cash** (₹) — with amount + payment mode (Cash / UPI / Card / Cheque)
- **Gold** — with weight in grams
- **Gift** — with description

---

## 2. User Roles & Access

### Regular User (role: `user`)
- Can register / login
- Can create events
- Can view only their own events in dashboard
- Can add moi entries to their own events
- Can export CSV / PDF for their own events
- Can add photos to their own events

### Admin (role: `admin`)
- All regular user permissions
- Can view ALL events in the system
- Can manage feature toggles (enable/disable features)
- Can manage multi-organizer assignments
- Can delete any moi entry

### Guest (no auth required)
- Can browse public events at `/events`
- Can view event details at `/e/[slug]`
- Can submit moi entries via public form
- Can share event links

---

## 3. Core Features

### 3.1 Authentication
- **Register:** `/register` — Name, Email, Password, Phone (optional)
- **Login:** `/login` — Email, Password
- **Session:** JWT token stored in `localStorage` as `moi_token`
- **Profile Update:** Dashboard → Settings → Update profile fields

### 3.2 Event Management
- **Create Event:** Dashboard → "New Event" button → Select type → Fill fields → Upload cover photo (optional)
- **Edit Event:** Dashboard → Events module → Click edit icon on event card
- **Delete Event:** Dashboard → Events module → Click delete → Confirm
- **Cover Photo:** Upload via event creation/edit or dedicated upload endpoint (max 10MB, JPG/PNG/WEBP)

### 3.3 Moi Entry (Gift Recording)
**Public Flow (Guest):**
1. Browse `/events` → Click event card → View event details
2. Click "Give Moi Now" → Fill form (Name, Gift Type, Amount/Weight/Description, Relation, Payment Mode, Note)
3. Submit → See Thank You page with WhatsApp share + QR code (if UPI selected)

**Admin Flow (Dashboard):**
1. Dashboard → Events → Click event → View moi entries table
2. Can add entries manually, edit, or delete
3. Can export CSV or generate PDF report

### 3.4 PDF Export + Email
- **Endpoint:** `GET /api/pdf.php?event_id=X`
- Generates styled HTML report with:
  - Event header (type, names, date, venue)
  - Moi entries table (#, Guest, Type, Amount, Relation, Payment Mode, Note, Date)
  - Summary stats (Total guests, Total cash, Total gold, Other gifts)
  - Footer with timestamp
- **Email:** Sends report link to organizer's email via PHP `mail()`
- **Frontend Button:** "Send PDF via Email" in dashboard event tables

### 3.5 CSV Export
- **Endpoint:** `GET /api/export.php?event_id=X&format=csv`
- Downloads UTF-8 BOM encoded CSV with columns: #, Guest Name, Amount, Relation, Payment Mode, Note, Date
- Includes total row at bottom

### 3.6 Photo Gallery
- **Upload:** Dashboard → Event detail → Upload photos (max 10MB, JPG/PNG/WEBP/GIF)
- **Public View:** Photos displayed in grid on public event page
- **Delete:** Organizer can delete photos

### 3.7 Bulk Import (Digitized Moi Notes)
- **Access:** Dashboard → "Import" button (if `bulk_import` feature enabled)
- **CSV Upload:** Upload CSV file with columns: guest_name, amount, gift_type, relation, payment_mode, note, original_date
- **Manual Entry:** Add single digitized entry with original date picker
- All imported entries marked as `is_digitized = 1`

### 3.8 Multi-Organizer Support
- **Access:** Dashboard → Organizers module (if `multi_organizer` feature enabled)
- **Add Organizer:** Enter email of existing user → Assign role (organizer/admin)
- **Remove Organizer:** Click remove icon
- Organizers can access and manage the same event

### 3.9 Feature Toggles
- **Access:** Dashboard → Features module (admin only)
- Toggle features on/off: `bulk_import`, `multi_organizer`, etc.
- Changes take effect immediately in UI

### 3.10 WhatsApp Sharing
- Public event pages have WhatsApp share button
- Pre-filled message: `[Bride/Groom] Wedding — Give Moi here: [URL]`
- Also supports native share API and copy-to-clipboard

### 3.11 UPI QR Code
- After moi entry submission (if payment_mode = UPI), QR code displayed
- QR contains: `upi://pay?pa=[UPI_ID]&pn=[Name]&cu=INR`
- Generated via `api.qrserver.com`
- Shows UPI ID text + "Open UPI App" button

### 3.12 Venue Map Integration
- Google Maps link on event detail page
- Inline map component below venue address

---

## 4. Testing Scenarios

### 4.1 Authentication Tests

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 1 | Register new user | Fill name, email, password → Submit | Success, redirect to dashboard, token stored |
| 2 | Register with existing email | Use same email again | Error: "Email already registered" |
| 3 | Login with valid credentials | Enter correct email/password | Success, redirect to dashboard |
| 4 | Login with invalid credentials | Wrong password | Error: "Invalid email or password" |
| 5 | Logout | Click logout in navbar | Redirect to home, token cleared |
| 6 | Session persistence | Close browser, reopen | User remains logged in (localStorage) |
| 7 | Access dashboard without login | Go to `/dashboard` directly | Redirect to `/login` |

### 4.2 Event Creation Tests

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 8 | Create wedding event | Select Wedding → Fill Bride/Groom/Date/Venue → Submit | Event created, appears in dashboard |
| 9 | Create birthday event | Select Birthday → Fill Person Name/Age/Date → Submit | Event created with 🎂 icon |
| 10 | Create event with cover photo | Select file → Create event | Cover photo uploaded and displayed |
| 11 | Create event with invalid type | Try to submit without required fields | Error message shown |
| 12 | Create engagement event | Select Engagement → Fill all parent names → Submit | Event created |
| 13 | Edit event | Click edit → Change fields → Save | Changes reflected in UI |
| 14 | Delete event | Click delete → Confirm | Event removed from list |

### 4.3 Public Event Browsing Tests

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 15 | Browse events | Go to `/events` | Grid of event cards displayed |
| 16 | Search events | Type in search box | Filtered results in real-time |
| 17 | Filter upcoming/past | Click filter tabs | Correct events shown |
| 18 | Pagination | Click page numbers | Correct page of events shown |
| 19 | View event detail | Click event card | Full event page with details |
| 20 | Share event | Click WhatsApp icon | WhatsApp opens with pre-filled message |
| 21 | Copy link | Click copy link | Link copied to clipboard, "Copied!" shown |
| 22 | View photos | Event has photos | Photo grid displayed |
| 23 | Open map | Click venue map link | Google Maps opens with venue |

### 4.4 Moi Entry (Guest) Tests

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 24 | Submit cash moi | Fill form → Cash → Amount → Payment mode → Submit | Thank you page shown |
| 25 | Submit gold moi | Select Gold → Enter weight → Submit | Thank you page shown |
| 26 | Submit gift moi | Select Gift → Enter description → Submit | Thank you page shown |
| 27 | UPI payment with QR | Select UPI → Submit | QR code displayed on success page |
| 28 | WhatsApp share after entry | Click WhatsApp on success page | Pre-filled message with event details |
| 29 | Invalid form submission | Submit without name | Error: "Please enter your name" |
| 30 | Preset amount selection | Click ₹101, ₹201, etc. | Amount field populated |

### 4.5 Dashboard Tests

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 31 | Dashboard stats | View dashboard | Shows total moi, events count, breakdown |
| 32 | Navigate modules | Click sidebar items | Correct module content shown |
| 33 | Events module | View events table | All user events listed with search |
| 34 | Payments module | View payments | All moi entries with filters |
| 35 | Analytics module | View analytics | Charts/stats displayed |
| 36 | Users module | View users | Guest list shown |
| 37 | Settings module | Update profile | Changes saved |
| 38 | Feature toggles (admin) | Toggle features | UI updates immediately |
| 39 | Organizers module (admin) | Add/remove organizers | Changes reflected |

### 4.6 Export Tests

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 40 | CSV export | Click export CSV | CSV file downloaded with correct data |
| 41 | PDF email | Click "Send PDF via Email" | Email sent to organizer, success toast |
| 42 | PDF download | Open PDF link | HTML report displayed, printable |

### 4.7 Bulk Import Tests

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 43 | CSV import | Upload valid CSV | Entries imported, count shown |
| 44 | CSV with errors | Upload CSV with invalid rows | Errors listed, valid rows imported |
| 45 | Manual digitized entry | Fill form → Submit | Entry created with `is_digitized=1` |

### 4.8 Multi-Organizer Tests

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 46 | Add organizer | Enter email of existing user | Organizer added, can access event |
| 47 | Add non-existent user | Enter unregistered email | Error: "User not found" |
| 48 | Add duplicate organizer | Add same user again | Error: "Already an organizer" |
| 49 | Remove organizer | Click remove | Organizer removed |

---

## 5. API Endpoints Reference

### Base URL
- Development: `/api/*` (proxied to PHP backend)
- Production: `https://[domain]/api/*`

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth.php?action=register` | No | Register new user |
| POST | `/auth.php?action=login` | No | Login |
| GET | `/auth.php?action=me` | Yes | Get current user |
| PUT | `/auth.php?action=profile` | Yes | Update profile |

### Events
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/events.php?public=1` | No | List all public events |
| GET | `/events.php?slug={slug}` | No | Get single event by slug |
| GET | `/events.php` | Yes | List user's events (admin: all) |
| POST | `/events.php` | Yes | Create event |
| PUT | `/events.php?id={id}` | Yes | Update event |
| DELETE | `/events.php?id={id}` | Yes | Delete event |
| POST | `/events.php?action=cover` | Yes | Upload cover photo |

### Moi Entries
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/moi.php?event_id={id}` | Yes | List moi entries for event |
| POST | `/moi.php` | Public/Yes | Add moi entry (public via slug, admin via event_id) |
| DELETE | `/moi.php?id={id}` | Yes | Delete moi entry |

### Photos
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/photos.php?event_id={id}` | No | List photos for event |
| POST | `/photos.php` | Yes | Upload photo |
| DELETE | `/photos.php?id={id}` | Yes | Delete photo |

### PDF & Export
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/pdf.php?event_id={id}` | Yes | Generate PDF report + email |
| GET | `/pdf.php?event_id={id}&action=download` | Yes | Download PDF HTML |
| GET | `/export.php?event_id={id}&format=csv` | Yes | Export CSV |

### Bulk Import
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/bulk-import.php?action=csv` | Yes | Import CSV file |
| POST | `/bulk-import.php?action=add` | Yes | Add single digitized entry |

### Organizers
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/organizers.php?event_id={id}` | Yes | List organizers |
| POST | `/organizers.php?action=add` | Yes | Add organizer |
| DELETE | `/organizers.php?id={id}` | Yes | Remove organizer |

### Features
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/features.php` | Yes | List feature toggles |
| PUT | `/features.php` | Admin | Update feature toggle |

---

## 6. Database Schema Overview

### Tables

#### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | User ID |
| name | VARCHAR(100) | Full name |
| email | VARCHAR(150) | Email (unique) |
| password | VARCHAR(255) | Bcrypt hash |
| phone | VARCHAR(20) | Phone number |
| upi_id | VARCHAR(100) | UPI ID for payments |
| bank_name | VARCHAR(100) | Bank name |
| account_number | VARCHAR(50) | Account number |
| ifsc_code | VARCHAR(20) | IFSC code |
| account_holder | VARCHAR(100) | Account holder name |
| role | ENUM('admin','user') | User role |
| created_at | TIMESTAMP | Registration date |

#### `events`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Event ID |
| user_id | INT (FK) | Creator user ID |
| slug | VARCHAR(100) | URL slug (unique) |
| event_type | ENUM | wedding/birthday/engagement/valakaappu/housewarming/custom |
| custom_title | VARCHAR(100) | Title for custom events |
| bride_name | VARCHAR(100) | Bride/Partner 1 name |
| groom_name | VARCHAR(100) | Groom/Partner 2 name |
| birthday_person_name | VARCHAR(100) | Birthday person |
| birthday_person_age | INT | Age |
| parent1_name | VARCHAR(100) | Parent 1 (engagement) |
| parent2_name | VARCHAR(100) | Parent 2 (engagement) |
| mother_name | VARCHAR(100) | Mother name |
| father_name | VARCHAR(100) | Father name |
| host_name | VARCHAR(100) | Host (housewarming) |
| spouse_name | VARCHAR(100) | Spouse (housewarming) |
| wedding_date | DATE | Event date |
| venue | VARCHAR(255) | Venue name |
| venue_latitude | DECIMAL | Map coordinates |
| venue_longitude | DECIMAL | Map coordinates |
| cover_photo | VARCHAR(500) | Cover photo URL |
| description | TEXT | Event description |
| is_active | TINYINT(1) | Soft delete flag |
| created_at | TIMESTAMP | Creation date |

#### `moi_entries`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Entry ID |
| event_id | INT (FK) | Event ID |
| guest_name | VARCHAR(100) | Guest name |
| city | VARCHAR(150) | Guest city (optional) |
| amount | DECIMAL(10,2) | Amount in ₹ |
| gift_type | ENUM | cash/gold/gift |
| gold_weight | DECIMAL(10,2) | Weight in grams (gold) |
| gift_description | VARCHAR(255) | Gift description |
| relation | ENUM | family/friend/colleague/other |
| payment_mode | ENUM | cash/upi/card/cheque |
| note | TEXT | Optional note |
| entered_by | VARCHAR(100) | Who entered this |
| created_at | TIMESTAMP | Entry date |

#### `photos`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Photo ID |
| event_id | INT (FK) | Event ID |
| s3_key | VARCHAR(500) | File path |
| s3_url | VARCHAR(500) | Public URL |
| caption | VARCHAR(255) | Photo caption |
| uploaded_at | TIMESTAMP | Upload date |

#### `event_organizers`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Assignment ID |
| event_id | INT (FK) | Event ID |
| user_id | INT (FK) | User ID |
| role | ENUM | organizer/admin |
| added_at | TIMESTAMP | Assignment date |

#### `feature_toggles`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Toggle ID |
| feature_key | VARCHAR(100) | Feature identifier (unique) |
| is_enabled | TINYINT(1) | 1=enabled, 0=disabled |
| description | TEXT | Feature description |
| updated_at | TIMESTAMP | Last updated |
| updated_by | INT (FK) | Admin who updated |

#### `password_resets`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Token ID |
| email | VARCHAR(150) | User email |
| token | VARCHAR(255) | Reset token |
| expires_at | TIMESTAMP | Expiry time |
| created_at | TIMESTAMP | Creation time |

---

## 7. Edge Cases & Known Limitations

### 7.1 Known Limitations
1. **PDF is HTML-based, not true PDF** — Uses browser print-to-PDF. The `pdf.php` endpoint returns styled HTML with a print button. Users must use browser's "Save as PDF" or print function.
2. **Email delivery depends on server config** — Uses PHP `mail()`. On local/dev environments, emails may not actually send. Check spam folder.
3. **UPI QR is static** — QR code is generated via external API (`api.qrserver.com`). No actual payment verification happens.
4. **No payment gateway integration** — UPI is just a QR code display. No real-time payment confirmation.
5. **No password reset flow** — `password_resets` table exists but no UI/endpoint implemented yet.
6. **Event type switching** — Changing event type after creation may cause validation issues if required fields don't match new type.
7. **CSV import column order** — Must match exact order: guest_name, amount, gift_type, relation, payment_mode, note, original_date
8. **File uploads stored locally** — Photos and covers stored in `/uploads/` directory, not S3 (despite `s3_key` column naming).

### 7.2 Edge Cases to Test
1. **Very long names** — Test with 100+ character names in all name fields
2. **Special characters** — Test with Tamil, emoji, and special chars in names/notes
3. **Large file uploads** — Test with exactly 10MB file (should succeed), 10.1MB (should fail)
4. **Concurrent edits** — Two organizers editing same event simultaneously
5. **Empty states** — Events with no moi entries, no photos, no description
6. **Past events** — Events with dates in the past (should show "Completed" badge)
7. **Today's event** — Event date = today (should show "🎉 Today!" badge)
8. **Event within 7 days** — Should show "Xd left" badge
9. **Deleted events** — Soft-deleted events should not appear in public listing
10. **Invalid slugs** — Access `/e/nonexistent-slug` → Should show "Event not found"
11. **Token expiry** — JWT tokens may expire; test re-login flow
12. **Mobile menu** — Test hamburger menu on mobile viewports
13. **Offline behavior** — What happens when API is unreachable?
14. **Browser back button** — After submitting moi entry, test back navigation
15. **Multiple gift types** — Submit multiple entries of different types for same event

---

## 8. Mobile vs Desktop Checklist

### Desktop (≥1024px)
- [ ] Sidebar navigation visible
- [ ] Event cards in 4-column grid
- [ ] Share panel visible on event detail page
- [ ] "Give Moi Now" card visible in right sidebar
- [ ] Full event detail layout (6-col grid)

### Tablet (768px - 1023px)
- [ ] Hamburger menu appears
- [ ] Event cards in 2-3 column grid
- [ ] Sidebar becomes overlay drawer
- [ ] Mobile share bar appears at top of event page

### Mobile (<768px)
- [ ] Single column event cards
- [ ] Sticky bottom "Give Moi" bar on event page
- [ ] Mobile top bar with back button on event page
- [ ] Simplified navigation (hamburger menu)
- [ ] Form inputs full-width
- [ ] Buttons large enough for touch (min 44px height)
- [ ] Pagination controls wrap properly

### Responsive Elements to Verify
- [ ] Navbar collapses correctly
- [ ] Dashboard sidebar becomes drawer
- [ ] Event detail page stacks vertically
- [ ] Photo grid adjusts columns
- [ ] Tables scroll horizontally if needed
- [ ] Modals fit within viewport
- [ ] Font sizes readable on small screens

---

## Quick Start for Testers

### Prerequisites
1. Access to deployed application or local dev environment
2. Test user account (or create one via `/register`)
3. Admin account for full feature testing

### Test Data Setup
1. Create 2-3 events of different types (Wedding, Birthday, Engagement)
2. Add 5-10 moi entries per event with mixed gift types
3. Upload 2-3 cover photos and gallery photos
4. Create a second test user for multi-organizer testing

### Critical Paths to Test First
1. **Guest flow:** Browse → View Event → Submit Moi → Share
2. **Organizer flow:** Login → Create Event → Add Moi → Export PDF
3. **Admin flow:** Login → View all events → Manage organizers → Toggle features

---

## Contact & Support
For bugs or questions, refer to the development team or check the project repository.
