# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile-responsiveness.spec.js >> Mobile Responsiveness on Samsung Galaxy S20 >> Verify admin panel responsive layers, sidebar, inputs, and touch targets
- Location: tests\mobile-responsiveness.spec.js:14:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Users' })
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 30000ms
  - waiting for getByRole('heading', { name: 'Users' })

```

```yaml
- navigation:
  - link "Bhartiya Rishtey Logo Bhartiya Rishtey Trusted Since 2016":
    - /url: /
    - img "Bhartiya Rishtey Logo"
    - text: Bhartiya Rishtey Trusted Since 2016
  - button "Toggle Menu":
    - img
- main:
  - paragraph: Loading...
```

```
Tearing down "context" exceeded the test timeout of 90000ms.
```