import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Host User Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('HOST-001: Homepage - all elements visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    
    // Hero section
    await expect(page.locator('text=Celebrate with')).toBeVisible();
    await expect(page.locator('text=Moi')).toBeVisible();
    await expect(page.locator('text=the Tamil way of gifting')).toBeVisible();
    
    // CTA buttons
    await expect(page.locator('text=Browse Weddings →')).toBeVisible();
    await expect(page.locator('text=List Your Wedding')).toBeVisible();
    
    // Features section
    await expect(page.locator('text=Moi Register')).toBeVisible();
    await expect(page.locator('text=UPI Payments')).toBeVisible();
    await expect(page.locator('text=Live Dashboard')).toBeVisible();
    
    // Footer
    await expect(page.locator('text=Moi PassBook')).toBeVisible();
  });

  test('HOST-002: Login page - Phone tab default', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Phone tab visible
    const phoneTab = page.locator('button:has-text("Phone")');
    await expect(phoneTab).toBeVisible();
    
    // Email tab visible
    const emailTab = page.locator('button:has-text("Email")');
    await expect(emailTab).toBeVisible();
    
    // Phone input visible
    await expect(page.locator('input[placeholder="Enter 10 digit mobile number"]')).toBeVisible();
    
    // Send OTP button visible
    await expect(page.locator('button:has-text("Send OTP")')).toBeVisible();
    
    // Security notice
    await expect(page.locator('text=Your data is safe with us')).toBeVisible();
  });

  test('HOST-003: Login page - Email tab', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.click('button:has-text("Email")');
    
    // Email and password inputs
    await expect(page.locator('input[placeholder="you@example.com"]')).toBeVisible();
    await expect(page.locator('input[placeholder="••••••••"]')).toBeVisible();
    
    // Sign In button
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('HOST-004: Login - Phone validation', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Invalid phone
    await page.fill('input[placeholder="Enter 10 digit mobile number"]', '123');
    await page.click('button:has-text("Send OTP")');
    await expect(page.locator('text=Phone number must be 10 digits')).toBeVisible();
    
    // Empty phone
    await page.fill('input[placeholder="Enter 10 digit mobile number"]', '');
    await page.click('button:has-text("Send OTP")');
    await expect(page.locator('text=Phone number must be 10 digits')).toBeVisible();
  });

  test('HOST-005: OTP screen - 6 boxes and timers', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[placeholder="Enter 10 digit mobile number"]', '9876543210');
    await page.click('button:has-text("Send OTP")');
    
    await expect(page).toHaveURL(`${BASE_URL}/otp-verification`);
    
    // 6 OTP inputs
    const otpInputs = page.locator('input[inputmode="numeric"]');
    await expect(otpInputs).toHaveCount(6);
    
    // Title and subtitle
    await expect(page.locator('text=Enter OTP')).toBeVisible();
    await expect(page.locator('text=We have sent a 6 digit OTP to')).toBeVisible();
    
    // Resend timer
    await expect(page.locator('text=Resend OTP in')).toBeVisible();
    
    // Security notice
    await expect(page.locator('text=never share your OTP')).toBeVisible();
    
    // Verify button
    await expect(page.locator('button:has-text("Verify OTP")')).toBeVisible();
    
    // OTP expiry
    await expect(page.locator('text=OTP will expire in')).toBeVisible();
  });

  test('HOST-006: OTP - Auto-focus next input', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[placeholder="Enter 10 digit mobile number"]', '9876543210');
    await page.click('button:has-text("Send OTP")');
    
    await expect(page).toHaveURL(`${BASE_URL}/otp-verification`);
    
    // Fill first digit
    await page.locator('input[inputmode="numeric"]').first().fill('1');
    
    // Second input should be focused (auto-move)
    const inputs = page.locator('input[inputmode="numeric"]');
    await expect(inputs.nth(1)).toBeFocused();
  });

  test('HOST-007: OTP - Backspace to previous', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[placeholder="Enter 10 digit mobile number"]', '9876543210');
    await page.click('button:has-text("Send OTP")');
    
    await expect(page).toHaveURL(`${BASE_URL}/otp-verification`);
    
    // Fill two digits
    const inputs = page.locator('input[inputmode="numeric"]');
    await inputs.nth(0).fill('1');
    await inputs.nth(1).fill('2');
    
    // Backspace on second
    await inputs.nth(1).press('Backspace');
    
    // First should be focused
    await expect(inputs.nth(0)).toBeFocused();
  });

  test('HOST-008: OTP - Paste support', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[placeholder="Enter 10 digit mobile number"]', '9876543210');
    await page.click('button:has-text("Send OTP")');
    
    await expect(page).toHaveURL(`${BASE_URL}/otp-verification`);
    
    // Paste 6 digits into first input
    const firstInput = page.locator('input[inputmode="numeric"]').first();
    await firstInput.paste('123456');
    
    // All inputs should be filled
    const inputs = page.locator('input[inputmode="numeric"]');
    for (let i = 0; i < 6; i++) {
      await expect(inputs.nth(i)).toHaveValue('123456'[i]);
    }
  });

  test('HOST-009: Profile setup - all fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[placeholder="Enter 10 digit mobile number"]', '9876543210');
    await page.click('button:has-text("Send OTP")');
    await expect(page).toHaveURL(`${BASE_URL}/otp-verification`);
    
    // Fill OTP
    const otpInputs = page.locator('input[inputmode="numeric"]');
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill('123456'[i]);
    }
    
    await expect(page).toHaveURL(`${BASE_URL}/profile-setup`);
    
    // Full name field
    await expect(page.locator('label:has-text("Full Name *")')).toBeVisible();
    await expect(page.locator('input[placeholder="Enter your full name"]')).toBeVisible();
    
    // City field
    await expect(page.locator('label:has-text("City *")')).toBeVisible();
    await expect(page.locator('input[placeholder="Enter your city"]')).toBeVisible();
    
    // Language label
    await expect(page.locator('text=Language / மொழி')).toBeVisible();
    
    // Language options
    await expect(page.locator('button:has-text("தமிழ்")')).toBeVisible();
    await expect(page.locator('button:has-text("English")')).toBeVisible();
    
    // Security card
    await expect(page.locator('text=Your Data is Safe')).toBeVisible();
    await expect(page.locator('text=We never share your personal information')).toBeVisible();
    
    // Save button
    await expect(page.locator('button:has-text("Save & Continue")')).toBeVisible();
    
    // Progress indicator
    await expect(page.locator('text=Profile')).toBeVisible();
    await expect(page.locator('text=Event Type')).toBeVisible();
    await expect(page.locator('text=Function Details')).toBeVisible();
    await expect(page.locator('text=Finish')).toBeVisible();
  });

  test('HOST-010: Profile setup - save and navigate', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[placeholder="Enter 10 digit mobile number"]', '9876543210');
    await page.click('button:has-text("Send OTP")');
    await expect(page).toHaveURL(`${BASE_URL}/otp-verification`);
    
    // Fill OTP
    const otpInputs = page.locator('input[inputmode="numeric"]');
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill('123456'[i]);
    }
    
    await expect(page).toHaveURL(`${BASE_URL}/profile-setup`);
    
    // Fill form
    await page.fill('input[placeholder="Enter your full name"]', 'Arun Kumar');
    await page.fill('input[placeholder="Enter your city"]', 'Coimbatore');
    
    // Select Tamil
    await page.click('button:has-text("தமிழ்")');
    
    // Save
    await page.click('button:has-text("Save & Continue")');
    
    // Should go to dashboard (profile setup redirects to dashboard)
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  });

  test('HOST-011: Choose event type - New Event features', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    
    // New Event card
    await expect(page.locator('text=New Event')).toBeVisible();
    await expect(page.locator('text=Live Moi Collection')).toBeVisible();
    await expect(page.locator('text=QR Code Enabled')).toBeVisible();
    await expect(page.locator('text=Guest Contributions')).toBeVisible();
  });

  test('HOST-012: Choose event type - Past Event features', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    
    // Past Event card
    await expect(page.locator('text=Past Event')).toBeVisible();
    await expect(page.locator('text=Record Keeping Only')).toBeVisible();
    await expect(page.locator('text=No QR Code')).toBeVisible();
    await expect(page.locator('text=Manual Entry Flow')).toBeVisible();
  });

  test('HOST-013: Create new event - Wedding flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    await page.click('text=New Event');
    await page.click('text=Wedding');
    
    // Form fields
    await expect(page.locator('input[placeholder*="Bride"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Groom"]')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    
    // Fill form
    await page.fill('input[placeholder*="Bride"]', 'Priya');
    await page.fill('input[placeholder*="Groom"]', 'Rahul');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await page.fill('input[type="date"]', futureDate.toISOString().split('T')[0]);
    
    await page.click('button:has-text("Continue")');
    
    // Review page
    await expect(page.locator('text=Review Your Function')).toBeVisible();
    await expect(page.locator('text=Wedding')).toBeVisible();
  });

  test('HOST-014: Create past event - auto approved', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    await page.click('text=Past Event');
    await page.click('text=Birthday');
    
    await page.fill('input[placeholder*="Person"]', 'Kumar');
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);
    await page.fill('input[type="date"]', pastDate.toISOString().split('T')[0]);
    
    await page.click('button:has-text("Create Function")');
    
    // Should go directly to dashboard (no approval needed)
    await expect(page).toHaveURL(/\/events\/.+\/dashboard/);
  });

  test('HOST-015: Pending approval screen', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    await page.click('text=New Event');
    await page.click('text=Wedding');
    await page.fill('input[placeholder*="Bride"]', 'Test');
    await page.fill('input[placeholder*="Groom"]', 'Test');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await page.fill('input[type="date"]', futureDate.toISOString().split('T')[0]);
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Create Function")');
    
    // Pending screen
    await expect(page).toHaveURL(/\/events\/.+\/pending/);
    await expect(page.locator('text=Pending Approval')).toBeVisible();
  });

  test('HOST-016: Dashboard - summary cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    await page.click('text=Past Event');
    await page.click('text=Wedding');
    await page.fill('input[placeholder*="Bride"]', 'Test');
    await page.fill('input[placeholder*="Groom"]', 'Test');
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await page.fill('input[type="date"]', pastDate.toISOString().split('T')[0]);
    await page.click('button:has-text("Create Function")');
    
    // Dashboard
    await expect(page).toHaveURL(/\/events\/.+\/dashboard/);
    
    // Summary cards
    await expect(page.locator('text=Total Functions')).toBeVisible();
    await expect(page.locator('text=Total Moi Collected')).toBeVisible();
    await expect(page.locator('text=Pending Returns')).toBeVisible();
    await expect(page.locator('text=Total Contributors')).toBeVisible();
    
    // Quick actions
    await expect(page.locator('text=Moi Entry')).toBeVisible();
    await expect(page.locator('text=Moi List')).toBeVisible();
    await expect(page.locator('text=QR Code')).toBeVisible();
    await expect(page.locator('text=Pending Approvals')).toBeVisible();
    await expect(page.locator('text=Reports')).toBeVisible();
  });

  test('HOST-017: Moi Entry - Cash payment', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    await page.click('text=Past Event');
    await page.click('text=Wedding');
    await page.fill('input[placeholder*="Bride"]', 'Test');
    await page.fill('input[placeholder*="Groom"]', 'Test');
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await page.fill('input[type="date"]', pastDate.toISOString().split('T')[0]);
    await page.click('button:has-text("Create Function")');
    
    await page.goto(`${page.url()}/moi-entry`);
    
    // Form fields
    await expect(page.locator('input[placeholder*="Guest Name"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Amount"]')).toBeVisible();
    
    // Payment method buttons
    await expect(page.locator('button:has-text("Cash")')).toBeVisible();
    await expect(page.locator('button:has-text("UPI")')).toBeVisible();
    await expect(page.locator('button:has-text("Card")')).toBeVisible();
    await expect(page.locator('button:has-text("Cheque")')).toBeVisible();
    await expect(page.locator('button:has-text("Gold")')).toBeVisible();
    await expect(page.locator('button:has-text("Silver")')).toBeVisible();
    await expect(page.locator('button:has-text("Gift")')).toBeVisible();
    await expect(page.locator('button:has-text("Other")')).toBeVisible();
    
    // Fill and submit
    await page.fill('input[placeholder*="Guest Name"]', 'John Doe');
    await page.click('button:has-text("Cash")');
    await page.fill('input[placeholder*="Amount"]', '5000');
    await page.click('button:has-text("Save Entry")');
    
    // Success
    await expect(page.locator('text=Entry saved')).toBeVisible();
  });

  test('HOST-018: Moi Entry - Gold redirects to gift entry', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    await page.click('text=Past Event');
    await page.click('text=Wedding');
    await page.fill('input[placeholder*="Bride"]', 'Test');
    await page.fill('input[placeholder*="Groom"]', 'Test');
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await page.fill('input[type="date"]', pastDate.toISOString().split('T')[0]);
    await page.click('button:has-text("Create Function")');
    
    await page.goto(`${page.url()}/moi-entry`);
    await page.click('button:has-text("Gold")');
    
    // Should redirect to gift entry
    await expect(page).toHaveURL(/\/events\/.+\/gift-entry/);
  });

  test('HOST-019: Moi List - filters and search', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    await page.click('text=Past Event');
    await page.click('text=Wedding');
    await page.fill('input[placeholder*="Bride"]', 'Test');
    await page.fill('input[placeholder*="Groom"]', 'Test');
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await page.fill('input[type="date"]', pastDate.toISOString().split('T')[0]);
    await page.click('button:has-text("Create Function")');
    
    // Add entry
    await page.goto(`${page.url()}/moi-entry`);
    await page.fill('input[placeholder*="Guest Name"]', 'John Doe');
    await page.click('button:has-text("Cash")');
    await page.fill('input[placeholder*="Amount"]', '5000');
    await page.click('button:has-text("Save Entry")');
    
    // Go to entries
    await page.goto(`${page.url().replace('/dashboard', '')}/entries`);
    
    // Search
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    
    // Filter buttons
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("Cash")')).toBeVisible();
    await expect(page.locator('button:has-text("Gift")')).toBeVisible();
    
    // Relation filter
    await expect(page.locator('button:has-text("All Relations")')).toBeVisible();
    await expect(page.locator('button:has-text("Family")')).toBeVisible();
    await expect(page.locator('button:has-text("Friend")')).toBeVisible();
    
    // Sort options
    await expect(page.locator('button:has-text("Latest First")')).toBeVisible();
    await expect(page.locator('button:has-text("High to Low")')).toBeVisible();
    await expect(page.locator('button:has-text("Low to High")')).toBeVisible();
    
    // Load More
    await expect(page.locator('button:has-text("Load More")')).toBeVisible();
  });

  test('HOST-020: Moi List - tap to show actions', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    await page.click('text=Past Event');
    await page.click('text=Wedding');
    await page.fill('input[placeholder*="Bride"]', 'Test');
    await page.fill('input[placeholder*="Groom"]', 'Test');
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await page.fill('input[type="date"]', pastDate.toISOString().split('T')[0]);
    await page.click('button:has-text("Create Function")');
    
    await page.goto(`${page.url()}/moi-entry`);
    await page.fill('input[placeholder*="Guest Name"]', 'John Doe');
    await page.click('button:has-text("Cash")');
    await page.fill('input[placeholder*="Amount"]', '5000');
    await page.click('button:has-text("Save Entry")');
    
    await page.goto(`${page.url().replace('/dashboard', '')}/entries`);
    
    // Initially shows Actions button
    await expect(page.locator('button:has-text("Actions")').first()).toBeVisible();
    
    // Click Actions
    await page.click('button:has-text("Actions")').first();
    
    // Shows Edit, Delete, Close
    await expect(page.locator('button:has-text("Edit")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Delete")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Close")').first()).toBeVisible();
  });

  test('HOST-021: QR Code page - elements', async ({ page }) => {
    // Create new event for QR
    await page.goto(`${BASE_URL}/events/choose-type`);
    await page.click('text=New Event');
    await page.click('text=Wedding');
    await page.fill('input[placeholder*="Bride"]', 'Test');
    await page.fill('input[placeholder*="Groom"]', 'Test');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await page.fill('input[type="date"]', futureDate.toISOString().split('T')[0]);
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Create Function")');
    
    // On pending - QR not available yet
    await expect(page).toHaveURL(/\/events\/.+\/pending/);
  });

  test('HOST-022: Reports page - elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    await page.click('text=Past Event');
    await page.click('text=Wedding');
    await page.fill('input[placeholder*="Bride"]', 'Test');
    await page.fill('input[placeholder*="Groom"]', 'Test');
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await page.fill('input[type="date"]', pastDate.toISOString().split('T')[0]);
    await page.click('button:has-text("Create Function")');
    
    await page.goto(`${page.url()}/reports`);
    
    // Report sections
    await expect(page.locator('text=Total Collection')).toBeVisible();
    await expect(page.locator('text=Total Contributors')).toBeVisible();
    await expect(page.locator('text=Average')).toBeVisible();
    await expect(page.locator('text=Top Contributors')).toBeVisible();
    
    // Export buttons
    await expect(page.locator('button:has-text("Export PDF")')).toBeVisible();
    await expect(page.locator('button:has-text("Export Excel")')).toBeVisible();
  });

  test('HOST-023: Settings page - all sections', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard?module=settings`);
    
    // Profile section
    await expect(page.locator('text=Profile')).toBeVisible();
    await expect(page.locator('text=Display Name')).toBeVisible();
    await expect(page.locator('text=City')).toBeVisible();
    
    // App settings
    await expect(page.locator('text=App Settings')).toBeVisible();
    await expect(page.locator('text=Notifications')).toBeVisible();
    await expect(page.locator('text=Language')).toBeVisible();
    await expect(page.locator('text=Font Size')).toBeVisible();
    
    // Account
    await expect(page.locator('text=Account')).toBeVisible();
    await expect(page.locator('text=Sign out')).toBeVisible();
    await expect(page.locator('text=Delete Account')).toBeVisible();
  });

  test('HOST-024: Logout flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    await page.click('text=Past Event');
    await page.click('text=Wedding');
    await page.fill('input[placeholder*="Bride"]', 'Test');
    await page.fill('input[placeholder*="Groom"]', 'Test');
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await page.fill('input[type="date"]', pastDate.toISOString().split('T')[0]);
    await page.click('button:has-text("Create Function")');
    
    await page.goto(`${BASE_URL}/dashboard?module=settings`);
    await page.click('button:has-text("Sign Out")');
    
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  test('HOST-025: Bottom navigation - all items', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    await page.click('text=Past Event');
    await page.click('text=Wedding');
    await page.fill('input[placeholder*="Bride"]', 'Test');
    await page.fill('input[placeholder*="Groom"]', 'Test');
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await page.fill('input[type="date"]', pastDate.toISOString().split('T')[0]);
    await page.click('button:has-text("Create Function")');
    
    // Bottom nav
    await expect(page.locator('text=Home')).toBeVisible();
    await expect(page.locator('text=Functions')).toBeVisible();
    await expect(page.locator('text=Moi List')).toBeVisible();
    await expect(page.locator('text=Reports')).toBeVisible();
    await expect(page.locator('text=More')).toBeVisible();
  });

  test('HOST-026: All event types - form validation', async ({ page }) => {
    const eventTypes = [
      { name: 'Wedding', field: 'Bride', value: 'Test Bride' },
      { name: 'Birthday', field: 'Person', value: 'Test Person' },
      { name: 'Engagement', field: 'Bride', value: 'Test Bride' },
      { name: 'Housewarming', field: 'Host', value: 'Test Host' },
      { name: 'Graduation', field: 'Graduate', value: 'Test Grad' },
    ];
    
    for (const et of eventTypes) {
      await page.goto(`${BASE_URL}/events/choose-type`);
      await page.click('text=New Event');
      await page.click(`text=${et.name}`);
      
      // Check relevant field exists
      if (et.field === 'Bride') {
        await expect(page.locator('input[placeholder*="Bride"]')).toBeVisible();
      } else if (et.field === 'Person') {
        await expect(page.locator('input[placeholder*="Person"]')).toBeVisible();
      } else if (et.field === 'Host') {
        await expect(page.locator('input[placeholder*="Host"]')).toBeVisible();
      } else if (et.field === 'Graduate') {
        await expect(page.locator('input[placeholder*="Graduate"]')).toBeVisible();
      }
    }
  });

  test('HOST-027: Gift entry - weight field for Gold/Silver', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    await page.click('text=Past Event');
    await page.click('text=Wedding');
    await page.fill('input[placeholder*="Bride"]', 'Test');
    await page.fill('input[placeholder*="Groom"]', 'Test');
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await page.fill('input[type="date"]', pastDate.toISOString().split('T')[0]);
    await page.click('button:has-text("Create Function")');
    
    await page.goto(`${page.url()}/moi-entry`);
    await page.click('button:has-text("Gold")');
    
    // Should be on gift entry
    await expect(page).toHaveURL(/\/events\/.+\/gift-entry/);
    
    // Weight field should be visible for Gold
    await expect(page.locator('input[placeholder*="grams"]')).toBeVisible();
  });

  test('HOST-028: Voice entry page - elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    await page.click('text=Past Event');
    await page.click('text=Wedding');
    await page.fill('input[placeholder*="Bride"]', 'Test');
    await page.fill('input[placeholder*="Groom"]', 'Test');
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await page.fill('input[type="date"]', pastDate.toISOString().split('T')[0]);
    await page.click('button:has-text("Create Function")');
    
    await page.goto(`${page.url()}/voice-entry`);
    
    // Voice entry elements
    await expect(page.locator('text=Voice Entry')).toBeVisible();
    await expect(page.locator('button:has-text("Start Recording")')).toBeVisible();
  });

  test('HOST-029: Invitations page - upload', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    await page.click('text=Past Event');
    await page.click('text=Wedding');
    await page.fill('input[placeholder*="Bride"]', 'Test');
    await page.fill('input[placeholder*="Groom"]', 'Test');
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await page.fill('input[type="date"]', pastDate.toISOString().split('T')[0]);
    await page.click('button:has-text("Create Function")');
    
    // Navigate to event page and check invitations tab
    await page.goto(`${page.url()}`);
    
    // Check if invitations tab exists in EventPageClient
    await expect(page.locator('text=Invitations')).toBeVisible();
  });

  test('HOST-030: Past Event badge on dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    await page.click('text=Past Event');
    await page.click('text=Wedding');
    await page.fill('input[placeholder*="Bride"]', 'Test');
    await page.fill('input[placeholder*="Groom"]', 'Test');
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await page.fill('input[type="date"]', pastDate.toISOString().split('T')[0]);
    await page.click('button:has-text("Create Function")');
    
    // Check for Past Event badge
    await expect(page.locator('text=Past Event')).toBeVisible();
  });
});
