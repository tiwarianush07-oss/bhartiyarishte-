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
- contentinfo:
  - img "Logo"
  - text: Bhartiya Rishtey Trusted Matrimony
  - paragraph: Verified matrimonial excellence, serving Indian families with trust and heritage for nearly a decade.
  - paragraph: Browse profiles on the go using the app.
  - heading "Our Offices" [level=4]
  - paragraph: 1. Raipur (Registration Office)
  - paragraph: Near Spark, Behind Airtel Office, Ward No. 19, Raipur, Chhattisgarh – 490042
  - paragraph: 2. Bhilai (Sales Team)
  - paragraph: Bharat Infotech, Front of Ghadi Chowk, Supela, Bhilai, District Durg, Chhattisgarh – 490023
  - paragraph: 3. Pune (Tech Team)
  - paragraph: 2nd Floor, Office No. 213, Mainland Hub, Kesnand Rd, Wagholi, Pune, Maharashtra – 412207
  - heading "Support & Connect" [level=4]
  - paragraph: "Email Support:"
  - paragraph: helpbhartiyarishtey09@gmail.com
  - paragraph: bhartiyarishte03@gmail.com
  - paragraph: Contact Us
  - paragraph: 📞 9109330332
  - paragraph: 📞 7898680332
  - paragraph: Connect with us
  - link:
    - /url: https://www.instagram.com/bhartiya_rishtey
    - img
  - link:
    - /url: https://www.facebook.com/share/1Aoakao3P7/
    - img
  - link:
    - /url: https://t.me/+ccvYJYxatiY1NWJl
    - img
  - heading "Quick Links" [level=4]
  - link "Success Stories":
    - /url: /success-stories
  - link "Plans":
    - /url: /pricing
  - link "My Profile":
    - /url: /my-profile
  - paragraph: © 2016 Bhartiya Rishtey. All Rights Reserved.
  - paragraph: Developed by Anush Tiwari
  - paragraph: 📞 8120476475
  - paragraph: 📧 tiwarianush07@gmail.com
```

```
Tearing down "context" exceeded the test timeout of 90000ms.
```