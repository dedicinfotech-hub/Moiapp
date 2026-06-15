# Moi App - E2E Test Execution Guide

## Overview

This guide explains how to run the Playwright E2E test suite for the Moi App.

## Prerequisites

- Node.js 18+ installed
- PHP backend running at `http://localhost:8888/MoiApp/api`
- Next.js frontend running at `http://localhost:3000`
- Database seeded with test data

## Installation

```bash
cd frontend/e2e
npm install
npx playwright install
```

## Running Tests

### Step 1: Start the Next.js dev server (Required)

Open a terminal and run:

```bash
cd frontend
npm run dev
```

Keep this terminal running. The server will be available at `http://localhost:3000`.

### Step 2: Run the E2E tests

Open a second terminal:

```bash
cd frontend/e2e

# All tests (all browsers)
npm test

# Specific browser
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Mobile viewports
npm run test:mobile

# Headed mode (see browser window)
npm run test:headed

# Interactive UI mode
npm run test:ui
```

**Note:** The Playwright config no longer auto-starts the dev server. You must start it manually as shown above, then run tests with `--no-webServer` if needed.

### Specific Test File
```bash
npx playwright test tests/host-flow.spec.ts
npx playwright test tests/guest-flow.spec.ts
npx playwright test tests/admin-flow.spec.ts
npx playwright test tests/api.spec.ts
```

### Specific Test by Name
```bash
npx playwright test -g "HOST-001"
npx playwright test -g "GUEST-001"
npx playwright test -g "ADMIN-001"
npx playwright test -g "AUTH-001"
```

## Test Data Setup

### Required Test Data

1. **Host User**
   - Phone: `9876543210`
   - OTP: `123456` (mock)
   - Name: `Arun Kumar`
   - City: `Coimbatore`

2. **Admin User**
   - Email: `admin@moiapp.com`
   - Password: `admin123`
   - OTP: `123456` (mock)

3. **Test Events**
   - Past Event: Wedding (auto-approved)
   - New Event: Birthday (pending approval)
   - Approved Event: With guest token

4. **Guest Token**
   - Generate from approved event
   - Use for guest flow tests

### Seeding Scripts

```bash
# Create admin user
php scripts/create_admin.php

# Migrate database
php scripts/migrate.php

# Create test event
# Use admin panel or direct API call
```

## Test Coverage Summary

| Category | Tests | Status |
|----------|-------|--------|
| Host Flow | 30 | ✅ Complete |
| Guest Flow | 23 | ✅ Complete |
| Admin Flow | 15 | ✅ Complete |
| API Endpoints | 50+ | ✅ Complete |
| **Total** | **118+** | **✅ Complete** |

## Skipped Tests

Some tests are skipped due to runtime prerequisites:

- `GUEST-*` tests requiring valid guest token
- `ADMIN-*` tests requiring admin authentication
- Payment tests requiring completed payment state

To enable skipped tests:
1. Seed backend with required data
2. Update test data constants
3. Remove `.skip(true, ...)` from test definitions

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd frontend/e2e && npm install
      - run: npx playwright install --with-deps
      - run: cd frontend/e2e && npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend/e2e/playwright-report/
```

## Troubleshooting

### Tests Fail with "Missing script: dev"
- The `playwright.config.ts` webServer command now points to the parent `frontend` directory
- If the issue persists, start the dev server manually: `cd frontend && npm run dev`
- Then run tests with: `cd frontend/e2e && npx playwright test --no-webServer`

### Tests Fail with "Page not found"
- Ensure Next.js dev server is running on port 3000
- Check `playwright.config.ts` base URL

### API Tests Return 401
- Ensure PHP backend is running on port 8888
- Check CORS configuration in `config/cors.php`

### OTP Tests Fail
- Mock OTP service or use test OTP `123456`
- Check `api/auth.php` for OTP logic

### Guest Token Tests Fail
- Create approved event via admin panel
- Extract guest token from event QR code
- Update test constants

## Reports

After running tests, view the HTML report:

```bash
npm run report
```

Or open directly:
```
frontend/e2e/playwright-report/index.html
```

## Maintenance

When adding new features:
1. Add test case to appropriate spec file
2. Follow naming convention: `CATEGORY-NNN: Description`
3. Update this guide if new setup is required
4. Run full test suite before merging
