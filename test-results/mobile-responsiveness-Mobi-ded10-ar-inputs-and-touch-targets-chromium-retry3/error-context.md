# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile-responsiveness.spec.js >> Mobile Responsiveness on Android Chrome >> Verify admin panel responsive layers, sidebar, inputs, and touch targets
- Location: tests\mobile-responsiveness.spec.js:14:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByLabel('Toggle Menu')
Expected: visible
Error: strict mode violation: getByLabel('Toggle Menu') resolved to 2 elements:
    1) <button aria-label="Toggle Menu" class="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-gray-100 transition active:scale-95">…</button> aka getByRole('navigation').filter({ hasText: 'Bhartiya RishteyTrusted Since' }).getByLabel('Toggle Menu')
    2) <button aria-label="Toggle Menu" class="md:hidden p-2 w-12 h-12 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-full active:scale-95 transition-transform">…</button> aka locator('header').getByRole('button', { name: 'Toggle Menu' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByLabel('Toggle Menu')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e6]:
      - link "Bhartiya Rishtey Logo Bhartiya Rishtey Trusted Since 2016" [ref=e8] [cursor=pointer]:
        - /url: /
        - img "Bhartiya Rishtey Logo" [ref=e9]
        - generic [ref=e10]:
          - generic [ref=e11]: Bhartiya Rishtey
          - generic [ref=e12]: Trusted Since 2016
      - button "Toggle Menu" [ref=e14]:
        - img [ref=e15]
  - main [ref=e18]:
    - generic [ref=e19]:
      - complementary [ref=e20]:
        - generic [ref=e21]:
          - heading "Admin Portal" [level=2] [ref=e22]
          - button [ref=e23]:
            - img [ref=e24]
        - navigation [ref=e26]:
          - button "All Users" [ref=e27]:
            - img [ref=e28]
            - generic [ref=e30]: All Users
          - button "Add User (Manual)" [ref=e31]:
            - img [ref=e32]
            - generic [ref=e34]: Add User (Manual)
          - button "Magic Uploader" [ref=e35]:
            - img [ref=e36]
            - generic [ref=e38]: Magic Uploader
          - button "Settings / Tools" [ref=e39]:
            - img [ref=e40]
            - generic [ref=e43]: Settings / Tools
      - generic [ref=e44]:
        - generic [ref=e45]:
          - generic [ref=e46]:
            - button "Toggle Menu" [ref=e47]:
              - img [ref=e48]
            - heading "Users" [level=1] [ref=e50]
          - button [ref=e51]:
            - img [ref=e52]
        - main [ref=e54]:
          - generic [ref=e55]:
            - generic [ref=e56]:
              - button "all (2)" [ref=e57]
              - button "active (1)" [ref=e58]
              - button "pending (1)" [ref=e59]
            - generic [ref=e60]:
              - generic [ref=e61] [cursor=pointer]:
                - generic [ref=e63]:
                  - heading "Super Admin" [level=3] [ref=e64]
                  - paragraph [ref=e65]: BR999999
                  - paragraph [ref=e66]: bhartiyarishte03@gmail.com
                - img [ref=e69]
              - generic [ref=e71] [cursor=pointer]:
                - generic [ref=e73]: A
                - generic [ref=e74]:
                  - heading "Amit Patel" [level=3] [ref=e75]
                  - paragraph [ref=e76]: BR123456
                  - paragraph [ref=e77]: user1@example.com
                - img [ref=e80]
        - button [ref=e82]:
          - img [ref=e83]
        - generic [ref=e85]:
          - button "Users" [ref=e86]:
            - img [ref=e88]
            - generic [ref=e90]: Users
          - button "Magic" [ref=e91]:
            - img [ref=e93]
            - generic [ref=e95]: Magic
          - button "Add" [ref=e96]:
            - img [ref=e98]
            - generic [ref=e100]: Add
          - button "Settings" [ref=e101]:
            - img [ref=e103]
            - generic [ref=e106]: Settings
  - button [ref=e108]:
    - img [ref=e109]
  - contentinfo [ref=e111]:
    - generic [ref=e112]:
      - generic [ref=e113]:
        - generic [ref=e114]:
          - img "Logo" [ref=e115]
          - generic [ref=e116]:
            - generic [ref=e117]: Bhartiya Rishtey
            - generic [ref=e118]: Trusted Matrimony
        - paragraph [ref=e119]: Verified matrimonial excellence, serving Indian families with trust and heritage for nearly a decade.
        - paragraph [ref=e121]: Browse profiles on the go using the app.
      - generic [ref=e122]:
        - heading "Our Offices" [level=4] [ref=e123]
        - generic [ref=e124]:
          - generic [ref=e125]:
            - paragraph [ref=e126]: 1. Raipur (Registration Office)
            - paragraph [ref=e127]: Near Spark, Behind Airtel Office, Ward No. 19, Raipur, Chhattisgarh – 490042
          - generic [ref=e128]:
            - paragraph [ref=e129]: 2. Bhilai (Sales Team)
            - paragraph [ref=e130]: Bharat Infotech, Front of Ghadi Chowk, Supela, Bhilai, District Durg, Chhattisgarh – 490023
          - generic [ref=e131]:
            - paragraph [ref=e132]: 3. Pune (Tech Team)
            - paragraph [ref=e133]: 2nd Floor, Office No. 213, Mainland Hub, Kesnand Rd, Wagholi, Pune, Maharashtra – 412207
      - generic [ref=e134]:
        - heading "Support & Connect" [level=4] [ref=e135]
        - generic [ref=e136]:
          - generic [ref=e137]:
            - paragraph [ref=e138]: "Email Support:"
            - paragraph [ref=e139]: helpbhartiyarishtey09@gmail.com
            - paragraph [ref=e140]: bhartiyarishte03@gmail.com
          - generic [ref=e141]:
            - paragraph [ref=e142]: Contact Us
            - paragraph [ref=e143]: 📞 9109330332
            - paragraph [ref=e144]: 📞 7898680332
          - generic [ref=e145]:
            - paragraph [ref=e146]: Connect with us
            - generic [ref=e147]:
              - link [ref=e148] [cursor=pointer]:
                - /url: https://www.instagram.com/bhartiya_rishtey
                - img [ref=e149]
              - link [ref=e151] [cursor=pointer]:
                - /url: https://www.facebook.com/share/1Aoakao3P7/
                - img [ref=e152]
              - link [ref=e154] [cursor=pointer]:
                - /url: https://t.me/+ccvYJYxatiY1NWJl
                - img [ref=e155]
      - generic [ref=e157]:
        - heading "Quick Links" [level=4] [ref=e158]
        - generic [ref=e159]:
          - link "Success Stories" [ref=e160] [cursor=pointer]:
            - /url: /success-stories
          - link "Plans" [ref=e161] [cursor=pointer]:
            - /url: /pricing
          - link "My Profile" [ref=e162] [cursor=pointer]:
            - /url: /my-profile
    - generic [ref=e163]:
      - paragraph [ref=e164]: © 2016 Bhartiya Rishtey. All Rights Reserved.
      - generic [ref=e165]:
        - paragraph [ref=e166]: Developed by Anush Tiwari
        - paragraph [ref=e167]: 📞 8120476475
        - paragraph [ref=e168]: 📧 tiwarianush07@gmail.com
```