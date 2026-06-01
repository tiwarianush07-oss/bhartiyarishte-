import { test, expect } from '@playwright/test';

test.describe('Auth Flow Validation', () => {
  let consoleErrors = [];
  let failedRequests = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    failedRequests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', exception => {
      consoleErrors.push(exception.message);
    });

    // Mock auth API
    await page.route('**/auth/v1/**', async route => {
      const url = route.request().url();
      const method = route.request().method();
      
      if (url.includes('/signup') && method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-token', 
            refresh_token: 'mock-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: { 
              id: 'mock-user-id', 
              email: 'test@example.com',
              app_metadata: { provider: 'email' },
              user_metadata: { role: 'user' },
              created_at: new Date().toISOString()
            }
          })
        });
      } else if (url.includes('/token') && method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-token', 
            refresh_token: 'mock-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: { 
              id: 'mock-user-id', 
              email: 'test@example.com',
              app_metadata: { provider: 'email' },
              user_metadata: { role: 'user' },
              created_at: new Date().toISOString()
            }
          })
        });
      } else if (url.includes('/logout') || url.includes('/signout')) {
        await route.fulfill({ status: 200 });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-token', 
            refresh_token: 'mock-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: { 
              id: 'mock-user-id', 
              email: 'test@example.com',
              app_metadata: { provider: 'email' },
              user_metadata: { role: 'user' },
              created_at: new Date().toISOString()
            }
          })
        });
      }
    });

    // Mock PostgREST API
    await page.route('**/rest/v1/**', async route => {
      const url = route.request().url();
      const method = route.request().method();
      const headers = route.request().headers();
      const isSingle = (headers['accept'] && headers['accept'].includes('vnd.pgrst.object')) || 
                       (headers['Accept'] && headers['Accept'].includes('vnd.pgrst.object'));
      
      if (url.includes('/users') && method === 'GET') {
        const userObj = {
          id: 'mock-user-id',
          email: 'test@example.com',
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
      } else if (url.includes('/profiles') && method === 'GET') {
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
  });

  test('should support user signup', async ({ page }) => {
    // Override /users response for signup to return profile_completed: false
    // Playwright route handlers are LIFO, so this takes precedence.
    await page.route('**/rest/v1/**', async route => {
      const url = route.request().url();
      const method = route.request().method();
      if (url.includes('/users') && method === 'GET') {
        const headers = route.request().headers();
        const isSingle = (headers['accept'] && headers['accept'].includes('vnd.pgrst.object')) || 
                         (headers['Accept'] && headers['Accept'].includes('vnd.pgrst.object'));
        const userObj = {
          id: 'mock-user-id',
          email: 'test@example.com',
          role: 'user',
          is_admin: false,
          profile: {
            id: 'mock-user-id',
            user_id: 'mock-user-id',
            full_name: 'Test Profile User',
            is_approved: true,
            is_verified: false,
            profile_completed: false,
            plan_type: 'free'
          }
        };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingle ? userObj : [userObj])
        });
      } else {
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

    await page.goto('http://localhost:3000/login');
    // Switch to SignUp mode
    await page.getByRole('button', { name: 'Signup', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Create Profile' })).toBeVisible();

    // Fill credentials and register
    await page.getByPlaceholder('name@example.com').fill('test-signup@example.com');
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should redirect to my-profile after signup (LoginPage always redirects new signups here)
    await page.waitForURL('**/my-profile', { timeout: 15000 });
    expect(page.url()).toContain('/my-profile');
  });

  test('should support login', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder('name@example.com').fill('test-login@example.com');
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.getByRole('button', { name: 'Secure Login' }).click();

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('should support logout', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder('name@example.com').fill('test-login@example.com');
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.getByRole('button', { name: 'Secure Login' }).click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Open user menu / logout
    const logoutBtn = page.getByRole('button', { name: /Sign Out|Logout/i });
    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click();
      await page.waitForURL('**/', { timeout: 15000 });
      expect(page.url()).toBe('http://localhost:3000/');
    }
  });
});
