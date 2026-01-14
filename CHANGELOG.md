# Changelog

All notable changes to the Slide app will be documented here.

## [Unreleased]

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
