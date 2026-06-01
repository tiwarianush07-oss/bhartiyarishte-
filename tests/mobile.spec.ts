import { test, expect, devices } from '@playwright/test';

// Enforce mobile viewport
test.use({ ...devices['Pixel 5'] });

test.describe('Mobile UX Validation', () => {

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
            full_name: 'Mobile User',
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
          full_name: 'Mobile User',
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
  });

  test('should verify touch responsiveness and navigation menu', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Bottom Navigation Bar should be visible on mobile screens
    const bottomNav = page.locator('div.fixed.bottom-0');
    if (await bottomNav.count() > 0) {
      await expect(bottomNav).toBeVisible();
    }

    // Header title should render properly
    const brandText = page.locator('nav a');
    await expect(brandText.first()).toBeVisible();

    // Verify touch action on sidebar toggle (hamburger menu)
    const hamburger = page.locator('nav div.md\\:hidden button').first();
    if (await hamburger.isVisible()) {
      await hamburger.click();
      
      // Sidebar menu should slide/pop open
      const sidebarLink = page.locator('nav div.md\\:hidden a:has-text("Dashboard"), nav div.md\\:hidden a:has-text("Search")');
      await expect(sidebarLink.first()).toBeVisible();
    }
  });

  test('should verify viewport width safety on small screens', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // Evaluate if document width fits inside viewport
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize().width;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });
});
