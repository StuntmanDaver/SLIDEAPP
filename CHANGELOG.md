# Changelog

All notable changes to the Slide app will be documented here.

## [Unreleased]

## [0.1.0] - 2026-01-13

### Added
- Initial project scaffolding and monorepo setup
- Database schema with 7 tables and RLS policies
- Supabase Auth with Apple/Google sign-in
- Stripe subscription integration
- Pass create/claim flow with deep links
- Rotating QR token system (20-30s TTL)
- Staff scanner app with redemption
- Admin dashboard with plans, users, staff, logs management

### Security
- RLS enabled on all tables
- Claim tokens stored hashed (SHA-256)
- QR tokens server-signed with short TTL
- Rate limiting on auth/claim/redeem endpoints
- Append-only audit log for all scans
