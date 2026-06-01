import { test, expect } from '@playwright/test';

test.describe('OCR Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[Browser Console]: ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', exception => console.log(`[Browser PageError]: ${exception.message}`));

    // Seed admin auth session
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'sb-hdqzlluauofytchbzgly-auth-token',
        JSON.stringify({
          access_token: 'mock-admin-token',
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
          user: { id: 'mock-admin-id', email: 'bhartiyarishte03@gmail.com' }
        })
      });
    });

    // Mock Supabase Database
    await page.route('**/rest/v1/**', async route => {
      const url = route.request().url();
      if (url.includes('/users')) {
        const userObj = {
          id: 'mock-admin-id',
          email: 'bhartiyarishte03@gmail.com',
          is_admin: true,
          role: 'admin',
          profile: {
            id: 'mock-admin-id',
            user_id: 'mock-admin-id',
            full_name: 'Admin User',
            is_approved: true,
            plan_type: 'free'
          }
        };
        const responseBody = url.includes('id=eq.') ? userObj : [userObj];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(responseBody)
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

  test('should handle OCR data extraction and form auto-fill', async ({ page }) => {
    // Mock Gemini API Response
    await page.route('**/generativelanguage.googleapis.com/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  full_name: 'Extracted User Name',
                  age: 28,
                  gender: 'Male',
                  dob: '1998-05-12',
                  address: '123 Test Street, Mumbai',
                  email: 'extracted@example.com',
                  phone: '+919999999999'
                })
              }]
            }
          }]
        })
      });
    });

    await page.goto('http://localhost:3000/admin');
    
    // Switch to Magic tab where MagicUploader is rendered
    await page.click('button:has-text("Magic Uploader"), button:has-text("Magic")');
    
    // Check if Magic Uploader / OCR area is visible
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    // Create a mock biodata file to upload
    const mockFile = {
      name: 'biodata.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-content')
    };

    // Set file input
    await fileInput.setInputFiles({
      name: mockFile.name,
      mimeType: mockFile.mimeType,
      buffer: mockFile.buffer
    });

    // Check that OCR values have populated the input fields
    const nameInput = page.locator('input[placeholder="Enter full name"]');
    await expect(nameInput).toHaveValue('Extracted User Name');

    const ageInput = page.locator('input[placeholder="e.g. 28"]');
    await expect(ageInput).toHaveValue('28');

    const genderSelect = page.locator('select');
    await expect(genderSelect).toHaveValue('Male');

    const addressTextarea = page.locator('textarea');
    await expect(addressTextarea).toHaveValue('123 Test Street, Mumbai');
  });

  test('should handle malformed OCR data gracefully', async ({ page }) => {
    // Mock Gemini API with broken JSON structure
    await page.route('**/generativelanguage.googleapis.com/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: 'This is not JSON text output'
              }]
            }
          }]
        })
      });
    });

    await page.goto('http://localhost:3000/admin');
    
    // Switch to Magic tab where MagicUploader is rendered
    await page.click('button:has-text("Magic Uploader"), button:has-text("Magic")');
    
    // Set file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'biodata.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-content')
    });

    // The component should catch the JSON parsing exception and not crash
    // Let's verify that the page error wasn't thrown or is handled
    const nameInput = page.locator('input[placeholder="Enter full name"]');
    await expect(nameInput).toBeVisible();
  });
});
