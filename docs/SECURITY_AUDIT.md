# Security Audit Checklist

## 1. Row Level Security (RLS)
- [ ] `profiles`: Users can only read/update their own profile.
- [ ] `plans`: Public read-only. Service role updates.
- [ ] `subscriptions`: Users read own. Service role updates.
- [ ] `pass_balances`: Users read own. Service role updates.
- [ ] `passes`: Users read own/issued. Service role updates status.
- [ ] `staff_users`: Admins manage. Staff read own.
- [ ] `scan_events`: Append-only. Admins read.

## 2. Edge Functions
- [ ] All functions verify JWT (`getAuthenticatedUser`).
- [ ] Role checks (`requireRole`) for admin functions.
- [ ] Inputs validated (`zod` or manual checks).
- [ ] No sensitive data returned in errors.

## 3. Storage & Secrets
- [ ] `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` set in Supabase Secrets.
- [ ] `QR_SIGNING_SECRET` set in Supabase Secrets.
- [ ] No secrets committed to git (check `.env` and `config.toml`).

## 4. Client Side
- [ ] `expo-secure-store` used for auth tokens.
- [ ] No hardcoded API keys (except Anon Key/Publishable Key).
- [ ] Deep link handling validates `token` format.

## 5. Rate Limiting
- [ ] Edge Functions have rate limiting (if using Supabase default or custom middleware).
- [ ] Login endpoints protected against brute force (Supabase Auth default).
