# System Architecture

```text
[ Client (React SPA) ]
       |
       | (HTTPS / WSS)
       v
[ API Gateway (Supabase) ]
       |
       +-----> [ Edge Functions (Deno) ] ------> [ WhatsApp/SMS Provider (Twilio/Wati) ]
       |                                |
       |                                +------> [ Payment Gateway (Razorpay) ]
       |
       +-----> [ Auth Service (GoTrue) ]
       |
       +-----> [ Storage (S3-compatible) ]
       |
       +-----> [ PostgreSQL DB ]
               |
               +--- [ RLS Engine ]
               |
               +--- [ Realtime Bus ]
```

## Data Flow: OTP Authentication
1.  **Phone Input**: User enters their +91 phone number on the client.
2.  **Invoke `send-otp`**: The client calls the `send-otp` Supabase Edge Function.
3.  **Abuse Check**: The function first queries the `phone_blocks` table to check if the number is currently under a 24-hour block. If so, it returns an error.
4.  **Rate Limiting**: The function then queries `otp_requests` to count how many OTPs have been sent to this number in the last 5 minutes. If the count is 3 or more, it adds an entry to `phone_blocks` for 24 hours and returns an error.
5.  **OTP Generation**: If checks pass, the function generates a secure 6-digit OTP.
6.  **Store Hash**: It creates a SHA-256 hash of the OTP and stores it in the `otp_requests` table with a 5-minute `expires_at` timestamp.
7.  **Send OTP**: The function sends the plain-text OTP to the user via the WhatsApp Cloud API (or a fallback SMS provider).
8.  **OTP Input**: The user enters the received OTP on the client.
9.  **Invoke `verify-otp`**: The client calls the `verify-otp` Edge Function with the phone number and OTP.
10. **Verification**: The function retrieves the latest `otp_requests` record for the phone number. It hashes the user-provided OTP and compares it to the stored hash. It also checks that the request has not expired.
11. **Failure Handling**: If verification fails, a failure attempt is logged. If this is the 3rd consecutive failure, the number is blocked for 24 hours by adding an entry to `phone_blocks`.
12. **Success**: If the OTP is correct and not expired, the function deletes the `otp_requests` record and returns a valid JWT session token to the client, logging them in.

## Payment & Subscription Flow
1.  **Initiate Purchase**: The user clicks "Choose Plan" on the client.
2.  **Invoke `create-order`**: The client calls the `create-order` Supabase Edge Function with the chosen `plan_id`.
3.  **Create Razorpay Order**: The Edge Function (server-side) securely calls the Razorpay API with the amount and details to create an order. It returns the `order_id` to the client. **The API secret is never exposed to the client.**
4.  **Open Checkout**: The client uses the received `order_id` to initialize and open the Razorpay Checkout modal.
5.  **Payment Success**: Upon successful payment, the client receives `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` from the Razorpay modal.
6.  **Webhook Verification (Critical)**: Razorpay sends a separate, secure webhook event to a dedicated `verify-payment` Edge Function endpoint.
7.  **Signature Validation**: The `verify-payment` function validates the integrity of the webhook event by checking the `x-razorpay-signature` header. This prevents spoofed requests.
8.  **Database Update**: If the signature is valid, the function:
    a. Inserts a new record into the `payments` table with all transaction details and `status = 'success'`.
    b. Updates the corresponding row in the `users` table, setting `is_premium = true`.
9.  **Client Confirmation**: The client is notified of the successful purchase and their UI is updated to reflect premium status. The webhook is the source of truth for the subscription status.


## Matchmaking Logic
- SQL View `profile_matches` calculates a weighted score based on preferences.
- Boost factors: Premium status (+20%), Recently active (+10%), Location match (+30%).

## Security & Abuse Prevention
- **Rate Limiting**: Supabase API endpoints should have server-side rate limiting configured to prevent brute-force attacks and resource exhaustion, especially on authentication and search endpoints.
- **Web Application Firewall (WAF)**: A WAF (like Cloudflare) should be placed in front of the Supabase API to provide an additional layer of security, including bot detection, DDoS mitigation, and blocking malicious traffic patterns.
- **Anti-Scraping**: In addition to rate limiting, search result pagination should be limited in depth to prevent bots from easily scraping the entire user database. Captchas can be considered for high-volume actions.