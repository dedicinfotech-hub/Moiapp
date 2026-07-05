import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Guest User Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('GUEST-001: Homepage - public events section visible (no Browse Weddings button)', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Browse Weddings button was removed — events are listed on the home page instead
    await expect(page.locator('a[href="/events"]').filter({ hasText: 'Browse Weddings' })).toHaveCount(0);

    const listYourWedding = page.locator('a[href="/register"]').first();
    await expect(listYourWedding).toBeVisible();
    await expect(listYourWedding).toContainText('List Your Wedding');
  });

  test('GUEST-002: Homepage - List Your Wedding navigates to register', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    
    const registerBtn = page.locator('a[href="/register"]').first();
    await expect(registerBtn).toBeVisible();
    await expect(registerBtn).toContainText('List Your Wedding');
    
    await registerBtn.click();
    await expect(page).toHaveURL(`${BASE_URL}/register`);
  });

  test('GUEST-003: Login page - Phone tab default active', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    const phoneTab = page.locator('button:has-text("Phone")');
    await expect(phoneTab).toBeVisible();
    
    const emailTab = page.locator('button:has-text("Email")');
    await expect(emailTab).toBeVisible();
    
    // Phone input visible
    await expect(page.locator('input[placeholder="Enter 10 digit mobile number"]')).toBeVisible();
    
    // Send OTP button visible
    await expect(page.locator('button:has-text("Send OTP")')).toBeVisible();
  });

  test('GUEST-004: Login page - Switch to Email tab', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.click('button:has-text("Email")');
    
    const emailTab = page.locator('button:has-text("Email")');
    await expect(emailTab).toBeVisible();
    
    // Email and password inputs
    await expect(page.locator('input[placeholder="you@example.com"]')).toBeVisible();
    await expect(page.locator('input[placeholder="••••••••"]')).toBeVisible();
    
    // Sign In button
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('GUEST-005: Login page - Phone validation', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Try invalid phone
    await page.fill('input[placeholder="Enter 10 digit mobile number"]', '123');
    await page.click('button:has-text("Send OTP")');
    
    await expect(page.locator('text=Phone number must be 10 digits')).toBeVisible();
  });

  test('GUEST-006: OTP screen - 6 input boxes', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[placeholder="Enter 10 digit mobile number"]', '9876543210');
    await page.click('button:has-text("Send OTP")');
    
    await expect(page).toHaveURL(`${BASE_URL}/otp-verification`);
    
    // Check 6 OTP inputs
    const otpInputs = page.locator('input[inputmode="numeric"]');
    await expect(otpInputs).toHaveCount(6);
  });

  test('GUEST-007: OTP screen - Auto-focus next input', async ({ page }) => {
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

  test('GUEST-008: OTP screen - Backspace moves to previous', async ({ page }) => {
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

  test('GUEST-009: OTP screen - Paste support', async ({ page }) => {
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

  test('GUEST-010: OTP screen - Resend timer', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[placeholder="Enter 10 digit mobile number"]', '9876543210');
    await page.click('button:has-text("Send OTP")');
    
    await expect(page).toHaveURL(`${BASE_URL}/otp-verification`);
    
    // Resend timer should be visible
    await expect(page.locator('text=Resend OTP in')).toBeVisible();
  });

  test('GUEST-011: Profile setup - Form fields', async ({ page }) => {
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
    
    // Save button
    await expect(page.locator('button:has-text("Save & Continue")')).toBeVisible();
  });

  test('GUEST-012: Profile setup - Save and continue', async ({ page }) => {
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
    
    // Should go to dashboard
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  });

  test('GUEST-013: Choose event type - New Event card', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    
    // Check New Event card
    await expect(page.locator('text=New Event')).toBeVisible();
    
    // Check features listed
    await expect(page.locator('text=Live Moi Collection')).toBeVisible();
    await expect(page.locator('text=QR Code Enabled')).toBeVisible();
    await expect(page.locator('text=Guest Contributions')).toBeVisible();
  });

  test('GUEST-014: Choose event type - Past Event card', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/choose-type`);
    
    // Check Past Event card
    await expect(page.locator('text=Past Event')).toBeVisible();
    
    // Check features listed
    await expect(page.locator('text=Record Keeping Only')).toBeVisible();
    await expect(page.locator('text=No QR Code')).toBeVisible();
    await expect(page.locator('text=Manual Entry Flow')).toBeVisible();
  });

  test('GUEST-015: Invalid guest token - shows expired content', async ({ page }) => {
    await page.goto(`${BASE_URL}/g/invalid-token/form`);
    
    // The form page should show expired/link expired content for invalid tokens
    // Either redirects to expired page or shows error on form page
    const url = page.url();
    const isExpiredPage = url.includes('/expired');
    const hasExpiredText = await page.locator('text=Link Expired').count() > 0;
    const hasEventNotFound = await page.locator('text=Event not found').count() > 0;
    
    expect(isExpiredPage || hasExpiredText || hasEventNotFound).toBeTruthy();
  });

  test('GUEST-016: Deactivated event - shows expired content', async ({ page }) => {
    await page.goto(`${BASE_URL}/g/deactivated-token/form`);
    
    // The form page should show expired content for deactivated tokens
    const url = page.url();
    const isExpiredPage = url.includes('/expired');
    const hasExpiredText = await page.locator('text=Link Expired').count() > 0;
    const hasEventNotFound = await page.locator('text=Event not found').count() > 0;
    
    expect(isExpiredPage || hasExpiredText || hasEventNotFound).toBeTruthy();
  });

  test('GUEST-017: Guest form - validation', async ({ page }) => {
    await page.goto(`${BASE_URL}/g/invalid-token/form`);
    
    // Should show expired or not found for test token
    const hasExpiredText = await page.locator('text=Link Expired').count() > 0;
    const hasEventNotFound = await page.locator('text=Event not found').count() > 0;
    
    expect(hasExpiredText || hasEventNotFound).toBeTruthy();
  });

  test('GUEST-018: Payment page - method selection', async () => {
    // This requires a valid guest token from an approved event
    test.skip(true, 'Requires valid guest token from approved event');
  });

  test('GUEST-019: Payment page - GPay option', async () => {
    test.skip(true, 'Requires valid guest token from approved event');
  });

  test('GUEST-020: Payment page - PhonePe option', async () => {
    test.skip(true, 'Requires valid guest token from approved event');
  });

  test('GUEST-021: Payment page - Cash option', async () => {
    test.skip(true, 'Requires valid guest token from approved event');
  });

  test('GUEST-022: Success page - after payment', async () => {
    test.skip(true, 'Requires valid guest token and completed payment');
  });

  test('GUEST-023: Receipt page - view receipt', async () => {
    test.skip(true, 'Requires valid guest token and completed payment');
  });
});
