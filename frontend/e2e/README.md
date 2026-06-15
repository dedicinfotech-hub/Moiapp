# Moi App - E2E Test Suite

Comprehensive Playwright test suite covering Host, Guest, and Admin user flows, plus all API endpoints.

## Test Structure

```
frontend/e2e/
├── playwright.config.ts      # Playwright configuration
├── package.json              # E2E dependencies and scripts
├── README.md                 # This file
├── TEST_EXECUTION_GUIDE.md   # Detailed execution guide
└── tests/
    ├── host-flow.spec.ts     # 30 Host user flow tests
    ├── guest-flow.spec.ts    # 23 Guest user flow tests
    ├── admin-flow.spec.ts    # 15 Admin user flow tests
    └── api.spec.ts           # 50+ API endpoint tests
```

## Quick Start

```bash
# Install dependencies
cd frontend/e2e
npm install
npx playwright install

# Run all tests
npm test

# Run specific test file
npx playwright test tests/host-flow.spec.ts

# Run with UI
npm run test:ui
```

## Test Categories

### Host Flow (30 tests)
- Splash screen validation
- Login (Phone/Email tabs)
- OTP verification (auto-focus, paste, backspace)
- Profile setup
- Event creation (New/Past)
- Dashboard summary cards
- Moi Entry (all payment methods)
- Gift Entry (Gold/Silver weight)
- Moi List (filters, search, sort, pagination)
- Entry actions (tap to show Edit/Delete)
- QR Code page
- Reports (PDF/Excel export)
- Settings
- Logout
- Bottom navigation
- Voice entry
- Invitations

### Guest Flow (23 tests)
- Splash navigation
- Login tabs
- Phone validation
- OTP inputs and timers
- Profile setup
- Event type selection
- Invalid/deactivated token handling
- Payment page (GPay, PhonePe, Cash, Gold, Silver, Gift)
- Success and receipt pages
- Duplicate submission prevention
- Expired token handling

### Admin Flow (15 tests)
- Admin login (OTP)
- Dashboard overview
- Pending event approval
- Private events monitoring
- QR deactivation
- User management
- Analytics
- Support tickets
- Revenue tracking

### API Tests (50+ tests)
- Authentication (send-otp, verify-otp, login, profile, password reset)
- Events (CRUD, approval, QR, private events)
- Moi Entries (CRUD, offline sync)
- Notifications (CRUD)
- Admin (stats, users, tickets, analytics)
- Invitations (CRUD, CSV upload)
- PDF generation
- Features management
- Photos management
- Organizers management
- Return gifts management
- Export (CSV)
- Bulk import
- Health check (ping)

## Naming Convention

Tests follow the pattern: `CATEGORY-NNN: Description`

- `HOST-001` through `HOST-030` - Host flow tests
- `GUEST-001` through `GUEST-023` - Guest flow tests
- `ADMIN-001` through `ADMIN-015` - Admin flow tests
- `AUTH-001` through `AUTH-015` - Auth API tests
- `EVENTS-001` through `EVENTS-012` - Events API tests
- `MOI-001` through `MOI-005` - Moi API tests
- `NOTIF-001` through `NOTIF-004` - Notifications API tests
- `ADMIN-001` through `ADMIN-010` - Admin API tests
- `INVITE-001` through `INVITE-004` - Invitations API tests
- `PDF-001` through `PDF-002` - PDF API tests
- `FEAT-001` through `FEAT-002` - Features API tests
- `PHOTO-001` through `PHOTO-002` - Photos API tests
- `ORG-001` through `ORG-003` - Organizers API tests
- `GIFT-001` through `GIFT-004` - Return Gifts API tests
- `EXPORT-001` - Export API tests
- `BULK-001` through `BULK-002` - Bulk Import API tests
- `PING-001` - Health check test

## Browser Coverage

- Chromium (Desktop)
- Firefox (Desktop)
- WebKit/Safari (Desktop)
- Mobile Chrome
- Mobile Safari

## Test Data Requirements

### Host User
- Phone: `9876543210`
- OTP: `123456` (mock)
- Name: `Arun Kumar`
- City: `Coimbatore`

### Admin User
- Email: `admin@moiapp.com`
- Password: `admin123`
- OTP: `123456` (mock)

### Test Events
- Past Event: Wedding (auto-approved, no QR)
- New Event: Birthday (pending approval)
- Approved Event: With valid guest token

## Skipped Tests

Some tests are skipped pending runtime prerequisites:

| Test | Reason |
|------|--------|
| Guest payment tests | Requires valid guest token from approved event |
| Guest success/receipt | Requires completed payment state |
| Admin dashboard tests | Requires admin authentication |
| Private event monitoring | Requires admin auth and private events |

To enable: Seed backend with required data and remove `.skip()`.

## CI/CD

See `TEST_EXECUTION_GUIDE.md` for GitHub Actions configuration.

## Maintenance

When adding features:
1. Add test to appropriate spec file
2. Follow naming convention
3. Update this README
4. Run full suite before merge
