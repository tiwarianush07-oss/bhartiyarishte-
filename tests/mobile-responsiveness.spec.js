import { test, expect, devices } from '@playwright/test';

// Define mobile devices to test using explicit viewports and user agents
const mobileDevices = [
  { name: 'Android Chrome', viewport: devices['Pixel 5'].viewport, userAgent: devices['Pixel 5'].userAgent },
  { name: 'Samsung Galaxy S20', viewport: { width: 412, height: 915 }, userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36' },
  { name: 'iPhone SE (small-width)', viewport: devices['iPhone SE'].viewport, userAgent: devices['iPhone SE'].userAgent }
];

for (const device of mobileDevices) {
  test.describe(`Mobile Responsiveness on ${device.name}`, () => {
    test.use({ viewport: device.viewport, userAgent: device.userAgent });

    test('Verify admin panel responsive layers, sidebar, inputs, and touch targets', async ({ page }) => {
      // Set test timeout to 45s for slow dev server compilation
      test.setTimeout(90000);

      // Listen to console and page errors
      page.on('console', msg => {
        console.log(`[Browser Console ${device.name}]: ${msg.type()}: ${msg.text()}`);
      });
      page.on('pageerror', exception => {
        console.error(`[Unhandled Exception ${device.name}]: ${exception.message}`);
      });

      // Seed the admin auth session in localStorage before page load
      await page.addInitScript(() => {
        window.localStorage.setItem(
          'sb-hdqzlluauofytchbzgly-auth-token',
          JSON.stringify({
            access_token: 'mock-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh',
            user: {
              id: 'mock-admin-id',
              email: 'bhartiyarishte03@gmail.com',
              app_metadata: { provider: 'email' },
              user_metadata: { role: 'admin', is_admin: true },
              created_at: new Date().toISOString()
            },
            expires_at: Math.floor(Date.now() / 1000) + 3600
          })
        );
      });

      // Mock Supabase API calls
      await page.route('**/auth/v1/**', async route => {
        const url = route.request().url();
        if (url.includes('/session') || url.includes('/user')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              access_token: 'mock-token',
              token_type: 'bearer',
              expires_in: 3600,
              refresh_token: 'mock-refresh',
              user: {
                id: 'mock-admin-id',
                email: 'bhartiyarishte03@gmail.com',
                app_metadata: { provider: 'email' },
                user_metadata: { role: 'admin', is_admin: true },
                created_at: new Date().toISOString()
              }
            })
          });
        } else {
          await route.continue();
        }
      });

      // Mock database requests
      await page.route('**/rest/v1/**', async route => {
        const url = route.request().url();
        const method = route.request().method();
        const headers = route.request().headers();
        console.log(`[Mock DB Request]: ${method} ${url} - Headers: ${JSON.stringify(headers)}`);

        if (url.includes('/users') && method === 'GET') {
          // Check if single record is requested (contains .single() headers)
          const isSingle = (headers['accept'] && headers['accept'].includes('vnd.pgrst.object')) || 
                           (headers['Accept'] && headers['Accept'].includes('vnd.pgrst.object'));
          console.log(`[Mock DB Users GET]: isSingle=${isSingle}`);

          const adminObj = {
            id: 'mock-admin-id',
            email: 'bhartiyarishte03@gmail.com',
            is_admin: true,
            role: 'admin',
            profile: {
              id: 'mock-admin-id',
              full_name: 'Super Admin',
              user_display_id: 'BR999999',
              is_approved: true,
              avatar_url: 'https://i.pravatar.cc/150?img=3',
              plan_type: 'elite'
            }
          };

          if (isSingle) {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(adminObj)
            });
          } else {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify([
                adminObj,
                {
                  id: 'mock-user-1',
                  email: 'user1@example.com',
                  is_admin: false,
                  role: 'user',
                  profile: {
                    id: 'mock-user-1',
                    full_name: 'Amit Patel',
                    user_display_id: 'BR123456',
                    is_approved: false,
                    avatar_url: '',
                    plan_type: 'free'
                  }
                }
              ])
            });
          }
        } else if (url.includes('/get_website_schemas') && method === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              { schema_name: 'profiles', frontend_name: 'Profiles Table' },
              { schema_name: 'interests', frontend_name: 'User Interests' }
            ])
          });
        } else {
          // Default mock response to prevent hang
          if (method === 'HEAD') {
            await route.fulfill({
              status: 200,
              headers: { 'Content-Range': '0-0/0' }
            });
          } else {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify([])
            });
          }
        }
      });

      // Navigate directly to the admin dashboard and wait for DOM loaded
      await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded', timeout: 30000 });

      // 1. Verify Top Bar Header is visible
      const headerTitle = page.getByRole('heading', { name: 'Users' });
      await expect(headerTitle).toBeVisible({ timeout: 30000 });

      // 2. Check that the sidebar opens and closes on mobile
      const menuButton = page.getByLabel('Toggle Menu');
      await expect(menuButton).toBeVisible();
      
      // Tap menu button
      await menuButton.click();
      
      // Verify sidebar is translated/visible
      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();
      
      // Close sidebar via close button
      const closeButton = page.locator('aside button:has(svg)').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // 3. Verify touch target dimensions on Bottom Navigation Bar
      const bottomNav = page.locator('div.md\\:hidden.fixed.bottom-0');
      await expect(bottomNav).toBeVisible();

      const bottomButtons = page.locator('div.md\\:hidden.fixed.bottom-0 button');
      const count = await bottomButtons.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const btn = bottomButtons.nth(i);
        const box = await btn.boundingBox();
        expect(box.height).toBeGreaterThanOrEqual(44); // Meets standard target guidelines
      }

      // 4. Verify no horizontal overflow on page layout
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = page.viewportSize().width;
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
    });
  });
}
