Slide — Nightclub Line-Skip Pass App (MVP)

Slide is a membership-based mobile app that lets members send a limited number of line-skip passes to friends. Friends present a short-lived rotating QR code at the door. Staff scans and redeems the pass exactly once. An admin dashboard (web) manages plans, memberships, staff accounts, and scan logs.

This repo is intentionally minimal: no social graph, no messaging, no promotions—only what's essential to operate safely at a nightclub door.

---

## Documentation Map

**Start here based on your role:**

- **[Design.md](./Design.md)** — Visual design language, component specs, color tokens, typography (for designers & frontend engineers)
- **[PRD.md](./PRD.md)** — Product requirements, user journeys, functional specs, acceptance criteria (for PMs & engineers)
- **[claude.md](./claude.md)** — Architecture, database schema, code conventions, security model (for backend engineers & AI assistants)

---

## Table of Contents
Product Summary


Architecture


Core Flows


Tech Stack


Monorepo Layout


Environment Variables


Local Development


Database Schema (High Level)


API (Edge Functions)


Auth & Roles


Fraud & Security Model


Performance Targets


Admin Dashboard


Staff Scanner App


Stripe Billing


Deep Links


Observability


Testing


Release Workflow (App Store Connect MCP)


Operational Runbook


FAQ



Product Summary
MVP Behavior (No Extras)
Users buy a membership (Stripe subscription).


Membership includes N passes per billing period (default 3, admin-adjustable).


Members can send a pass to a friend via claim-by-link.


Friend claims pass into an authenticated account.


Friend displays a rotating, short-lived QR token (10–30s TTL).


Staff scans QR and backend redeems pass exactly once and returns:


VALID / USED / INVALID / EXPIRED / REVOKED


Admin dashboard (same backend) can:


set pass allowance


manage memberships


view scan logs


revoke/ban users


create/disable staff accounts



Architecture
Recommended MVP: "Two Apps + Web Admin"
apps/consumer — iOS/Android consumer app


apps/scanner — iOS/Android staff scanner app (separate binary for security + speed)


apps/admin — Next.js admin dashboard


supabase/ — DB schema, RLS policies, Edge Functions


Why two mobile apps?
Scanner features never ship inside the consumer binary.


Cleaner security boundary and lower risk of role-gating mistakes.


Staff UX can be ultra-minimal and fast at the door.



Core Flows
1) Sign-in
Consumer: Sign in with Apple + Google


Staff: provisioned accounts (email/password) for scanner/admin roles


2) Purchase membership (Stripe)
In-app PaymentSheet completes subscription


Webhook sets membership active and grants pass allowance


3) Monthly pass reset (no rollover)
On successful renewal webhook:


passes_allowed = plan_passes (default 3)


passes_used = 0


4) Send pass → claim-by-link
Member taps Send Pass


Backend creates passes row with a single-use claim token


Share link: slide://claim?token=... (+ HTTPS universal link fallback)


Friend opens link → logs in → claims pass


5) Rotating QR for door entry
Friend opens My Pass


Backend issues a short-lived signed QR token (10–30s TTL)


Staff scanner verifies token and calls redeem endpoint


Redeem is atomic in DB: claimed → redeemed exactly once



Tech Stack
Mobile Apps
Choose one:
React Native + Expo (Dev Client) (recommended for speed)


Flutter (also valid; similar concepts)


Backend
Supabase (Postgres + Auth + RLS + Edge Functions)


Payments
Stripe (Subscriptions + PaymentSheet + Webhooks)


Admin
Next.js + Supabase client (admin-only screens)


Scanner
On-device QR scanning:


Prefer a proven scanner library


Torch toggle required


Restrict scanning to QR format only



Monorepo Layout
slide/
 apps/
 consumer/ # iOS/Android consumer app
 scanner/ # iOS/Android staff scanner app
 admin/ # Next.js admin dashboard
 supabase/
 migrations/ # SQL migrations
 functions/
 create-pass/
 claim-pass/
 issue-qr-token/
 redeem-pass/
 stripe-init-subscription/
 stripe-webhook/
 policies/ # RLS policy definitions (optional organization)
 packages/
 shared/ # shared types, API clients, validation schemas
 scripts/
 seed/ # seeding plans, admin/staff bootstrap
 docs/
 PRD.md
 RUNBOOK.md

Environment Variables
Never ship secrets in mobile apps. All signing keys and Stripe secrets live server-side.
Supabase
SUPABASE_URL


SUPABASE_ANON_KEY


SUPABASE_SERVICE_ROLE_KEY (server-only)


Stripe (server-only)
STRIPE_SECRET_KEY


STRIPE_WEBHOOK_SECRET


STRIPE_PRICE_ID (or stored per-plan in DB)


QR Signing (server-only)
QR_TOKEN_SIGNING_SECRET (HMAC) or private key for JWT signing


QR_TOKEN_TTL_SECONDS (10–30 recommended)


Admin (Next.js)
NEXT_PUBLIC_SUPABASE_URL


NEXT_PUBLIC_SUPABASE_ANON_KEY


Mobile (consumer/scanner)
EXPO_PUBLIC_SUPABASE_URL


EXPO_PUBLIC_SUPABASE_ANON_KEY


(Optional) EXPO_PUBLIC_UNIVERSAL_LINK_BASE_URL



Local Development
Prerequisites
Node.js 18+ (or 20+)


Supabase CLI


Stripe CLI (recommended)


iOS/Android simulator/emulator or physical device (for camera scanning)


1) Install dependencies
pnpm install
Start Supabase locally
 supabase start
 supabase db reset


Apply migrations (if not using reset)
 supabase migration up


Seed admin + staff + plan(s)
 pnpm seed


Start apps
 pnpm dev



Database Schema (High Level)
Tables
profiles


plans (admin-only)


subscriptions


pass_balances


passes


staff_users


scan_events (append-only)


Pass Lifecycle
created → claimed → redeemed
revoked and expired are terminal states.
Atomic Redeem (Invariant)
A pass can only be redeemed if it is currently claimed.
 Redeem must be performed as a single atomic DB transition.

API (Edge Functions)
All state-changing operations happen through Edge Functions using server privileges.
 Clients should not write directly to stateful tables.
POST /fn/create-pass
Creates a pass for a member and returns a claim link.
Auth: consumer
 Requires: active membership + remaining passes
 Returns: { pass_id, claim_link }
POST /fn/claim-pass
Claims a pass into the authenticated friend account.
Auth: consumer
 Input: { token }
 Returns: { pass_id, status }
POST /fn/issue-qr-token
Mints a short-lived signed QR token for a claimed pass.
Auth: consumer (must own pass)
 Input: { pass_id }
 Returns: { qr_token, exp }
POST /fn/redeem-pass
Validates QR token and redeems pass.
Auth: staff (scanner role)
 Input: { qr_token, device_id }
 Returns: { result, pass_id?, redeemed_at? }
Results:
VALID (redeemed now)


USED (already redeemed)


EXPIRED (QR token expired)


INVALID (bad token / unknown pass)


REVOKED (pass revoked or user banned)


POST /fn/stripe-init-subscription
Returns PaymentSheet configuration for the consumer app.
Auth: consumer
 Input: { plan_id }
 Returns: { customerId, ephemeralKey, paymentIntentOrSetupIntent, ... }
POST /fn/stripe-webhook
Stripe webhook receiver for subscription lifecycle events.
Auth: none (Stripe signature required)
Behavior:
verifies Stripe signature


updates subscriptions


grants/resets pass balances on renewal/payment success

Webhook setup (Stripe Dashboard):
- Endpoint URL: https://<your-project>.supabase.co/functions/v1/stripe-webhook
- Required events:
  - invoice.payment_succeeded
  - customer.subscription.updated
  - customer.subscription.deleted



Auth & Roles
Roles
Consumer: standard authenticated user


Staff:


scanner


admin


Rule of Thumb
Consumer app: can only read its own profile/balance/passes.


Staff scanner app: can only redeem and read minimal staff info.


Admin web: can manage plans, staff, bans, and scan logs.


RLS Strategy
Enable RLS on all tables.


Allow consumers to read only their own rows.


Restrict inserts/updates for passes, pass_balances, subscriptions to Edge Functions.


Restrict scan_events reads to admins; inserts only via redeem function.



Fraud & Security Model
MVP Defenses (must-have)
Rotating QR tokens (10–30s TTL) to defeat screenshots/replays.


Claim requires authentication (no anonymous pass usage).


Atomic DB redeem: only one successful redemption.


Staff-only scanner auth with role checks.


Rate limiting on claim + redeem endpoints.


Claim token stored hashed and generated with high entropy.


Recommended Operational Controls
Door scanner devices are controlled (company-owned preferred).


Admin can disable staff instantly.


Monitor invalid scan spikes in real time.


Optional Later (P1)
Device attestation:


iOS App Attest / DeviceCheck


Android Play Integrity


Nearby-only constraint (venue challenge)


Automated ban rules from scan_events



Performance Targets
Redeem endpoint:
p50 < 300ms


p95 < 800ms


Handle:
1000 scans/night


burst traffic (door rush)


Scanner UX must remain responsive in low light:
torch toggle


restrict formats to QR only


fixed resolution tuned for real-time scanning



Admin Dashboard
Screens (MVP)
Plans
edit passes_per_period


enable/disable plan


Users
view membership status


ban/unban


Passes
search by issuer/owner


revoke pass


Staff
create staff


enable/disable staff


Scan Logs
date filters


invalid ratio


latency stats


per-device scan counts



Staff Scanner App
Requirements
Staff login


Camera scanner screen


Torch toggle


Big readable results:


VALID / USED / INVALID / EXPIRED / REVOKED


Logs event per scan (server-side)


Recommended UX Rules
No navigation clutter


Auto-focus and rapid scan loop


Large type + clear haptic/audio cues (optional, but useful at door)



Stripe Billing
Subscription lifecycle
On first successful payment:
set subscription active


grant pass allowance for the current period


On renewal:
reset passes to passes_per_period


set passes_used=0


On cancellation/past_due:
block new pass creation


redemption policy (choose one for MVP):


allow already-claimed passes until period end (recommended to avoid door disputes)


Webhook Idempotency
Webhooks can be retried.
 Handle re-entrantly using Stripe event IDs and/or safe upserts.

Deep Links
Claim link format
slide://claim?token=...
HTTPS universal link fallback:
https://yourdomain.com/claim?token=...
Behavior
If app installed: opens app to claim screen


If not installed: opens landing page with install prompt


After install: deferred deep linking (optional; not required for MVP)



Observability
Minimum telemetry
Redeem latency p50/p95


Scan results breakdown


Invalid scan rate per device/staff


Webhook processing success/failure


Spike alerts (invalid ratio, latency)


Where it lives
scan_events table for audit


Server logs for function performance


Admin dashboard summary widgets



Testing
Unit tests
Token generation/verification


Claim token hashing and single-use


Atomic redeem behavior


Integration tests
Stripe subscription events in test mode


Webhook signature verification


Deep link claim across platforms


Load tests
redeem endpoint burst simulation


verify no double-redeem under race conditions


Door tests
multiple device models


low-light environment


torch behavior and scan speed



Release Workflow (App Store Connect MCP)
We integrate the App Store Connect MCP server to automate repetitive App Store Connect tasks (metadata updates, TestFlight management, build status checks).
What we automate (MVP)
Create/update app metadata and version info


Manage TestFlight groups/testers


Check build processing status


Safety guardrail
Human approval required before final submission.

Operational Runbook
Door Setup Checklist (nightly)
Confirm dedicated Wi-Fi at door (or cellular fallback)


Staff devices charged and logged in


Scanner app updated


Admin dashboard open for monitoring


Torch toggle tested in venue lighting


If redemption fails (network issue)
Scanner shows NETWORK ERROR


Staff should use venue policy (manual decision)


Fix: switch to backup network/device


If fraud suspected
Check admin scan logs:


invalid scan spikes


repeated attempts by same device/account


Ban user or revoke pass immediately


Disable staff account if compromised



FAQ
Why not Apple/Google in-app purchases?
Slide is a real-world service consumed outside the app (line-skip at a venue). Payment is handled via Stripe subscription.
Why rotating QR tokens?
Static QRs are easily screenshotted and reused. Short-lived signed tokens dramatically reduce replay fraud.
Why two mobile apps?
It reduces risk by separating staff scanning capabilities from consumer devices and keeps door UX minimal.
How many passes per user?
Default: 3 per billing period. Admin can adjust via plan settings.
What happens when a membership ends?
User cannot create new passes. Already-claimed passes may remain redeemable until period end (recommended), depending on configured policy.
