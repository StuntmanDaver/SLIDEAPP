# Changelog

All notable changes to the Slide app will be documented here.

## [Unreleased]

## [0.2.1] - 2026-01-21

### Added - Stripe Customer Portal Configuration
- Created `scripts/setup-stripe.ts` - automated Stripe setup script that:
  - Creates Products for each membership tier (Basic, Plus, Premium)
  - Creates Prices (monthly subscriptions and one-time purchases)
  - Configures the Stripe Customer Portal with cancellation, payment updates, and invoice history
  - Outputs SQL for database updates
- Added `pnpm setup:stripe` command to package.json
- Added `stripe` (^14.13.0) and `dotenv` (^16.4.5) dependencies

### Changed
- Updated `stripe-create-portal-session` Edge Function to use app deep link (`slide://account`) as return URL

### Configured - Stripe (LIVE Mode)
- **Products Created:**
  - `prod_TpaVYT4gI2diaL` - Slide Basic ($20/month, 3 passes)
  - `prod_TpaVYx5XHscm3U` - Slide Plus ($50/month, 6 passes)
  - `prod_TpaVjlSrAzaQN1` - Slide Premium ($80/month, 9 passes)
- **Prices Created:**
  - Basic Monthly: `price_1SrvKTC1JUIZB7aRRbLYoCuR`
  - Basic One-Time: `price_1SrvKTC1JUIZB7aRDuE5hmZr`
  - Plus Monthly: `price_1SrvKTC1JUIZB7aR5lo9ZPcv`
  - Plus One-Time: `price_1SrvKUC1JUIZB7aR9QwDlLUe`
  - Premium Monthly: `price_1SrvKUC1JUIZB7aRcGJxMqyO`
  - Premium One-Time: `price_1SrvKUC1JUIZB7aR9BSFJXlX`
- **Portal Configuration:** `bpc_1SrvLQC1JUIZB7aRhn6VPOKf`
  - Customer profile updates (email, name, phone, address)
  - Payment method updates
  - Invoice history
  - Subscription cancellation (at period end, with reason collection)
  - Subscription plan switching with proration
- **Database Updated:** All 6 plans updated with real Stripe price IDs
- **Supabase Secrets:** `STRIPE_SECRET_KEY` added to Edge Functions

### Migration
- Added `20260121000001_update_stripe_price_ids.sql` with applied Stripe price IDs

## [0.2.0] - 2026-01-13

### Added - Phase 10: Consumer App Core
- Tab navigation (Home, Passes, QR, Account)
- Home screen with membership status and "Send Pass" flow
- Pass wallet UI with status badges
- Secure QR display with rotating token and auto-refresh
- Deep link handling for claiming passes
- Account management screen

### Added - Phase 11: Consumer App Polish
- Stripe PaymentSheet integration for subscriptions
- Haptic feedback and spring animations
- Offline handling with network status banner
- Onboarding flow with secure storage state
- Push notification permission setup

### Added - Phase 12: Scanner App Core
- Staff authentication flow with role checks
- QR Code scanner with torch control
- Real-time pass validation via Edge Function
- Scan result overlays (Valid, Used, Invalid, etc.)
- Scan history stored locally

### Added - Phase 13: Scanner App Polish
- Secure session management with auto-logout
- Network error handling and retry logic
- Haptic and visual feedback for scans
- Device ID tracking for audit logs

### Added - Phase 14: Admin Dashboard
- Protected admin routes and login
- Dashboard overview with real-time stats
- Plans management (Edit passes/period, Enable/Disable)
- User management (Search, Ban/Unban, View Details)
- Staff management (Invite, Disable)
- Scan logs explorer with CSV export
- Analytics charts (Volume, Distribution)

### Added - Phase 15: Testing & QA
- Unit tests for Edge Functions (auth, pass creation)
- Cryptographic tests for QR token signing/verification
- Integration tests for full Pass Lifecycle (Create -> Claim -> Redeem)
- Webhook tests for Stripe integration
- Load testing script (k6) for high-concurrency redemption

### Added - Phase 16: DevOps & Infrastructure
- GitHub Actions CI/CD pipeline (Lint, Test, Deploy)
- Staging environment configuration guide
- Production setup documentation
- Monitoring and Alerting strategy
- Deployment Runbook

### Added - Phase 17: Launch Prep
- Security Audit checklist
- App Store metadata and screenshot plan
- Operational Runbook for venue staff and admins

## [0.1.0] - 2026-01-13

### Added - Phase 1: Project Foundation
- Monorepo structure with pnpm workspace
- Consumer app (Expo) with Tailwind/NativeWind styling
- Scanner app (Expo) - staff only, minimal UI
- Admin dashboard (Next.js) with Tailwind
- Shared package (@slide/shared) with types, constants, schemas
- Initial CHANGELOG.md
- Git repository with .gitignore

### Added - Phase 2: Database & Schema
- 7 PostgreSQL tables with RLS policies:
  - profiles (user data)
  - plans (subscription plans)
  - subscriptions (Stripe integration)
  - pass_balances (per-period allowances)
  - passes (individual pass records, full lifecycle)
  - staff_users (staff roles and status)
  - scan_events (append-only audit log)
- Automatic profile creation on user signup
- Database indexes for performance

### Added - Phase 3: Authentication
- Supabase Auth with Apple and Google SSO
- Staff email/password authentication
- Auth middleware for Edge Functions (JWT verification)
- Consumer auth screen with sign-in buttons
- Scanner staff login screen with role verification

### Added - Phase 4: Stripe Billing
- stripe-init-subscription Edge Function
- stripe-webhook Edge Function with idempotent processing
- Automatic pass balance reset on renewal
- Subscription status tracking

### Added - Phase 5: Pass Lifecycle
- create-pass Edge Function (atomic pass creation)
- claim-pass Edge Function (single-use claim tokens)
- Token generation and SHA-256 hashing
- Deep link support (slide://claim and HTTPS fallback)
- Pass state machine: created → claimed → redeemed

### Added - Phase 6: QR Token System
- QR token signing with HMAC-SHA256
- issue-qr-token Edge Function
- QR token verification with expiration checks
- 20-30 second TTL for token security
- JTI (JWT ID) for replay protection

### Added - Phase 7: Scanner & Redemption
- redeem-pass Edge Function (atomic DB transition)
- Scan result types: VALID, USED, EXPIRED, INVALID, REVOKED
- Scan event logging with latency tracking
- Staff-only authorization
- Scanner login component for staff authentication

### Added - Phase 8: Admin Dashboard
- Admin layout with sidebar navigation
- Supabase client initialization for admin
- Dashboard structure ready for:
  - Plans management
  - Users management
  - Staff accounts
  - Scan logs analytics

### Added - Phase 9: Shared Utilities
- QR token signing and verification (crypto.subtle)
- Token generation and hashing utilities
- Auth verification helpers
- Error and success response builders
- Edge Function shared constants

### Security
- RLS enabled on all 7 tables
- Claim tokens stored hashed (SHA-256) only
- QR tokens server-signed with HMAC-SHA256
- Service role required for state changes
- Atomic database operations prevent race conditions
- Append-only scan_events audit log (no updates/deletes)
- Staff authentication and role verification
- JWT verification on all Edge Functions

### Infrastructure
- Supabase config.toml for local development
- 7 database migrations (numbered timestamps)
- 6 Edge Functions ready for deployment
- Environment variable templates
- Monorepo with pnpm workspaces

### Documentation
- AUTH_SETUP.md with Apple/Google provider setup
- All code follows conventions from claude.md
- Design tokens configured from Design.md
- Full schema references from PRD.md
