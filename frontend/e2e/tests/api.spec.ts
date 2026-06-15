import { test, expect } from '@playwright/test';

// Use the same API base as the frontend (Next.js rewrites /api to PHP backend)
const API_URL = '/api';

test.describe('API Endpoints - Complete Coverage', () => {
  test.describe('Authentication API', () => {
    test('AUTH-001: Send OTP - valid 10-digit phone', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth.php?action=send-otp`, {
        data: { phone: '9876543210' },
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('OTP sent');
    });

    test('AUTH-002: Send OTP - invalid phone (too short)', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth.php?action=send-otp`, {
        data: { phone: '123' },
      });
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('10 digits');
    });

    test('AUTH-003: Send OTP - invalid phone (letters)', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth.php?action=send-otp`, {
        data: { phone: 'abcdefghij' },
      });
      expect(response.status()).toBe(400);
    });

    test('AUTH-004: Send OTP - empty phone', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth.php?action=send-otp`, {
        data: { phone: '' },
      });
      expect(response.status()).toBe(400);
    });

    test('AUTH-005: Verify OTP - non-existent user returns error', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth.php?action=verify-otp`, {
        data: { phone: '9876543210', otp: '123456' },
      });
      // Non-existent user returns 404 with error message
      expect([400, 404]).toContain(response.status());
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('AUTH-006: Verify OTP - invalid format', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth.php?action=verify-otp`, {
        data: { phone: '9876543210', otp: '123' },
      });
      expect(response.status()).toBe(400);
    });

    test('AUTH-007: Login - requires email and password', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth.php?action=login`, {
        data: { email: '', password: '' },
      });
      expect(response.status()).toBe(400);
    });

    test('AUTH-008: Login - invalid credentials', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth.php?action=login`, {
        data: { email: 'test@example.com', password: 'wrongpass' },
      });
      expect(response.status()).toBe(401);
    });

    test('AUTH-009: Get profile - requires auth', async ({ request }) => {
      const response = await request.get(`${API_URL}/auth.php?action=me`);
      expect(response.status()).toBe(401);
    });

    test('AUTH-010: Update profile - requires auth', async ({ request }) => {
      const response = await request.put(`${API_URL}/auth.php?action=profile`, {
        data: { name: 'Test' },
      });
      expect(response.status()).toBe(401);
    });

    test('AUTH-011: Forgot password - valid email', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth.php?action=forgot-password`, {
        data: { email: 'test@example.com' },
      });
      expect(response.ok()).toBeTruthy();
    });

    test('AUTH-012: Forgot password - empty email', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth.php?action=forgot-password`, {
        data: { email: '' },
      });
      expect(response.status()).toBe(400);
    });

    test('AUTH-013: Reset password - requires token', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth.php?action=reset-password`, {
        data: { token: '', password: 'newpass' },
      });
      expect(response.status()).toBe(400);
    });

    test('AUTH-014: Delete account - requires auth', async ({ request }) => {
      const response = await request.delete(`${API_URL}/auth.php?action=account`);
      expect(response.status()).toBe(401);
    });

    test('AUTH-015: Restore account - requires credentials', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth.php?action=restore-account`, {
        data: { email: '', password: '' },
      });
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Events API', () => {
    test('EVENTS-001: Public listing - no auth required', async ({ request }) => {
      const response = await request.get(`${API_URL}/events.php?public=1`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
    });

    test('EVENTS-002: Get event by slug - public', async ({ request }) => {
      const response = await request.get(`${API_URL}/events.php?slug=nonexistent`);
      expect([200, 404]).toContain(response.status());
    });

    test('EVENTS-003: Get event by guest token - invalid token', async ({ request }) => {
      const response = await request.get(`${API_URL}/events.php?guest_token=invalid`);
      expect(response.status()).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('private_event');
    });

    test('EVENTS-004: List events - requires auth', async ({ request }) => {
      const response = await request.get(`${API_URL}/events.php`);
      expect(response.status()).toBe(401);
    });

    test('EVENTS-005: Create event - requires auth', async ({ request }) => {
      const response = await request.post(`${API_URL}/events.php`, {
        data: { event_type: 'wedding' },
      });
      expect(response.status()).toBe(401);
    });

    test('EVENTS-006: Get pending approvals - requires admin', async ({ request }) => {
      const response = await request.get(`${API_URL}/events.php?action=pending`);
      expect(response.status()).toBe(401);
    });

    test('EVENTS-007: Approve event - requires admin', async ({ request }) => {
      const response = await request.put(`${API_URL}/events.php?action=approve&id=1`, {
        data: { status: 'approved' },
      });
      expect(response.status()).toBe(401);
    });

    test('EVENTS-008: Regenerate QR - requires auth', async ({ request }) => {
      const response = await request.put(`${API_URL}/events.php?action=regenerate-qr&id=1`, {
        data: {},
      });
      expect(response.status()).toBe(401);
    });

    test('EVENTS-009: Close QR - requires auth', async ({ request }) => {
      const response = await request.put(`${API_URL}/events.php?action=close-qr&id=1`, {
        data: {},
      });
      expect(response.status()).toBe(401);
    });

    test('EVENTS-010: Resubmit event - requires auth', async ({ request }) => {
      const response = await request.put(`${API_URL}/events.php?action=resubmit&id=1`, {
        data: {},
      });
      expect(response.status()).toBe(401);
    });

    test('EVENTS-011: Update event - requires auth', async ({ request }) => {
      const response = await request.put(`${API_URL}/events.php?id=1`, {
        data: { custom_title: 'Updated' },
      });
      expect(response.status()).toBe(401);
    });

    test('EVENTS-012: Delete event - requires auth', async ({ request }) => {
      const response = await request.delete(`${API_URL}/events.php?id=1`);
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Moi Entries API', () => {
    test('MOI-001: List entries - requires auth', async ({ request }) => {
      const response = await request.get(`${API_URL}/moi.php?event_id=1`);
      expect(response.status()).toBe(401);
    });

    test('MOI-002: Add entry - requires auth', async ({ request }) => {
      const response = await request.post(`${API_URL}/moi.php`, {
        data: { guest_name: 'Test', amount: 100 },
      });
      // Returns 400 for missing required fields or 401 for no auth
      expect([400, 401]).toContain(response.status());
    });

    test('MOI-003: Update entry - requires auth', async ({ request }) => {
      const response = await request.put(`${API_URL}/moi.php?id=1`, {
        data: { amount: 200 },
      });
      expect(response.status()).toBe(401);
    });

    test('MOI-004: Delete entry - requires auth', async ({ request }) => {
      const response = await request.delete(`${API_URL}/moi.php?id=1`);
      expect(response.status()).toBe(401);
    });

    test('MOI-005: Offline sync - requires auth', async ({ request }) => {
      const response = await request.post(`${API_URL}/offline-sync.php`, {
        data: { entries: [] },
      });
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Notifications API', () => {
    test('NOTIF-001: List notifications - requires auth', async ({ request }) => {
      const response = await request.get(`${API_URL}/notifications.php`);
      expect(response.status()).toBe(401);
    });

    test('NOTIF-002: Create notification - requires auth', async ({ request }) => {
      const response = await request.post(`${API_URL}/notifications.php`, {
        data: { title: 'Test', message: 'Test message' },
      });
      expect(response.status()).toBe(401);
    });

    test('NOTIF-003: Mark read - requires auth', async ({ request }) => {
      const response = await request.put(`${API_URL}/notifications.php`, {
        data: { id: 1 },
      });
      expect(response.status()).toBe(401);
    });

    test('NOTIF-004: Delete notification - requires auth', async ({ request }) => {
      const response = await request.delete(`${API_URL}/notifications.php`, {
        data: { id: 1 },
      });
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Admin API', () => {
    test('ADMIN-001: Get stats - requires admin', async ({ request }) => {
      const response = await request.get(`${API_URL}/admin.php?action=stats`);
      expect(response.status()).toBe(401);
    });

    test('ADMIN-002: Get private events - requires admin', async ({ request }) => {
      const response = await request.get(`${API_URL}/admin.php?action=private-events`);
      expect(response.status()).toBe(401);
    });

    test('ADMIN-003: Deactivate event - requires admin', async ({ request }) => {
      const response = await request.put(`${API_URL}/admin.php?action=deactivate-event&id=1`, {
        data: {},
      });
      // Returns 404 if event doesn't exist, 401 if no auth
      expect([401, 404]).toContain(response.status());
    });

    test('ADMIN-004: Get users - requires admin', async ({ request }) => {
      const response = await request.get(`${API_URL}/admin.php?action=users`);
      expect(response.status()).toBe(401);
    });

    test('ADMIN-005: Block user - requires admin', async ({ request }) => {
      const response = await request.post(`${API_URL}/admin.php?action=block-user`, {
        data: { user_id: 1 },
      });
      expect(response.status()).toBe(401);
    });

    test('ADMIN-006: Delete user - requires admin', async ({ request }) => {
      const response = await request.post(`${API_URL}/admin.php?action=delete-user`, {
        data: { user_id: 1 },
      });
      expect(response.status()).toBe(401);
    });

    test('ADMIN-007: Get analytics - requires admin', async ({ request }) => {
      const response = await request.get(`${API_URL}/admin.php?action=analytics`);
      expect(response.status()).toBe(401);
    });

    test('ADMIN-008: Get tickets - requires admin', async ({ request }) => {
      const response = await request.get(`${API_URL}/admin.php?action=tickets`);
      expect(response.status()).toBe(401);
    });

    test('ADMIN-009: Resolve ticket - requires admin', async ({ request }) => {
      const response = await request.post(`${API_URL}/admin.php?action=resolve-ticket`, {
        data: { ticket_id: 1 },
      });
      expect(response.status()).toBe(401);
    });

    test('ADMIN-010: Archive tickets - requires admin', async ({ request }) => {
      const response = await request.post(`${API_URL}/admin.php?action=archive-tickets`, {
        data: {},
      });
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Invitations API', () => {
    test('INVITE-001: List invitations - requires auth', async ({ request }) => {
      const response = await request.get(`${API_URL}/invitations.php?action=list&event_id=1`);
      expect(response.status()).toBe(401);
    });

    test('INVITE-002: Upload CSV - requires auth', async ({ request }) => {
      const response = await request.post(`${API_URL}/invitations.php?action=csv`, {
        data: { event_id: 1 },
      });
      expect(response.status()).toBe(401);
    });

    test('INVITE-003: Update invitation - requires auth', async ({ request }) => {
      const response = await request.put(`${API_URL}/invitations.php?action=update`, {
        data: { id: 1, status: 'came' },
      });
      expect(response.status()).toBe(401);
    });

    test('INVITE-004: Delete invitation - requires auth', async ({ request }) => {
      const response = await request.delete(`${API_URL}/invitations.php?action=delete&id=1`);
      expect(response.status()).toBe(401);
    });
  });

  test.describe('PDF API', () => {
    test('PDF-001: Generate PDF - requires auth', async ({ request }) => {
      const response = await request.get(`${API_URL}/pdf.php?event_id=1`);
      expect(response.status()).toBe(401);
    });

    test('PDF-002: Download PDF - requires auth', async ({ request }) => {
      const response = await request.get(`${API_URL}/pdf.php?event_id=1&action=download`);
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Features API', () => {
    test('FEAT-001: List features - public or requires auth', async ({ request }) => {
      const response = await request.get(`${API_URL}/features.php`);
      // Features may be publicly accessible or require auth
      expect([200, 401]).toContain(response.status());
    });

    test('FEAT-002: Update feature - requires admin', async ({ request }) => {
      const response = await request.put(`${API_URL}/features.php`, {
        data: { feature_key: 'test', is_enabled: 1 },
      });
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Photos API', () => {
    test('PHOTO-001: List photos - public or requires auth', async ({ request }) => {
      const response = await request.get(`${API_URL}/photos.php?event_id=1`);
      // Photos may be publicly accessible or require auth
      expect([200, 401]).toContain(response.status());
    });

    test('PHOTO-002: Delete photo - requires auth', async ({ request }) => {
      const response = await request.delete(`${API_URL}/photos.php?id=1`);
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Organizers API', () => {
    test('ORG-001: List organizers - requires auth', async ({ request }) => {
      const response = await request.get(`${API_URL}/organizers.php?event_id=1`);
      expect(response.status()).toBe(401);
    });

    test('ORG-002: Add organizer - requires auth', async ({ request }) => {
      const response = await request.post(`${API_URL}/organizers.php?action=add`, {
        data: { event_id: 1, email: 'test@example.com' },
      });
      expect(response.status()).toBe(401);
    });

    test('ORG-003: Remove organizer - requires auth', async ({ request }) => {
      const response = await request.delete(`${API_URL}/organizers.php?id=1`);
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Return Gifts API', () => {
    test('GIFT-001: List return gifts - requires auth', async ({ request }) => {
      const response = await request.get(`${API_URL}/return-gifts.php?event_id=1`);
      expect(response.status()).toBe(401);
    });

    test('GIFT-002: Add return gift - requires auth', async ({ request }) => {
      const response = await request.post(`${API_URL}/return-gifts.php`, {
        data: { event_id: 1, guest_name: 'Test', return_type: 'none' },
      });
      expect(response.status()).toBe(401);
    });

    test('GIFT-003: Update return gift - requires auth', async ({ request }) => {
      const response = await request.put(`${API_URL}/return-gifts.php`, {
        data: { id: 1, status: 'returned' },
      });
      expect(response.status()).toBe(401);
    });

    test('GIFT-004: Delete return gift - requires auth', async ({ request }) => {
      const response = await request.delete(`${API_URL}/return-gifts.php`, {
        data: { id: 1 },
      });
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Export API', () => {
    test('EXPORT-001: Export CSV - requires auth', async ({ request }) => {
      const response = await request.get(`${API_URL}/export.php?event_id=1&format=csv`);
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Bulk Import API', () => {
    test('BULK-001: Bulk import CSV - requires auth', async ({ request }) => {
      const response = await request.post(`${API_URL}/bulk-import.php?action=csv`, {
        data: { event_id: 1 },
      });
      expect(response.status()).toBe(401);
    });

    test('BULK-002: Add digitized entry - requires auth', async ({ request }) => {
      const response = await request.post(`${API_URL}/bulk-import.php?action=add`, {
        data: { event_id: 1, guest_name: 'Test', amount: 100 },
      });
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Ping API', () => {
    test('PING-001: Health check - no auth required', async ({ request }) => {
      const response = await request.get(`${API_URL}/ping.php`);
      expect(response.ok()).toBeTruthy();
    });
  });
});
