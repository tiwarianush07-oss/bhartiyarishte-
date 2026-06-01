
# Production Deployment Checklist

1. [ ] **Supabase Environment Variables**: Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. [ ] **Razorpay Keys**: Set production API keys and Webhook secret.
3. [ ] **Edge Functions Secret**: Set Twilio/Meta API keys in `supabase secrets set`.
4. [ ] **Storage Buckets**: Create `profile_photos` bucket with appropriate CORS and Public access rules.
5. [ ] **Custom Domain**: Connect your domain via Vercel/Cloudflare.
6. [ ] **Email/WhatsApp Templates**: Submit templates for approval with Meta/Wati.

# Security Hardening (Non-Negotiable)

1. [ ] **RLS Audit**: Run `SELECT * FROM pg_policies` to ensure no table has `PUBLIC` write access.
2. [ ] **Rate Limiting**: Enforce in Edge Functions via IP hashing.
3. [ ] **PII Encryption**: Consider Column-Level Encryption for sensitive details like salary or full address.
4. [ ] **API Shield**: Use Cloudflare WAF to block bot attacks on OTP endpoints.
5. [ ] **Data Deletion**: Implement GDPR-compliant "Delete my account" which triggers an Edge Function to remove storage files and DB rows.
