# Monitoring & Alerting

## 1. Supabase Dashboard
- **Database Health**: CPU, RAM, Disk IO.
- **Edge Functions**: Invocations, Errors, Execution Time.
- **Auth**: Active users, Failed logins.

## 2. Alerts Configuration
Set up alerts for:
- **High Error Rate**: > 5% on any Edge Function.
- **Latency**: p95 > 1s for `redeem-pass`.
- **Database**: > 80% CPU utilization.

## 3. Logging
- All critical paths (Payment, Redeem) log to `scan_events` or Supabase Logs.
- Use `console.error` in Edge Functions for structured logging.

## 4. Client-Side
- Use Sentry (recommended) for React Native crash reporting.
- Log network failures in `apps/consumer` and `apps/scanner`.
