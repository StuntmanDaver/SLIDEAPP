# Deployment Runbook

## Pre-Deployment Checklist
- [ ] All tests passed (`pnpm test`)
- [ ] No uncommitted changes
- [ ] `CHANGELOG.md` updated
- [ ] Staging verification complete

## 1. Database Migrations
```bash
# Check status
supabase migration list

# Push to production (if using remote)
supabase db push
```

## 2. Edge Functions
```bash
# Deploy all functions
supabase functions deploy --no-verify-jwt
```

## 3. Web Admin Dashboard
```bash
# Build and deploy (e.g. Vercel)
cd apps/admin
vercel deploy --prod
```

## 4. Mobile Apps (OTA Update)
```bash
# Consumer
cd apps/consumer
eas update --branch production

# Scanner
cd apps/scanner
eas update --branch production
```

## 5. Mobile Apps (Native Build)
```bash
# Only required for native code changes
eas build --platform all --profile production
```

## Rollback Procedure
1. **Edge Functions**: Re-deploy previous git commit.
2. **Database**: Use Supabase PITR (Point-in-Time Recovery) if data corruption.
3. **Mobile**: Revert EAS update via Expo dashboard.
