# Operational Runbook

## Daily Operations (Venue Staff)

### 1. Opening
- [ ] Ensure all scanner devices are charged (100%).
- [ ] Connect scanners to venue Wi-Fi.
- [ ] Log in to `Slide Scanner` app with staff credentials.
- [ ] Verify "Torch" works.
- [ ] Perform a test scan (using a test pass or verifying previous history).

### 2. During Operation
- **Valid Scan**: Green screen. Allow entry.
- **Used/Invalid**: Red/Yellow screen. Deny entry.
- **Network Error**: Verify Wi-Fi. If down, use offline list (if available) or check physical ID + backup list.
- **App Crash**: Restart app. Re-login if needed.

### 3. Closing
- [ ] Logout of scanner app (optional, auto-logout handles it).
- [ ] Charge devices.
- [ ] Report any issues to Admin.

## Incident Response (Admin)

### 1. System Outage
- **Severity 1 (Redeem Failures)**:
  - Check Supabase Status.
  - Check Edge Function logs.
  - Instruct venues to use manual verification (Backup List).

### 2. Fraud Attempt
- **Repeated Invalid Scans**:
  - Identify Device ID in Dashboard.
  - Ban user associated with passes if pattern confirmed.
  - Revoke all passes from that user.

### 3. Support
- **User cannot claim pass**:
  - Check `passes` table for status.
  - Resend link or revoke and issue new pass.
