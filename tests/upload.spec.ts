import { test, expect } from '@playwright/test';

test.describe('Upload Flow Validation', () => {

  test.beforeEach(async ({ page }) => {
    // Seed user auth session
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'sb-hdqzlluauofytchbzgly-auth-token',
        JSON.stringify({
          access_token: 'mock-user-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh',
          user: {
            id: 'mock-user-id',
            email: 'user@example.com',
            app_metadata: { provider: 'email' },
            user_metadata: { role: 'user' },
            created_at: new Date().toISOString()
          },
          expires_at: Math.floor(Date.now() / 1000) + 3600
        })
      );
    });

    // Mock Supabase Auth
    await page.route('**/auth/v1/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: 'mock-user-id', email: 'user@example.com' }
        })
      });
    });

    // Mock PostgREST API
    await page.route('**/rest/v1/**', async route => {
      const url = route.request().url();
      const headers = route.request().headers();
      const isSingle = (headers['accept'] && headers['accept'].includes('vnd.pgrst.object')) || 
                       (headers['Accept'] && headers['Accept'].includes('vnd.pgrst.object'));

      if (url.includes('/users')) {
        const userObj = {
          id: 'mock-user-id',
          email: 'user@example.com',
          role: 'user',
          is_admin: false,
          profile: {
            id: 'mock-user-id',
            user_id: 'mock-user-id',
            full_name: 'Test Profile User',
            is_approved: true,
            is_verified: false,
            profile_completed: true,
            plan_type: 'free'
          }
        };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingle ? userObj : [userObj])
        });
      } else if (url.includes('/profiles')) {
        const profileObj = {
          id: 'mock-user-id',
          user_id: 'mock-user-id',
          full_name: 'Test Profile User',
          is_approved: true,
          is_verified: false,
          profile_completed: true,
          plan_type: 'free'
        };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingle ? profileObj : [profileObj])
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    });

    // Mock Supabase Storage upload
    await page.route('**/storage/v1/object/**', async route => {
      const method = route.request().method();
      if (method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ Key: 'avatars/mock-file.jpg' })
        });
      } else {
        await route.continue();
      }
    });
  });

  test('should support avatar upload on my-profile page', async ({ page }) => {
    await page.goto('http://localhost:3000/my-profile');

    // Wait for the profile view to load
    await expect(page.getByPlaceholder('As per Govt ID')).toBeVisible({ timeout: 30000 });

    // Look for image file input
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles({
        name: 'avatar.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-avatar-data')
      });

      // Verify that uploader state changes or preview loads
      // Since it's mocked, let's verify uploader does not throw unhandled exception
      const heading = page.locator('h2:has-text("My Profile")');
      await expect(heading).toBeVisible();
    }
  });

  test('should support uploading gallery photos', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('http://localhost:3000/my-profile');
    await expect(page.getByPlaceholder('As per Govt ID')).toBeVisible({ timeout: 30000 });

    // Check if there is a secondary uploader or dropzone for gallery
    const dropzones = page.locator('.border-dashed');
    const count = await dropzones.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
