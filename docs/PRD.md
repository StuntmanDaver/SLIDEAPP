PRD: Slide (Nightclub Line-Skip Pass App) — MVP, No Extras

> **This document is the product requirements document (PRD) for the Slide app.**
> 
> For implementation details, see **[claude.md](./claude.md)**.
> For visual design & component specs, see **[Design.md](./Design.md)**.
> For technical architecture & quick-start, see **[README.md](./README.md)**.

---

## 1) Overview
Product summary
Slide is a membership app that lets paying members transfer a limited number of line-skip passes to friends. Friends present a dynamic QR code at the door. Staff scans and redeems the pass exactly once. Admins manage plans, pass allowances, staff, and scan logs from a web dashboard connected to the same backend.
Platforms (recommended MVP)
Consumer app: iOS + Android (cross-platform)
Staff scanner app: iOS + Android (separate app for security + speed)
Admin dashboard: Web (Next.js)
Core constraints (must satisfy)
Must support ~1000 scans/night and ~1000 unique customer profiles
Must work reliably in low-light environments
Must protect against fraud (replay, screenshots, token guessing, multi-redeem)
Must remain minimal (no social graph, no messaging, no promotions)

2) Goals and non-goals
Goals (MVP)
Membership purchase via Stripe (subscription) inside mobile apps.
Membership entitles user to N passes per billing period (default 3), admin adjustable.
Member can transfer a pass to a friend using claim-by-link (deep link).
Friend can display a short-lived rotating QR token for entry.
Staff can scan and redeem a pass exactly once with immediate response: VALID, USED, INVALID, EXPIRED (plus REVOKED if applicable).
Admin dashboard to:
configure plan pass allowance
manage memberships/users (revoke/ban)
create/disable staff accounts
view scan logs and basic fraud signals
Non-goals (explicitly out of scope)
Friend lists / contacts import / "social" features
Guest invites beyond pass transfer
Multiple venues / venue discovery / maps
Promotions, coupons, referral programs
Wallet / stored tickets / Apple Wallet integration
Offline redemption guarantee (scanner should fail safe without internet)

3) Success metrics
Business metrics
Conversion: % of signed-in users who purchase membership
Retention: renewal rate by month
Pass utilization rate: passes used / passes granted per period
Net revenue per active member
Operational metrics
Scan success rate: VALID / total scans
Invalid rate: INVALID + EXPIRED + REVOKED / total scans
Average redemption latency (p50/p95) from scan to result
Peak scans per minute
Fraud indicators:
repeated invalid scans per device/account
same account attempting multiple redeems in short window
high screenshot/replay suspicion (same QR token repeated)

4) Personas and access levels
Consumer (Member)
Purchases membership
Sends passes
Has a profile
Cannot redeem passes at door
Consumer (Friend/Recipient)
Claims a pass via deep link
Shows QR at door
Cannot send passes unless they also have an active membership
Staff (Scanner)
Authenticated staff account
Can scan QR codes and call redeem endpoint
Can view minimal scan history (optional, staff UX only)
Admin
Full admin dashboard access
Can set pass allowance per plan, manage users, revoke/ban, create/disable staff

5) User journeys (end-to-end)
Journey A: New user → membership → sees balance
Install app → Sign in with Apple or Google
See membership screen → select plan → pay with Stripe PaymentSheet
On success, app displays:
membership status: Active
passes available this period: N (default 3)
passes used: 0
Acceptance criteria
Payment success updates membership within 5 seconds
Pass balance is granted for the current billing period

Journey B: Member sends pass → friend claims
Member taps "Send Pass"
App calls create_pass():
decrements member's available passes
creates pass in created state with a single-use claim token
Share sheet opens with deep link: slide://claim?token=... + HTTPS fallback
Friend opens link → app launches → sign in → calls claim_pass(token)
Pass becomes owned by friend (claimed)
Acceptance criteria
Claim token is single-use
Member cannot send more passes than available
Friend can claim only if authenticated
Member can see that pass has been claimed (status only)

Journey C: Friend enters → QR rotates → staff redeems
Friend opens "My Pass" screen
App requests a short-lived QR token (10–30s exp) from backend
QR displays token and visibly counts down (optional)
Staff scanner scans QR → calls redeem_pass(qr_token)
Backend validates token + redeems atomically
Scanner shows result instantly:
VALID if redeemed now
USED if already redeemed
EXPIRED if QR token expired
INVALID if token malformed/invalid
REVOKED if pass revoked/banned
Acceptance criteria
Pass redeems at most once
Redeem response < 300ms p50, < 800ms p95 under peak
QR screenshot should fail after expiration window

6) Functional requirements (P0)
6.1 Authentication & profiles
Consumer sign-in methods:
Sign in with Apple
Google SSO
Profile:
display name (optional)
creation date
Staff sign-in:
email + password (simplest), provisioned by admin
Role assignment:
staff scanner role
admin role
P0 rules
Unauthenticated users cannot view or claim passes
Staff endpoints require staff role

6.2 Membership & billing (Stripe)
Subscription billing (monthly)
One plan to start (MVP), with admin-adjustable pass allowance
Stripe webhooks drive truth:
subscription active → grant/reset passes
subscription canceled/past_due/unpaid → disable sending new passes; optionally allow previously claimed pass to be redeemed (configurable)
P0 behavior
If membership inactive:
member cannot create new passes
Pass reset:
on renewal event, set passes_allowed = plan_passes, passes_used = 0
no rollover

6.3 Pass creation (member)
Button: "Send Pass"
Creates pass with:
issuer = member
owner = null until claimed
status = created
claim token generated server-side, stored hashed
Decrements member's period balance atomically (must not go negative)
P0 error states
"No passes remaining"
"Membership inactive"
"Network error — try again"

6.4 Claim-by-link (friend)
Deep link + universal link fallback
Friend must authenticate
claim_pass(token):
validates token
ensures token unused
sets owner_user_id to friend
status becomes claimed
invalidates token
P0 error states
"Pass already claimed"
"Pass revoked"
"Link expired" (optional TTL on claim token, e.g., 24 hours)
"Invalid link"

6.5 QR token issuance (friend)
Friend's "My Pass" screen calls issue_qr_token(pass_id):
returns signed token (JWT or HMAC payload) with short expiration (10–30s)
token includes: pass_id, exp, jti (unique id), aud (scanner)
App refreshes token automatically shortly before expiry while screen is open
Why server-issued token (MVP)
Keeps signing key off device
Prevents easy forging and reduces replay/screenshot windows

6.6 Scanner app (staff)
Authenticated staff only
Scanning screen:
torch toggle
locks to QR only
fixed capture resolution tuned for speed
On scan:
calls redeem_pass(qr_token) and shows result
Optional: last 20 scans list for troubleshooting (no search)
P0 results
VALID / USED / INVALID / EXPIRED / REVOKED

6.7 Atomic redeem (backend)
Must be a single atomic operation:
only allow transition claimed → redeemed
record redeemed_at, redeemed_by_staff_id, redeemed_device_id
Always write scan_events row (append-only) for audit
P0 acceptance
Double scan of same pass returns USED reliably

6.8 Admin dashboard (web)
Screens (P0):
Plans
set passes_per_period for plan
enable/disable plan
Users
search by email/id
membership status
ban/unban user
Passes
search by owner or issuer
revoke pass
Staff
create staff account
enable/disable staff
Scan logs
filter by date range
show counts + invalid ratio + latency stats

7) Non-functional requirements (NFR)
Performance
Support:
1000 scans/night
bursts: assume up to 10 scans/second for short periods
Targets:
redeem endpoint: p50 < 300ms, p95 < 800ms
scanner UX must remain responsive under spotty Wi-Fi
Reliability
Redeem must be idempotent:
repeated calls for same pass should not create inconsistent states
Webhook processing must be reliable and re-entrant:
handle Stripe webhook retries safely
Security (baseline)
Enforce RLS on all tables
Separate staff scanner app to reduce attack surface
No secrets in client apps (signing keys server only)
Store only hash of claim tokens
Rate limit:
auth endpoints
redeem endpoint per staff/device
Maintain immutable scan audit logs
Privacy
Collect minimal PII:
email (from auth provider)
display name optional
Provide account deletion in app (consumer)

8) Fraud / abuse model (MVP defenses)
Threats
Screenshot of QR shared to someone else
Replay of old QR token
Forged QR token
Multi-redeem by racing requests
Staff account misuse
Token guessing / brute force claim tokens
Bot signups / subscription fraud
MVP mitigations (P0)
Short-lived, server-signed QR token (10–30s)
Pass must be claimed into authenticated account
Atomic DB update for claimed → redeemed
Staff-only scanner auth + role checks
Hash claim tokens; make them long and random
Rate limits on redeem and claim endpoints
Append-only scan logs to detect patterns
Optional later (P1)
Device attestation (iOS App Attest / Android Play Integrity)
"Nearby-only" venue secret challenge
Automated ban rules

9) Technical architecture (recommended "two apps")
Client apps
Consumer app: React Native (Expo Dev Client) or Flutter
Staff scanner app: same stack as consumer for reuse, but separate binary
Admin: Next.js web app
Backend
Supabase:
Postgres
Auth
RLS
Edge Functions
Stripe:
subscriptions
webhooks
PaymentSheet support
Why two apps (MVP)
Scanner capabilities never ship to consumer device
Cleaner role separation
Faster staff UX; less chance of misconfigured gating

10) Data model (Postgres / Supabase)
Tables (MVP)
profiles
user_id uuid PK (auth.users.id)
display_name text null
created_at timestamptz default now()
plans (admin only)
plan_id uuid PK
name text
stripe_price_id text unique
passes_per_period int default 3
is_active bool default true
subscriptions
user_id uuid PK
stripe_customer_id text unique
stripe_subscription_id text unique
status text (active, trialing, past_due, canceled, unpaid, etc.)
current_period_end timestamptz
pass_balances
user_id uuid PK
period_start timestamptz
period_end timestamptz
passes_allowed int
passes_used int
passes
pass_id uuid PK default gen_random_uuid()
issuer_user_id uuid
owner_user_id uuid null
claim_token_hash text null
status text enum (created, claimed, redeemed, revoked, expired)
created_at timestamptz default now()
claimed_at timestamptz null
redeemed_at timestamptz null
redeemed_by_staff_id uuid null
redeemed_device_id text null
staff_users
user_id uuid PK
role text enum (scanner, admin)
is_active bool default true
created_at timestamptz default now()
scan_events (append-only)
scan_id uuid PK default gen_random_uuid()
pass_id uuid null
scanner_staff_id uuid null
result text (VALID/USED/INVALID/EXPIRED/REVOKED)
ts timestamptz default now()
device_id text
latency_ms int
Core invariants
A pass can only be redeemed if status='claimed'
Claim token can only be used once
passes_used <= passes_allowed always

11) RLS and authorization (MVP policy intent)
profiles
User can read/write only their own profile row.
plans
Read: authenticated users can read active plans (or only via edge function)
Write: admin only
subscriptions
User can read their own
Write only by service role / edge functions (Stripe webhook)
pass_balances
User can read their own
Write only by service role / edge functions
passes
Issuer can read passes they issued
Owner can read passes they own
Write transitions (create/claim/redeem/revoke) via edge functions only
staff_users
Admin can manage
Staff can read their own role
scan_events
Insert only by edge function/service role
Read only by admin
(Implementation detail: keep all state-changing operations inside edge functions using the service role key, and restrict direct table writes from client.)

12) Backend API (Edge Functions) — MVP contract
Authenticated consumer functions
POST /fn/create-pass
Input: none
Output: { claim_link, pass_id }
Behavior:
verify membership active
verify passes_used < passes_allowed
increment passes_used atomically
create pass status='created', store claim_token_hash
POST /fn/claim-pass
Input: { token }
Output: { pass_id, status }
Behavior:
validate token hash match
ensure pass status created
set owner_user_id, claimed_at, status='claimed'
remove/invalidate claim token
POST /fn/issue-qr-token
Input: { pass_id }
Output: { qr_token, exp }
Behavior:
ensure requester owns pass and status is claimed
mint signed token with short expiry
Staff scanner function
POST /fn/redeem-pass
Input: { qr_token, device_id }
Output: { result, pass_id?, redeemed_at? }
Behavior:
verify staff role and active status
verify signature + expiry
atomic update claimed → redeemed
insert scan event
Billing functions
POST /fn/stripe/init-subscription
Input: { plan_id }
Output: PaymentSheet config (customer, ephemeral key, setup intent / subscription params)
Behavior:
create Stripe customer if not exists
prepare subscription flow
POST /fn/stripe/webhook
Stripe webhook endpoint
Behavior:
verify signature
update subscriptions
on renewal/payment success: reset pass_balances
on cancel/unpaid: mark inactive

13) UI requirements (MVP)
Consumer app screens
Auth
Apple / Google buttons
Home
Membership status (Active/Inactive)
Passes remaining: passes_allowed - passes_used
CTA: "Send Pass" (disabled if none)
Send Pass
single button → share sheet
shows "Pass sent" + "awaiting claim" state
My Pass (if user has claimed)
shows QR token
countdown / refresh indicator
Account
Manage subscription (link to customer portal or in-app flow)
Delete account
Staff scanner app screens
Staff login
Scanner
camera view
torch toggle
big status banner results
optional small "scan history" list
Admin dashboard screens
As defined in §6.8.

14) Edge cases and rules (must be explicit)
Membership status changes
If member cancels:
cannot create new passes
existing claimed passes: configurable policy
MVP recommended: allow redemption until current period end (reduces door conflict)
If payment fails:
freeze new pass creation immediately
allow already claimed pass redemption for grace window (optional)
Pass expiration
Claim link expiration: optional (e.g., 24h) for security (recommended)
Claimed pass expiration: by period end or event end
MVP simplest: pass valid until redeemed or period end (choose one and enforce)
Recommended: valid until period_end of recipient's pass balance period OR a fixed timestamp set at issue time
Door conditions (network issues)
If redeem endpoint unreachable:
scanner shows "NETWORK ERROR"
staff cannot guarantee validity
operational mitigation: dedicated Wi-Fi at door + cellular fallback device
Token replay within TTL
If someone screenshots and uses within 10–30 seconds:
atomic redeem still prevents multi-use; only first person succeeds
operationally acceptable for MVP

15) Observability and admin analytics (MVP)
Logs/metrics (minimum)
redeem latency p50/p95
scan result distribution
top invalid devices
scans per minute
webhook processing status
Admin dashboard widgets (MVP)
total scans tonight (date filter)
invalid ratio
latency p50/p95
top reasons breakdown: used/expired/invalid/revoked

16) QA / testing plan
Unit tests
token mint/verify
claim token hashing and single-use enforcement
atomic redeem SQL behavior
pass balance decrement logic
Integration tests
Stripe subscription lifecycle (test mode)
Webhook retries (idempotency)
Deep link claim across iOS/Android
Load tests (practical MVP)
simulate 10 req/s redeem for 5 minutes
ensure no double-redeem, stable latency
Door tests
low-light scan tests on:
at least 2 iPhone models
at least 2 Android models
test torch and focus behavior

17) Rollout plan (minimal risk)
Internal alpha:
staff only, test members, test stripe
Closed beta (TestFlight + Android internal testing):
50–100 real users, one venue night
Public release:
enable paid plan
monitor scan/fraud dashboards live

18) Risks and mitigations
Risk: misconfigured RLS exposes data
Mitigation: all writes via edge functions; restrict direct table writes from client; explicit RLS tests
Risk: scanner UX slow under peak
Mitigation: keep redeem endpoint minimal; QR scanning limited to QR format; low-light tuning; dedicated door Wi-Fi
Risk: chargebacks / card testing
Mitigation: Stripe Radar defaults; velocity limits on new subs; require verified email (provider), optional phone later (not MVP)
Risk: staff account leakage
Mitigation: staff accounts limited to scanner; fast disable in admin; device_id logging

19) Implementation plan (MVP milestones)
Milestone 1: Backend foundation
Supabase project, tables, enums, indexes
RLS policies
Edge functions skeleton + auth middleware
Basic admin role setup
Milestone 2: Billing
Stripe subscription setup + Price ID storage in plans
PaymentSheet init function
Webhook handler + pass reset logic
Milestone 3: Pass lifecycle
create pass + claim pass
deep link + universal link plumbing
pass screens in consumer app
Milestone 4: Door scanning
scanner app auth
ML-based QR scanning + torch + redeem endpoint
scan events logging + admin scan log view
Milestone 5: Admin dashboard
plans, users, passes, staff, logs
basic charts/filters

20) DevOps: App Store Connect MCP integration (release workflow requirement)
Objective
Use app-store-connect-mcp-server to automate repetitive App Store Connect tasks (metadata, TestFlight, build distribution) as part of your release process.
MVP automation tasks
Create/update app metadata (name, description, screenshots placeholders)
Manage TestFlight groups/testers
Fetch build processing status
Prepare version release checklist
Guardrails
Human approval step before submission
Store API keys in secure CI secrets
Logs and audit trail for changes made via MCP

21) Acceptance checklist (definition of done)
Consumer app
Sign in Apple/Google works on iOS + Android
Can purchase subscription and see active status
Receives pass allowance (default 3) after payment
Can send pass by link; friend can claim
Friend sees rotating QR token
Account deletion works
Scanner app
Staff login
Scans QR in low light with torch toggle
Redeems once; subsequent scans show USED
Shows EXPIRED/INVALID appropriately
Logs scan events
Admin dashboard
Create/disable staff
Change pass allowance per plan
Search users and ban/unban
View scan logs and invalid ratio
Backend
All state transitions via edge functions
Atomic redeem enforced
Stripe webhooks verified + idempotent
RLS prevents unauthorized reads/writes
