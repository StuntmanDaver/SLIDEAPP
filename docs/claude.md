# Claude.md — Slide (Nightclub Line-Skip Pass App)

> **This document is the authoritative reference for AI assistants working on the Slide codebase.**
> Read this file completely before making any changes.

---

## Table of Contents

0. [Related Documentation](#related-documentation)
1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Monorepo Structure](#4-monorepo-structure)
5. [Database Schema](#5-database-schema)
6. [Core Domain Concepts](#6-core-domain-concepts)
7. [API Contracts](#7-api-contracts)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Security & Fraud Model](#9-security--fraud-model)
10. [Code Conventions](#10-code-conventions)
11. [Environment Variables](#11-environment-variables)
12. [Development Workflow](#12-development-workflow)
13. [Testing Requirements](#13-testing-requirements)
14. [Critical Invariants](#14-critical-invariants)
15. [Common Tasks](#15-common-tasks)
16. [Gotchas & Warnings](#16-gotchas--warnings)

---

## 0. Related Documentation

This document is the **authoritative backend/architecture reference**. For complete context, read these in order:

1. **[Design.md](./Design.md)** — Visual design language, component specs, color tokens, typography, layouts
2. **[PRD.md](./PRD.md)** — Product requirements, user journeys, functional specs, acceptance criteria
3. **[README.md](./README.md)** — Technical README with architecture overview and quick-start guide
4. **claude.md** (this file) — AI assistant guide with implementation details, code conventions, database schema, security model

---

## 1. Project Overview

### What is Slide?

Slide is a **membership-based mobile app** for nightclubs that lets paying members transfer a limited number of line-skip passes to friends. Friends present a **rotating QR code** at the door, and staff scans to redeem the pass **exactly once**.

### Core Value Proposition

- Members pay for a subscription that grants N passes per billing period (default: 3)
- Members can send passes to friends via claim-by-link
- Friends display a short-lived QR token (10–30s TTL) at the door
- Staff scans and redeems atomically — no double-entry possible

### What Slide is NOT (Explicit Non-Goals)

- ❌ No social graph / friend lists / contacts import
- ❌ No messaging or chat
- ❌ No promotions, coupons, or referral programs
- ❌ No multiple venues or venue discovery
- ❌ No Apple Wallet / Google Wallet integration
- ❌ No offline redemption guarantee

### Platforms

| Platform | Technology | Purpose |
|----------|------------|---------|
| Consumer App | React Native (Expo) | iOS + Android for members and pass recipients |
| Scanner App | React Native (Expo) | Separate iOS + Android binary for door staff |
| Admin Dashboard | Next.js | Web app for admin operations |
| Backend | Supabase | Postgres + Auth + RLS + Edge Functions |
| Payments | Stripe | Subscriptions + PaymentSheet + Webhooks |

---

## 2. Architecture

### "Two Apps + Web Admin" Model

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Consumer App   │     │  Scanner App    │     │ Admin Dashboard │
│  (iOS/Android)  │     │  (iOS/Android)  │     │     (Web)       │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Supabase Backend      │
                    │  ┌──────────────────┐   │
                    │  │  Edge Functions  │   │
                    │  └────────┬─────────┘   │
                    │  ┌────────▼─────────┐   │
                    │  │    Postgres      │   │
                    │  │    + RLS         │   │
                    │  └──────────────────┘   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │        Stripe           │
                    │  (Subscriptions/Webhooks)│
                    └─────────────────────────┘
```

### Why Two Mobile Apps?

1. **Security boundary** — Scanner capabilities never ship in consumer binary
2. **Role separation** — Lower risk of misconfigured role gating
3. **Staff UX** — Ultra-minimal, fast interface optimized for door conditions

---

## 3. Tech Stack

### Mobile Apps (Consumer + Scanner)

```
Framework:     React Native + Expo (Dev Client)
Navigation:    React Navigation or Expo Router
State:         React Context or Zustand (keep simple)
API Client:    Supabase JS client
QR Scanning:   expo-camera or react-native-vision-camera
Deep Links:    expo-linking + universal links
```

### Admin Dashboard

```
Framework:     Next.js 14+ (App Router)
Styling:       Tailwind CSS
API Client:    Supabase JS client (with admin privileges)
Auth:          Supabase Auth (staff/admin roles)
```

### Backend

```
Database:      PostgreSQL (via Supabase)
Auth:          Supabase Auth (Apple, Google for consumers; email/password for staff)
Functions:     Supabase Edge Functions (Deno/TypeScript)
RLS:           Row Level Security on all tables
```

### Payments

```
Provider:      Stripe
Integration:   PaymentSheet (mobile), Webhooks (subscription lifecycle)
Test Mode:     Use Stripe test keys during development
```

---

## 4. Monorepo Structure

```
slide/
├── apps/
│   ├── consumer/              # iOS/Android consumer app
│   │   ├── app/               # App screens (Expo Router)
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities, API clients
│   │   ├── app.json           # Expo config
│   │   └── package.json
│   │
│   ├── scanner/               # iOS/Android staff scanner app
│   │   ├── app/               # App screens
│   │   ├── components/        # Scanner-specific components
│   │   ├── lib/               # Utilities
│   │   └── package.json
│   │
│   └── admin/                 # Next.js admin dashboard
│       ├── app/               # App Router pages
│       ├── components/        # Dashboard components
│       ├── lib/               # Supabase client, utilities
│       └── package.json
│
├── supabase/
│   ├── migrations/            # SQL migration files (numbered)
│   ├── functions/
│   │   ├── create-pass/       # Edge function
│   │   ├── claim-pass/        # Edge function
│   │   ├── issue-qr-token/    # Edge function
│   │   ├── redeem-pass/       # Edge function
│   │   ├── stripe-init-subscription/
│   │   └── stripe-webhook/
│   ├── seed.sql               # Initial data (plans, admin user)
│   └── config.toml            # Supabase local config
│
├── packages/
│   └── shared/                # Shared types, validation schemas, constants
│       ├── types/             # TypeScript interfaces
│       ├── schemas/           # Zod validation schemas
│       └── constants/         # Shared constants
│
├── scripts/
│   └── seed/                  # Seeding scripts
│
├── docs/
│   ├── PRD.md                 # Product Requirements Document
│   └── README.md              # Technical README
│
├── claude.md                  # This file
├── package.json               # Root package.json (workspace config)
├── pnpm-workspace.yaml        # pnpm workspace definition
└── turbo.json                 # Turborepo config (optional)
```

---

## 5. Database Schema

### Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User profile data | `user_id`, `display_name`, `created_at` |
| `plans` | Subscription plans | `plan_id`, `name`, `stripe_price_id`, `passes_per_period`, `is_active` |
| `subscriptions` | User subscription state | `user_id`, `stripe_subscription_id`, `status`, `current_period_end` |
| `pass_balances` | Per-period pass allocation | `user_id`, `period_start`, `period_end`, `passes_allowed`, `passes_used` |
| `passes` | Individual passes | `pass_id`, `issuer_user_id`, `owner_user_id`, `status`, `claim_token_hash` |
| `staff_users` | Staff account roles | `user_id`, `role`, `is_active` |
| `scan_events` | Immutable audit log | `scan_id`, `pass_id`, `scanner_staff_id`, `result`, `ts`, `device_id` |

### Detailed Schema

```sql
-- profiles: user profile data
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- plans: subscription plans (admin-managed)
CREATE TABLE plans (
  plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stripe_price_id TEXT UNIQUE NOT NULL,
  passes_per_period INTEGER DEFAULT 3 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- subscriptions: tracks Stripe subscription state
CREATE TABLE subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL, -- 'active', 'trialing', 'past_due', 'canceled', 'unpaid'
  current_period_end TIMESTAMPTZ NOT NULL
);

-- pass_balances: per-period pass allocation
CREATE TABLE pass_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  passes_allowed INTEGER NOT NULL,
  passes_used INTEGER DEFAULT 0 NOT NULL,
  CONSTRAINT passes_used_valid CHECK (passes_used >= 0 AND passes_used <= passes_allowed)
);

-- passes: individual pass records
CREATE TABLE passes (
  pass_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_user_id UUID NOT NULL REFERENCES auth.users(id),
  owner_user_id UUID REFERENCES auth.users(id),
  claim_token_hash TEXT,
  status TEXT NOT NULL DEFAULT 'created', -- 'created', 'claimed', 'redeemed', 'revoked', 'expired'
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  claimed_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  redeemed_by_staff_id UUID REFERENCES auth.users(id),
  redeemed_device_id TEXT,
  CONSTRAINT valid_status CHECK (status IN ('created', 'claimed', 'redeemed', 'revoked', 'expired'))
);

-- staff_users: staff roles and status
CREATE TABLE staff_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'scanner', 'admin'
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT valid_role CHECK (role IN ('scanner', 'admin'))
);

-- scan_events: append-only audit log
CREATE TABLE scan_events (
  scan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pass_id UUID REFERENCES passes(pass_id),
  scanner_staff_id UUID REFERENCES auth.users(id),
  result TEXT NOT NULL, -- 'VALID', 'USED', 'INVALID', 'EXPIRED', 'REVOKED'
  ts TIMESTAMPTZ DEFAULT now() NOT NULL,
  device_id TEXT NOT NULL,
  latency_ms INTEGER
);

-- Indexes for performance
CREATE INDEX idx_passes_issuer ON passes(issuer_user_id);
CREATE INDEX idx_passes_owner ON passes(owner_user_id);
CREATE INDEX idx_passes_status ON passes(status);
CREATE INDEX idx_scan_events_ts ON scan_events(ts);
CREATE INDEX idx_scan_events_pass ON scan_events(pass_id);
```

### Pass Lifecycle State Machine

```
                    ┌──────────┐
                    │ created  │ (pass issued, claim token generated)
                    └────┬─────┘
                         │ claim_pass()
                         ▼
                    ┌──────────┐
                    │ claimed  │ (owned by recipient, QR available)
                    └────┬─────┘
                         │ redeem_pass()
                         ▼
                    ┌──────────┐
                    │ redeemed │ (used at door, terminal state)
                    └──────────┘

Alternative terminal states:
- revoked: admin/member revoked the pass
- expired: pass TTL exceeded
```

---

## 6. Core Domain Concepts

### Pass Balance System

- **Period-based**: Each billing period grants `passes_allowed` (default: 3)
- **No rollover**: Unused passes do not carry over to next period
- **Atomic decrement**: Creating a pass atomically increments `passes_used`
- **Reset on renewal**: Stripe webhook resets `passes_used = 0` on subscription renewal

### Claim-by-Link Flow

1. Member taps "Send Pass"
2. Backend creates pass with `status = 'created'` and generates claim token
3. Claim token stored as **hash only** (never store plaintext)
4. Deep link generated: `slide://claim?token=...` (+ HTTPS fallback)
5. Recipient opens link → authenticates → calls `claim_pass(token)`
6. Token validated, pass ownership transferred, `status = 'claimed'`

### QR Token System

- **Server-signed**: All QR tokens minted by backend (signing key never on device)
- **Short-lived**: 10–30 second TTL to defeat screenshots
- **JWT or HMAC**: Contains `pass_id`, `exp`, `jti` (unique ID), `aud: 'scanner'`
- **Auto-refresh**: Client app refreshes token before expiry while screen is open

### Atomic Redeem

- **Single transition**: Only `claimed → redeemed` is valid
- **Idempotent**: Repeated calls for same pass return `USED`
- **Audit trail**: Every scan attempt logged to `scan_events`

---

## 7. API Contracts

### Edge Functions (All State-Changing Operations)

> **Critical**: Clients NEVER write directly to stateful tables. All mutations go through Edge Functions.

#### `POST /fn/create-pass`

**Auth**: Consumer (active membership required)

**Input**: None

**Output**:
```json
{
  "pass_id": "uuid",
  "claim_link": "slide://claim?token=..."
}
```

**Behavior**:
1. Verify membership is active (`subscriptions.status = 'active'`)
2. Verify `passes_used < passes_allowed`
3. Atomically increment `passes_used`
4. Create pass with `status = 'created'`
5. Generate claim token, store hash
6. Return claim link

**Error States**:
- `NO_PASSES_REMAINING` — balance exhausted
- `MEMBERSHIP_INACTIVE` — subscription not active
- `NETWORK_ERROR` — transient failure

---

#### `POST /fn/claim-pass`

**Auth**: Consumer (must be authenticated)

**Input**:
```json
{
  "token": "claim_token_plaintext"
}
```

**Output**:
```json
{
  "pass_id": "uuid",
  "status": "claimed"
}
```

**Behavior**:
1. Hash input token, match against `claim_token_hash`
2. Verify pass `status = 'created'`
3. Set `owner_user_id`, `claimed_at`, `status = 'claimed'`
4. Invalidate claim token (clear or mark used)

**Error States**:
- `PASS_ALREADY_CLAIMED` — token already used
- `PASS_REVOKED` — pass was revoked
- `LINK_EXPIRED` — claim token TTL exceeded (if implemented)
- `INVALID_LINK` — token doesn't match any pass

---

#### `POST /fn/issue-qr-token`

**Auth**: Consumer (must own the pass)

**Input**:
```json
{
  "pass_id": "uuid"
}
```

**Output**:
```json
{
  "qr_token": "signed_jwt_or_hmac",
  "exp": 1700000000
}
```

**Behavior**:
1. Verify requester is `owner_user_id`
2. Verify pass `status = 'claimed'`
3. Mint signed token with 10–30s expiry
4. Token payload: `{ pass_id, exp, jti, aud: 'scanner' }`

---

#### `POST /fn/redeem-pass`

**Auth**: Staff (scanner role required)

**Input**:
```json
{
  "qr_token": "signed_token",
  "device_id": "scanner_device_id"
}
```

**Output**:
```json
{
  "result": "VALID",
  "pass_id": "uuid",
  "redeemed_at": "timestamp"
}
```

**Results**:
| Result | Meaning |
|--------|---------|
| `VALID` | Pass redeemed successfully (just now) |
| `USED` | Pass was already redeemed |
| `EXPIRED` | QR token TTL exceeded |
| `INVALID` | Malformed token or unknown pass |
| `REVOKED` | Pass or user was banned/revoked |

**Behavior**:
1. Verify staff role and `is_active = true`
2. Verify token signature
3. Verify token not expired
4. Atomic update: `status = 'claimed' → 'redeemed'`
5. Record `redeemed_at`, `redeemed_by_staff_id`, `redeemed_device_id`
6. Insert `scan_events` row (always, for audit)

---

#### `POST /fn/stripe-init-subscription`

**Auth**: Consumer

**Input**:
```json
{
  "plan_id": "uuid"
}
```

**Output**:
```json
{
  "customerId": "cus_...",
  "ephemeralKey": "ek_...",
  "paymentIntent": "pi_..."
}
```

---

#### `POST /fn/stripe-webhook`

**Auth**: None (Stripe signature verification)

**Behavior**:
1. Verify Stripe webhook signature
2. Handle events:
   - `invoice.payment_succeeded` → grant/reset passes
   - `customer.subscription.updated` → update status
   - `customer.subscription.deleted` → mark inactive
3. Idempotent: safe to process same event multiple times

---

## 8. Authentication & Authorization

### Consumer Auth

- **Sign in with Apple** — Required for iOS
- **Google Sign-In** — Primary alternative
- **No email/password** — Consumers use SSO only

### Staff Auth

- **Email/Password** — Provisioned by admin
- **Roles**:
  - `scanner` — Can only scan and redeem
  - `admin` — Full dashboard access

### Authorization Matrix

| Action | Consumer | Staff (Scanner) | Staff (Admin) |
|--------|----------|-----------------|---------------|
| Create pass | ✅ Own | ❌ | ❌ |
| Claim pass | ✅ | ❌ | ❌ |
| Issue QR token | ✅ Own pass | ❌ | ❌ |
| Redeem pass | ❌ | ✅ | ✅ |
| View scan logs | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Manage staff | ❌ | ❌ | ✅ |
| Manage plans | ❌ | ❌ | ✅ |

### RLS Policy Intent

```sql
-- profiles: users read/write only their own
CREATE POLICY "Users own their profile"
  ON profiles FOR ALL
  USING (auth.uid() = user_id);

-- plans: anyone authenticated can read active plans
CREATE POLICY "Read active plans"
  ON plans FOR SELECT
  USING (is_active = true);

-- subscriptions: users read only their own
CREATE POLICY "Users read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- pass_balances: users read only their own
CREATE POLICY "Users read own balance"
  ON pass_balances FOR SELECT
  USING (auth.uid() = user_id);

-- passes: issuers and owners can read
CREATE POLICY "Read issued or owned passes"
  ON passes FOR SELECT
  USING (auth.uid() = issuer_user_id OR auth.uid() = owner_user_id);

-- staff_users: staff can read their own role
CREATE POLICY "Staff read own role"
  ON staff_users FOR SELECT
  USING (auth.uid() = user_id);

-- scan_events: admin only (via Edge Function)
-- Direct table access disabled; reads through admin API
```

---

## 9. Security & Fraud Model

### Threat Model

| Threat | Attack Vector | MVP Mitigation |
|--------|---------------|----------------|
| Screenshot replay | Friend screenshots QR, shares | 10–30s TTL on QR tokens |
| Token forgery | Attacker crafts fake QR | Server-side signing (key never on device) |
| Multi-redeem race | Two scanners scan simultaneously | Atomic DB transition |
| Claim token guessing | Brute force claim URLs | High-entropy tokens, rate limiting |
| Staff account misuse | Compromised staff scans fake passes | Device logging, instant disable |
| Bot signups | Automated subscription fraud | Stripe Radar, rate limits |

### Security Requirements

1. **No secrets in client apps** — Signing keys server-only
2. **Claim tokens stored hashed** — Never store plaintext
3. **RLS on all tables** — No direct client writes to stateful tables
4. **Rate limiting**:
   - Auth endpoints: prevent brute force
   - Claim endpoint: prevent token guessing
   - Redeem endpoint: prevent abuse
5. **Append-only audit log** — `scan_events` is immutable
6. **Separate scanner binary** — Staff capabilities isolated

### QR Token Security

```
Token Structure (JWT example):
{
  "pass_id": "uuid",
  "exp": 1700000030,      // 30 seconds from now
  "jti": "unique_id",     // Prevents replay within TTL
  "aud": "scanner"        // Audience restriction
}

Signed with: QR_TOKEN_SIGNING_SECRET (HMAC-SHA256 or RS256)
```

---

## 10. Code Conventions

### TypeScript

- **Strict mode**: Enable `strict: true` in all `tsconfig.json`
- **Explicit types**: No implicit `any`; define interfaces for all API responses
- **Enums as unions**: Prefer `type Status = 'created' | 'claimed' | 'redeemed'` over enums

### Naming

```typescript
// Files: kebab-case
create-pass.ts
pass-balance.tsx

// Components: PascalCase
export function PassCard() {}

// Functions: camelCase
export function createPass() {}

// Constants: SCREAMING_SNAKE_CASE
export const QR_TOKEN_TTL_SECONDS = 30;

// Types/Interfaces: PascalCase
interface Pass {
  passId: string;
  status: PassStatus;
}
```

### React Native

```typescript
// Use functional components with hooks
export function ScannerScreen() {
  const [result, setResult] = useState<ScanResult | null>(null);
  // ...
}

// Prefer named exports
export { ScannerScreen };

// Keep screens thin; extract logic to hooks
export function useScanResult(token: string) {
  // ...
}
```

### Supabase Edge Functions

```typescript
// Deno imports at top
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Always verify auth
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}

// Use service role for writes
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
```

### SQL Migrations

```sql
-- File naming: YYYYMMDDHHMMSS_description.sql
-- Example: 20240115120000_create_passes_table.sql

-- Always include rollback comments
-- Up migration
CREATE TABLE passes (...);

-- Rollback (as comment for reference)
-- DROP TABLE passes;
```

---

## 11. Environment Variables

### Required Variables by Environment

#### Supabase (All Environments)

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-only, NEVER in client
```

#### Stripe (Server-Only)

```bash
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...  # Or stored per-plan in DB
```

#### QR Token Signing (Server-Only)

```bash
QR_TOKEN_SIGNING_SECRET=your-256-bit-secret
QR_TOKEN_TTL_SECONDS=30
```

#### Mobile Apps (Consumer + Scanner)

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_UNIVERSAL_LINK_BASE_URL=https://yourdomain.com  # Optional
```

#### Admin Dashboard (Next.js)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Security Rules

- ❌ **NEVER** commit secrets to git
- ❌ **NEVER** ship `SERVICE_ROLE_KEY` in mobile apps
- ❌ **NEVER** ship `QR_TOKEN_SIGNING_SECRET` in mobile apps
- ✅ Use `.env.local` for local development
- ✅ Use CI/CD secrets for production

---

## 12. Development Workflow

### Prerequisites

```bash
# Required
node --version  # 18+ or 20+
pnpm --version  # Preferred package manager

# Supabase CLI
brew install supabase/tap/supabase

# Stripe CLI (for webhook testing)
brew install stripe/stripe-cli/stripe
```

### Initial Setup

```bash
# 1. Clone and install
pnpm install

# 2. Start Supabase locally
supabase start

# 3. Apply migrations
supabase db reset  # Or: supabase migration up

# 4. Seed initial data
pnpm seed

# 5. Start apps
pnpm dev
```

### Local Stripe Webhooks

```bash
# Forward Stripe events to local function
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

### Running Apps Individually

```bash
# Consumer app
pnpm --filter consumer dev

# Scanner app
pnpm --filter scanner dev

# Admin dashboard
pnpm --filter admin dev
```

### Database Migrations

```bash
# Create new migration
supabase migration new description_here

# Apply migrations
supabase migration up

# Reset database (dev only)
supabase db reset
```

---

## 13. Testing Requirements

### Unit Tests (Required)

- [ ] Token generation and verification
- [ ] Claim token hashing and single-use enforcement
- [ ] Atomic redeem SQL behavior
- [ ] Pass balance decrement logic

### Integration Tests (Required)

- [ ] Stripe subscription lifecycle (test mode)
- [ ] Webhook retries (idempotency verification)
- [ ] Deep link claim across iOS/Android
- [ ] Full pass lifecycle: create → claim → issue QR → redeem

### Load Tests (Required for Launch)

- [ ] Simulate 10 req/s redeem for 5 minutes
- [ ] Verify no double-redeem under race conditions
- [ ] Measure latency p50/p95 under load

### Door Tests (Required for Launch)

- [ ] Low-light scanning on 2+ iPhone models
- [ ] Low-light scanning on 2+ Android models
- [ ] Torch toggle behavior
- [ ] Network failure handling

---

## 14. Critical Invariants

> **These rules must NEVER be violated. Any code that breaks these is incorrect.**

### Pass Balance Invariant

```
passes_used <= passes_allowed  (ALWAYS)
```

A member can never send more passes than their balance allows. The decrement must be atomic.

### Single Redeem Invariant

```
A pass can only transition to 'redeemed' EXACTLY ONCE.
```

Implemented via atomic DB update with `WHERE status = 'claimed'`.

### Claim Token Single-Use Invariant

```
A claim token can only be used to claim a pass ONCE.
```

After successful claim, the token must be invalidated.

### QR Token Expiry Invariant

```
QR tokens MUST expire after TTL (10–30 seconds).
```

The redeem endpoint MUST reject expired tokens.

### Audit Log Immutability

```
scan_events rows are APPEND-ONLY. Never update or delete.
```

Every scan attempt must be logged, regardless of result.

---

## 15. Common Tasks

### Adding a New Edge Function

1. Create folder: `supabase/functions/function-name/`
2. Create `index.ts` with standard structure
3. Add to `supabase/config.toml` if needed
4. Deploy: `supabase functions deploy function-name`

### Adding a New Database Table

1. Create migration: `supabase migration new create_table_name`
2. Write SQL in migration file
3. Add RLS policies in same migration
4. Update TypeScript types in `packages/shared/types/`
5. Apply: `supabase db reset` (dev) or `supabase migration up` (prod)

### Modifying Pass Lifecycle

1. Update `passes` table status enum if needed
2. Update relevant Edge Functions
3. Update RLS policies if access changes
4. Update TypeScript types
5. Add tests for new states

### Adding Admin Dashboard Screen

1. Create page in `apps/admin/app/`
2. Add to navigation
3. Ensure admin role check in page
4. Use Supabase client with appropriate RLS

---

## 16. Gotchas & Warnings

### ⚠️ Supabase Auth

- `auth.uid()` in RLS returns the authenticated user's ID
- Edge Functions need to extract user from JWT manually
- Service role bypasses RLS — use carefully

### ⚠️ Stripe Webhooks

- Webhooks can arrive out of order
- Webhooks can be retried (must be idempotent)
- Always verify signature before processing
- Use Stripe event ID for idempotency checks

### ⚠️ QR Token Timing

- Token TTL is critical for security vs. usability tradeoff
- Too short (5s): poor UX, constant refresh failures
- Too long (60s+): screenshots become viable attack
- Recommended: 20–30 seconds

### ⚠️ Deep Links

- iOS universal links require `.well-known/apple-app-site-association`
- Android App Links require `.well-known/assetlinks.json`
- Test deep links on real devices, not just simulators

### ⚠️ Scanner Camera

- Always request camera permissions before showing scanner
- Handle permission denied state gracefully
- Torch toggle must work independently of scan state
- Restrict to QR format only for speed

### ⚠️ Atomic Operations

- Use `UPDATE ... WHERE status = 'claimed' RETURNING *` for atomic redeem
- Check `RETURNING` row count to detect race conditions
- Never use SELECT then UPDATE — that's not atomic

### ⚠️ RLS Bypass in Edge Functions

```typescript
// Client-facing auth check
const { data: { user } } = await supabaseClient.auth.getUser(token);
if (!user) return unauthorized();

// Service role for actual operation
const supabaseAdmin = createClient(url, serviceRoleKey);
// Now RLS is bypassed — validate manually!
```

---

## Appendix: Performance Targets

| Metric | Target |
|--------|--------|
| Redeem latency p50 | < 300ms |
| Redeem latency p95 | < 800ms |
| Scans per night | ~1000 |
| Burst capacity | 10 scans/second |
| QR token TTL | 10–30 seconds |
| Claim token TTL | 24 hours (optional) |

---

## Appendix: Scan Result Reference

| Result | HTTP Status | Meaning | User Action |
|--------|-------------|---------|-------------|
| `VALID` | 200 | Pass redeemed now | Allow entry |
| `USED` | 200 | Already redeemed | Deny entry |
| `EXPIRED` | 200 | QR token expired | Ask guest to refresh |
| `INVALID` | 200 | Bad token/unknown pass | Deny entry |
| `REVOKED` | 200 | Pass/user banned | Deny entry |

---

## Appendix: Quick Reference Commands

```bash
# Start everything locally
supabase start && pnpm dev

# Reset database
supabase db reset

# Deploy Edge Function
supabase functions deploy function-name

# Forward Stripe webhooks locally
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint
```

---

*Last updated: January 2026*
*Source documents: PRD.md, README.md*
