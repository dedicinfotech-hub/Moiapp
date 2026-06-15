# MoiApp E2E Test Cases

## Test Environment Setup
- Base URL: `http://localhost:3000` (dev) or production URL
- API Base: `http://localhost:8888/MoiApp/api`
- Test Users:
  - Host: `+919876543210` (OTP: 123456)
  - Admin: `admin@moiapp.com` (OTP sent to email)
  - Guest: No account required (uses token-based access)

---

## 1. HOST PANEL FLOW

### 1.1 Login Flow
**Test Case:** HOST-LOGIN-001
- **Precondition:** User has phone number registered
- **Steps:**
  1. Navigate to `/login`
  2. Enter phone number `9876543210`
  3. Click "Send OTP"
  4. Enter OTP `123456`
  5. Click "Verify OTP"
- **Expected Result:**
  - OTP sent successfully message shown
  - OTP input screen appears
  - After verification, redirects to `/profile-setup` (new user) or `/dashboard` (existing user)
  - Token stored in localStorage

**Test Case:** HOST-LOGIN-002
- **Precondition:** User has email/password account
- **Steps:**
  1. Navigate to `/login`
  2. Click "Email" tab
  3. Enter email and password
  4. Click "Login"
- **Expected Result:**
  - Redirects to dashboard on success
  - Error shown for invalid credentials

### 1.2 Profile Setup
**Test Case:** HOST-PROFILE-001
- **Precondition:** New user just verified OTP
- **Steps:**
  1. Enter full name "Arun Kumar"
  2. Enter city "Coimbatore"
  3. Select language "Tamil"
  4. Click "Save & Continue"
- **Expected Result:**
  - Profile saved successfully
  - Redirects to `/events/choose-type`

### 1.3 Dashboard
**Test Case:** HOST-DASH-001
- **Precondition:** User is logged in
- **Steps:**
  1. Navigate to `/dashboard`
- **Expected Result:**
  - Summary cards visible: Total Functions, Total Moi, Pending Returns, Contributors
  - Quick actions visible: Moi Entry, Moi List, QR Code, Pending Approvals, Reports
  - "Create New Function" button visible
  - Bottom navigation works
  - Recent functions list shows past events with red badge

### 1.4 Create Function - New Event
**Test Case:** HOST-CREATE-001
- **Precondition:** User on dashboard
- **Steps:**
  1. Click "Create New Function"
  2. Select "New Event"
  3. Select event type "Wedding"
  4. Enter bride name "Priya" and groom name "Rahul"
  5. Select future date
  6. Enter venue "Grand Hall" and city "Chennai"
  7. Click "Continue"
  8. Review auto-generated name "Wedding - 15 Jan 2025"
  9. Click "Create Function"
- **Expected Result:**
  - Function created with status "Pending Approval"
  - Redirects to `/events/{slug}/pending`
  - Approval message shown: "Approval usually within 24 hours"

### 1.5 Create Function - Past Event
**Test Case:** HOST-CREATE-002
- **Precondition:** User on choose-type page
- **Steps:**
  1. Select "Past Event"
  2. Select event type "Birthday"
  3. Enter birthday person name "Kumar"
  4. Select past date
  5. Click "Create Function"
- **Expected Result:**
  - Function created with status "Approved" (auto-approved)
  - Redirects directly to event dashboard
  - No QR code generated
  - Past Event badge shown on card

### 1.6 Pending Approval Screen
**Test Case:** HOST-PENDING-001
- **Precondition:** New event created, awaiting approval
- **Steps:**
  1. View pending screen
- **Expected Result:**
  - Shows "Pending Approval" status
  - Shows "Approval usually within 24 hours"
  - Shows rejection reason if rejected
  - Edit button available to resubmit

### 1.7 Moi Entry
**Test Case:** HOST-MOI-001
- **Precondition:** Approved event exists
- **Steps:**
  1. Navigate to event dashboard
  2. Click "Moi Entry"
  3. Enter guest name "John Doe"
  4. Select payment method "Cash"
  5. Enter amount "5000"
  6. Click "Save Entry"
- **Expected Result:**
  - Entry saved successfully
  - Redirects back to moi entry or shows success
  - Entry appears in Moi List immediately
  - Dashboard total updates

**Test Case:** HOST-MOI-002
- **Precondition:** Approved event exists
- **Steps:**
  1. Navigate to Moi Entry
  2. Select payment method "Gold"
  3. Enter item name "Gold Chain"
  4. Enter weight "10"
  5. Enter approximate value "50000"
  6. Save entry
- **Expected Result:**
  - Redirects to gift entry page
  - Gold entry saved with weight

### 1.8 Moi List
**Test Case:** HOST-LIST-001
- **Precondition:** Event has multiple moi entries
- **Steps:**
  1. Navigate to Moi List
  2. Search by guest name
  3. Filter by "Cash"
  4. Sort by "High to Low"
  5. Filter by relation "Family"
  6. Click "Load More"
- **Expected Result:**
  - Search filters entries by name
  - Filter shows only cash entries
  - Sort orders by amount descending
  - Relation filter works
  - Load More loads 20 more entries

**Test Case:** HOST-LIST-002
- **Precondition:** Entry exists in list
- **Steps:**
  1. Click "Actions" on an entry
  2. Click "Edit"
  3. Modify amount
  4. Save
  5. Click "Actions" again
  6. Click "Delete"
  7. Confirm deletion
- **Expected Result:**
  - Edit opens moi entry form with pre-filled data
  - Delete shows confirmation
  - Entry removed from list after confirmation

### 1.9 QR Code
**Test Case:** HOST-QR-001
- **Precondition:** Approved new event exists
- **Steps:**
  1. Navigate to QR Code page
  2. View QR code
  3. Click "Download QR"
  4. Click "Print QR"
  5. Click "Copy" on payment link
  6. Click "Share Link"
- **Expected Result:**
  - QR code displayed
  - Download saves PNG
  - Print opens print dialog
  - Link copied to clipboard
  - Share dialog opens

**Test Case:** HOST-QR-002
- **Precondition:** QR code is active
- **Steps:**
  1. Click "Regenerate QR Code"
  2. Confirm dialog
  3. Click "Deactivate QR & Link"
  4. Confirm dialog
- **Expected Result:**
  - New QR code generated with new token
  - Old QR/URL stops working
  - QR deactivated, guests cannot pay

### 1.10 Reports
**Test Case:** HOST-REPORT-001
- **Precondition:** Event has moi entries
- **Steps:**
  1. Navigate to Reports
  2. View summary cards
  3. Filter by date range
  4. Click "Export PDF"
  5. Click "Export Excel"
- **Expected Result:**
  - Summary shows correct totals
  - Date filter works
  - PDF downloads
  - Excel CSV downloads

### 1.11 Invitations
**Test Case:** HOST-INVITE-001
- **Precondition:** Event exists
- **Steps:**
  1. Navigate to Invitations tab
  2. Upload CSV with columns: name, phone, relation, city
  3. View uploaded invitations
  4. Check auto-matching with moi entries
- **Expected Result:**
  - CSV uploaded successfully
  - Invitations listed
  - Matching status shown (Invited/Came/Gave Moi/No Show)
  - Mismatch alerts shown for discrepancies

### 1.12 Settings
**Test Case:** HOST-SETTINGS-001
- **Precondition:** User on settings page
- **Steps:**
  1. Edit name and city
  2. Toggle notifications
  3. Change language to Tamil
  4. Change font size to Large
  5. Click "Delete Account"
  6. Confirm deletion
- **Expected Result:**
  - Profile updated
  - Notification toggles saved
  - Language changes UI (where implemented)
  - Font size changes text size
  - Account scheduled for deletion (30-day grace)
  - Logout after deletion

---

## 2. GUEST PANEL FLOW

### 2.1 Guest Payment Form
**Test Case:** GUEST-FORM-001
- **Precondition:** Valid guest token exists
- **Steps:**
  1. Navigate to `/g/{token}/form`
  2. Verify event details shown
  3. Enter name "Guest User"
  4. Enter phone "9876543210"
  5. Enter city "Mumbai"
  6. Select relation "Friend"
  7. Enter company "TCS"
  8. Enter occupation "Engineer"
  9. Select gift type "Cash"
  10. Enter amount "3000"
  11. Click "Continue to Payment"
- **Expected Result:**
  - Form validates required fields
  - Data persisted to sessionStorage
  - Redirects to payment page

**Test Case:** GUEST-FORM-002
- **Precondition:** Already submitted for this token
- **Steps:**
  1. Navigate to `/g/{token}/form` again
- **Expected Result:**
  - Error message: "You have already submitted a contribution"
  - Cannot resubmit

### 2.2 Payment Method
**Test Case:** GUEST-PAY-001
- **Precondition:** Guest form submitted
- **Steps:**
  1. View payment methods
  2. Select "GPay"
  3. Click "Pay"
- **Expected Result:**
  - GPay selected
  - Payment processes
  - Redirects to success page

**Test Case:** GUEST-PAY-002
- **Precondition:** Guest form submitted with Gold
- **Steps:**
  1. Select "Gold"
  2. Click "Pay"
- **Expected Result:**
  - Redirects to gift entry page

### 2.3 Payment Success
**Test Case:** GUEST-SUCCESS-001
- **Precondition:** Payment completed
- **Steps:**
  1. View success page
- **Expected Result:**
  - Shows "Your moi has been recorded"
  - Shows correct amount from form
  - Shows payment method used

### 2.4 Receipt
**Test Case:** GUEST-RECEIPT-001
- **Precondition:** Payment successful
- **Steps:**
  1. View receipt
  2. Click "Download Receipt"
- **Expected Result:**
  - Receipt shows guest name, amount, event details
  - Download works

### 2.5 Expired/Invalid Link
**Test Case:** GUEST-EXPIRED-001
- **Precondition:** Token is invalid/expired
- **Steps:**
  1. Navigate to `/g/{invalid-token}/form`
- **Expected Result:**
  - Redirects to expired page
  - Shows "This is a private event. You need an invitation"
  - Shows "Request New Link" button

**Test Case:** GUEST-EXPIRED-002
- **Precondition:** Event QR deactivated
- **Steps:**
  1. Navigate to `/g/{deactivated-token}/form`
- **Expected Result:**
  - Redirects to expired page
  - Shows "Event is no longer accepting moi"

---

## 3. ADMIN PANEL FLOW

### 3.1 Admin Login
**Test Case:** ADMIN-LOGIN-001
- **Precondition:** Admin account exists
- **Steps:**
  1. Navigate to `/admin`
  2. Enter admin email and password
  3. Enter OTP from email
  4. Click "Login"
- **Expected Result:**
  - OTP sent to admin email
  - Login successful with OTP
  - Redirects to admin dashboard

**Test Case:** ADMIN-LOGIN-002
- **Precondition:** Admin account exists
- **Steps:**
  1. Enter wrong password 3 times
- **Expected Result:**
  - Account locked for 1 hour after 3 failed attempts

### 3.2 Admin Dashboard
**Test Case:** ADMIN-DASH-001
- **Precondition:** Admin logged in
- **Steps:**
  1. View admin dashboard
- **Expected Result:**
  - Shows: Total Users, New Today, Active Today, Total Functions, Revenue, Open Tickets, Pending Approvals, Active Private Events
  - All stats load correctly

### 3.3 Approve/Reject Events
**Test Case:** ADMIN-APPROVE-001
- **Precondition:** New event pending approval
- **Steps:**
  1. Navigate to Approvals
  2. Click "Approve" on pending event
- **Expected Result:**
  - Event approved
  - QR code auto-generated
  - Host receives notification

**Test Case:** ADMIN-APPROVE-002
- **Precondition:** New event pending approval
- **Steps:**
  1. Click "Reject"
  2. Enter reason "Incomplete details"
  3. Submit
- **Expected Result:**
  - Event rejected
  - Host sees rejection reason
  - Host can edit and resubmit

### 3.4 Private Events Monitoring
**Test Case:** ADMIN-PRIVATE-001
- **Precondition:** Active private events exist
- **Steps:**
  1. Navigate to Private Events
  2. View event list
  3. Search by host name
  4. Click "Deactivate QR" on an event
- **Expected Result:**
  - All active private events listed
  - Search filters correctly
  - QR deactivated, guests cannot pay

### 3.5 User Management
**Test Case:** ADMIN-USERS-001
- **Precondition:** Users exist
- **Steps:**
  1. Navigate to Users
  2. Search by name
  3. Filter by "Active"
  4. Block a user
  5. Delete a user
- **Expected Result:**
  - Search works
  - Filter works
  - User blocked (cannot login)
  - User deleted (data removed)

### 3.6 Analytics
**Test Case:** ADMIN-ANALYTICS-001
- **Precondition:** Data exists
- **Steps:**
  1. Navigate to Analytics
  2. View user growth
  3. View top cities
  4. View Free vs Premium ratio
  5. Export CSV
- **Expected Result:**
  - All charts display correctly
  - Premium ratio shows correct numbers
  - CSV export works

### 3.7 Support Tickets
**Test Case:** ADMIN-SUPPORT-001
- **Precondition:** Tickets exist
- **Steps:**
  1. Navigate to Support
  2. View open tickets
  3. Mark ticket as resolved
  4. Archive old tickets (30+ days)
- **Expected Result:**
  - Open tickets shown
  - Resolved tickets moved to resolved list
  - Old tickets archived after 30 days

---

## 4. API TEST CASES

### 4.1 Auth API
| Endpoint | Method | Test Case | Expected |
|----------|--------|-----------|----------|
| `/auth.php?action=send-otp` | POST | Valid 10-digit phone | 200, OTP sent |
| `/auth.php?action=send-otp` | POST | Invalid phone format | 400, error |
| `/auth.php?action=verify-otp` | POST | Valid OTP | 200, token returned |
| `/auth.php?action=verify-otp` | POST | Wrong OTP 3x | 429, blocked |
| `/auth.php?action=login` | POST | Valid email/password | 200, token returned |
| `/auth.php?action=login` | POST | Admin without OTP | 200, requires_otp |
| `/auth.php?action=account` | DELETE | Valid token | 200, deleted_at set |
| `/auth.php?action=restore-account` | POST | Within grace period | 200, restored |

### 4.2 Events API
| Endpoint | Method | Test Case | Expected |
|----------|--------|-----------|----------|
| `/events.php` | GET | List user events | 200, events array |
| `/events.php?slug={slug}` | GET | Get event by slug | 200, event data |
| `/events.php?guest_token={token}` | GET | Valid token | 200, event data |
| `/events.php?guest_token={token}` | GET | Invalid token | 404, private_event error |
| `/events.php` | POST | Create new event | 201, event created |
| `/events.php?id={id}&action=approve` | PUT | Approve event | 200, status updated |
| `/events.php?id={id}&action=regenerate-qr` | PUT | Regenerate QR | 200, new token |
| `/events.php?id={id}&action=close-qr` | PUT | Close QR | 200, qr_enabled=0 |

### 4.3 Moi API
| Endpoint | Method | Test Case | Expected |
|----------|--------|-----------|----------|
| `/moi.php?event_id={id}` | GET | List entries | 200, entries array |
| `/moi.php` | POST | Add entry | 201, entry created |
| `/moi.php?id={id}` | PUT | Update entry | 200, updated |
| `/moi.php?id={id}` | DELETE | Delete entry | 200, deleted |
| `/offline-sync.php` | POST | Sync batch | 200, synced count |

### 4.4 Notifications API
| Endpoint | Method | Test Case | Expected |
|----------|--------|-----------|----------|
| `/notifications.php` | GET | List notifications | 200, list + unread_count |
| `/notifications.php` | POST | Create notification | 201, created |
| `/notifications.php` | PUT | Mark read | 200, updated |
| `/notifications.php` | DELETE | Delete | 200, deleted |

### 4.5 Admin API
| Endpoint | Method | Test Case | Expected |
|----------|--------|-----------|----------|
| `/admin.php?action=stats` | GET | Admin stats | 200, stats object |
| `/admin.php?action=private-events` | GET | Private events | 200, events array |
| `/admin.php?action=deactivate-event&id={id}` | PUT | Deactivate | 200, updated |
| `/admin.php?action=users` | GET | List users | 200, users array |
| `/admin.php?action=block-user` | POST | Block user | 200, blocked |
| `/admin.php?action=analytics` | GET | Analytics | 200, analytics data |

### 4.6 Invitations API
| Endpoint | Method | Test Case | Expected |
|----------|--------|-----------|----------|
| `/invitations.php?action=list&event_id={id}` | GET | List invites | 200, invitations |
| `/invitations.php?action=csv` | POST | Upload CSV | 200, count |
| `/invitations.php?action=update` | PUT | Update status | 200, updated |

### 4.7 PDF API
| Endpoint | Method | Test Case | Expected |
|----------|--------|-----------|----------|
| `/pdf.php?event_id={id}` | GET | Generate PDF | 200, PDF data |
| `/pdf.php?event_id={id}&action=download` | GET | Download | 200, HTML report |

---

## 5. CROSS-BROWSER COMPATIBILITY

### 5.1 Browser Matrix
| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Supported |
| Firefox | Latest | ✅ Supported |
| Safari | 14+ | ✅ Supported |
| Edge | Latest | ✅ Supported |
| Mobile Chrome | Latest | ✅ Supported |
| Mobile Safari | 14+ | ✅ Supported |

### 5.2 Feature Support
| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Speech Recognition | ✅ | ✅ | ✅ | ✅ |
| Web Share API | ✅ | ❌ | ✅ | ✅ |
| Clipboard API | ✅ | ✅ | ✅ | ✅ |
| MediaDevices (mic) | ✅ | ✅ | ✅ | ✅ |
| SessionStorage | ✅ | ✅ | ✅ | ✅ |

---

## 6. PERFORMANCE TEST CASES

### 6.1 Load Time
| Page | Target | Actual |
|------|--------|--------|
| Dashboard | < 2s | TBD |
| Moi List (100 entries) | < 3s | TBD |
| Reports | < 2s | TBD |
| QR Code | < 1s | TBD |

### 6.2 API Response Time
| Endpoint | Target | Actual |
|----------|--------|--------|
| GET /events.php | < 500ms | TBD |
| POST /moi.php | < 1s | TBD |
| GET /notifications.php | < 300ms | TBD |

---

## 7. SECURITY TEST CASES

### 7.1 Authentication
- [ ] Token expires after 7 days
- [ ] Deleted account cannot login
- [ ] Wrong OTP 3x blocks for 10 minutes
- [ ] Admin login requires OTP

### 7.2 Authorization
- [ ] User cannot access other user's events
- [ ] Guest cannot access admin routes
- [ ] Non-admin cannot approve events
- [ ] Deactivated QR returns 404

### 7.3 Data Validation
- [ ] SQL injection prevented (prepared statements)
- [ ] XSS prevented (output escaping)
- [ ] CSRF tokens where applicable
- [ ] File upload type/size validation

---

## 8. MOBILE RESPONSIVENESS

### 8.1 Screen Sizes
| Device | Width | Status |
|--------|-------|--------|
| iPhone SE | 375px | ✅ Tested |
| iPhone 12 | 390px | ✅ Tested |
| iPhone 14 Pro Max | 430px | ✅ Tested |
| iPad | 768px | ✅ Tested |
| Desktop | 1024px+ | ✅ Tested |

### 8.2 Touch Targets
- [ ] All buttons minimum 44x44px
- [ ] Form inputs easily tappable
- [ ] No horizontal scroll on mobile
- [ ] Bottom nav accessible

---

## 9. ACCESSIBILITY

### 9.1 WCAG Compliance
- [ ] Color contrast ratio >= 4.5:1
- [ ] Focus indicators visible
- [ ] Form labels associated
- [ ] Error messages announced
- [ ] Semantic HTML used

---

## 10. EDGE CASES

### 10.1 Data Edge Cases
- [ ] Empty event (no entries)
- [ ] Very long guest names (100+ chars)
- [ ] Special characters in names
- [ ] Zero amount entries
- [ ] Past events with future dates (blocked)
- [ ] New events with past dates (blocked)

### 10.2 Network Edge Cases
- [ ] Offline mode (entries queued)
- [ ] Slow network (loading states)
- [ ] API timeout handling
- [ ] Retry on failure

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Database seeded with test data
- [ ] Test users created
- [ ] Admin account configured
- [ ] Email service configured (or mock)
- [ ] SMS service configured (or mock)

### Test Run
- [ ] All Host flow tests pass
- [ ] All Guest flow tests pass
- [ ] All Admin flow tests pass
- [ ] All API tests pass
- [ ] Cross-browser tests pass
- [ ] Mobile responsiveness verified
- [ ] Performance benchmarks met
- [ ] Security tests pass

### Post-Test
- [ ] Test data cleaned up
- [ ] Bugs logged with severity
- [ ] Test report generated
