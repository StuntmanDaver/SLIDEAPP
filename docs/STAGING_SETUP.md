# Staging Environment Setup

## 1. Supabase Project
1. Create a new project named `slide-staging`.
2. Get API URL and Anon Key.
3. Link local CLI: `supabase link --project-ref <staging-ref>`.
4. Push migrations: `supabase db push`.
5. Set secrets:
   ```bash
   supabase secrets set --env-file .env.staging
   ```

## 2. Stripe Account
1. Use Stripe "Test Mode".
2. Create a restricted key for staging with `write` access.
3. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Supabase secrets.
4. Create Products and Prices in Test Mode matching your `seed.sql`.

## 3. Expo Projects
1. Create EAS project `slide-consumer-staging`.
2. Create EAS project `slide-scanner-staging`.
3. Configure `eas.json` with `staging` profile.

## 4. Environment Variables
Create `.env.staging` with:
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
STRIPE_PUBLISHABLE_KEY=...
```
