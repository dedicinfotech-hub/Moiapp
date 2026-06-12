# MoiApp - Product Feedback Tracker Summary

## Overview
This document summarizes the product feedback tracker for MoiApp, a function/event moi (gift) management application.

---

## 1. Feedback Items (Test Cases)

| Date | ID | Type | Category | Page/Feature | Issue/Feedback Summary | Status | Assign To |
|------|-----|------|----------|--------------|------------------------|--------|-----------|
| - | TC_01 | Pass | User login | Login page | Can't find profile indication under user icon | In-Progress | Dhanesh |
| 02/06/2026 | - | Pass | Moi Submission | Give Moi | Gold, Gift Options not visible | Passed | Jeevadharshini |
| - | - | - | - | - | Verify function type selection during booking | - | Muthu Eswari |
| - | - | - | - | - | Rename "Payments" to "Moi Notebook" | - | Muthu Eswari |
| - | - | - | - | - | Verify relative data upload before function | - | Muthu Eswari |
| - | - | - | - | - | Verify relatives details upload with all required fields | - | Muthu Eswari |
| - | - | - | - | - | Add "Kind of relationship" dropdown in Gift section | - | - |

---

## 2. Panel Architecture

### Panel Comparison

| Feature | Host Panel | Admin Panel |
|---------|----------|-----------|
| **Whom to be Used** | For people who are organizing a function. | For the app owner only. |
| **Benefits** | Allows them to manage moi collection, track contributors, and generate reports. | Provides full control over users, analytics, revenue, and app settings. |
| **Restrictions** | No access to personal moi data. | - |

### Host Panel Features
- Login/ Sign up
- Profile & Settings
- Home Dashboard
- Create Function
- Separate payment Method
- Moi Entry
- Invitation Upload
- Moi List
- Reports
- Moi Return Tracker
- Reminders for the relatives before function or collect the return gift
- Support/ Helpline No

### Admin Panel Features
- Admin login
- Admin Dashboard
- User Management
- Analytics
- Revenue management
- App settings
- Feedback/Complaints

---

## 3. Three Plan Types

| Plan | Description |
|------|-------------|
| **Plan A** | Automatic - just create function |
| **Plan B** | Manual Entry made in website |
| **Plan C** | Create function & Upload Invitee list. QR code and reminder message sent. |

---

## 4. User Roles

- **Host:** Person who organises the Function
- **User:** Person who uses the app to make the Moi
- **Admin:** TickeNadu Team who manages this

---

| Plan | Description |
|------|-------------|
| **Plan A** | Automatic - just create function |
| **Plan B** | Manual Entry made in website |
| **Plan C** | Create function & Upload Invitee list. QR code and reminder message sent |

---

## 4. User Stories & Acceptance Criteria

### Authentication Features

#### Login with Phone Number or Email
- Phone number field accepts only 10-digit numbers
- OTP sent within 30 seconds
- OTP expires after 5 minutes
- Wrong OTP 3 times → blocked for 10 minutes
- New user → goes to profile setup screen
- Existing user → goes to Home Dashboard

#### Admin Login
- Email + Password + OTP all three required
- Wrong password 3 times → locked for 1 hour
- OTP sent to admin registered email only
- Every login recorded: timestamp, IP address, device
- Admin URL not publicly visible or guessable

---

### Event Management Features

#### Create Function
- **Function Types:** Wedding, Birthday, Engagement, Housewarming, Corporate Event, Valaikappu, Graduation, Others
- **Date Options:** Today, Tomorrow, Choose Date
- **Auto-naming:** Function Type - Date format
- **Venue/City:** Not mandatory during creation, can be added later in settings

---

### Moi Entry Features

#### Required Fields
- Name (mandatory)
- Amount (mandatory)
- Method of MoI: Cash / Gold/Silver/Others

#### Performance Requirements
- Entry saves within 2 seconds
- Saved entry appears in Moi List immediately
- Dashboard total updates automatically after save
- Offline entry saves locally and syncs when online

---

### Moi List Features

#### Search & Filter
- Search by name and relationship
- Filter by: All / Cash / Online
- Sort by: High to Low / Low to High / Date

#### Entry Display
- Each entry shows: name, amount, payment method
- Tap entry → Edit or Delete option appears
- Delete requires confirmation pop-up
- 20 entries per page with scroll to load more

---

### Reports Features

#### Summary Statistics
- Total moi amount
- Total number of contributors
- Average amount per contributor
- Top 3 contributors with amounts
- Cash vs online percentage breakdown

#### Export Options
- PDF download works within 5 seconds
- WhatsApp share opens with PDF attached

---

### Invitation Upload Features

#### File Support
- Accepts .xlsx and .csv file formats
- Required columns: Name, Phone, Relationship, City

#### Tracking & Alerts
- Auto-matches invitation list with moi entries
- Shows status per person: Invited / Came / Gave Moi
- Alert for people who came but not in invitation list
- Alert for invited people who did not attend
- Attendance summary: Invited / Came / Gave Moi / No Show

---

### Reminders Features

- Notification sent 3 days before function date
- Notification sent on the day of function
- Weekly reminder for overdue pending returns
- Entry save confirmation notification
- Each notification type can be turned off in Settings
- Default notification time: 9:00 AM

---

### Profile & Settings Features

- Can edit name and city
- Language toggle: Tamil / English
- Font size options: Small / Medium / Large
- Notifications can be turned on or off
- Logout clears session from device
- Delete Account shows 30-day grace period warning
- All data permanently deleted after grace period

---

### Admin Features

#### Admin Dashboard
- Total users, new today, active today
- Total functions created on platform
- This month's revenue
- All numbers load within 3 seconds

#### User Management
- Shows: name, city, join date, function count, status
- Does NOT show: moi amounts or personal entry details
- Search by name or phone number
- Filter by: All / Active / Inactive / Blocked
- Block user → prevents login, data preserved
- Delete user → all data permanently removed

#### Analytics
- User growth graph: Daily / Weekly / Monthly view
- Top 5 cities by user count
- Peak function months
- Most used features by usage count
- Free vs Premium user ratio
- All data is anonymous
- Export any report as CSV

#### Revenue Management
- This month vs last month revenue
- Total revenue since launch
- Free vs premium user count and percentage
- Recent payments list with name, plan, amount, date
- Data updates in real time

#### App Settings
- Turn features on or off across the entire app

#### Support & Complaints
- Shows all tickets: Open / In Progress / Resolved
- Each ticket shows: user name, issue, date submitted
- Can view full issue details
- Mark Resolved moves ticket to resolved list
- Resolved tickets archived after 30 days
- Open ticket count shown on Admin Dashboard

---

## 5. Key Issues to Address

1. **UI/UX:** Profile indication missing under user icon in login page
2. **Feature Visibility:** Gold and Gift contribution options not available in Give Moi section
3. **Feature Rename:** "Payments" should be renamed to "Moi Notebook"
4. **Relationship Field:** Add dropdown for relationship types in Gift section to avoid confusion with same names