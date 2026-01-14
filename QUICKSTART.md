# 🚀 Slide App — Quick Start Guide

## Current Status

✅ **Phase 1: Setup Complete**
- Environment variables configured
- Supabase project linked (ssvgfaosfaxdvdxsdwdj)
- Monorepo scaffolding ready
- Documentation complete

⏳ **Phase 2: Local Development (Next)**
- Docker Desktop needed
- Local Supabase instance
- Database migrations
- Development server

---

## 5-Minute Quick Start

### Prerequisites
- ✅ **Supabase CLI** — Already installed
- ⏳ **Docker Desktop** — Download from https://www.docker.com/products/docker-desktop
- ⏳ **Node.js 18+** — Verify with `node --version`
- ⏳ **pnpm** — Install with `npm install -g pnpm`

### Commands to Run

```bash
# 1️⃣ Open terminal to your slide folder
cd "/Users/davidk/Documents/App Ideas /Slide App/slide"

# 2️⃣ Get your SERVICE_ROLE_KEY from Supabase
# → Go to https://app.supabase.com
# → Select "Slide APP" project
# → Settings → API → Copy "Service Role Secret"
# → Then:
SUPABASE_SERVICE_ROLE_KEY="your_key_here" # Replace with actual key

# 3️⃣ Update .env.local with your key
sed -i '' "s/YOUR_SERVICE_ROLE_KEY_HERE/$SUPABASE_SERVICE_ROLE_KEY/" .env.local

# 4️⃣ Start Docker, then Supabase
supabase start

# 5️⃣ Reset database (first time only)
supabase db reset

# 6️⃣ Install dependencies
pnpm install

# 7️⃣ Seed initial data (optional)
pnpm seed

# 8️⃣ Start development servers
pnpm dev
```

---

## What Gets Created

### ✅ Created Files (Ready Now)

```
slide/
├── .env.local                    ✅ Environment vars (with ANON_KEY, needs SERVICE_ROLE_KEY)
├── package.json                  ✅ Root workspace
├── pnpm-workspace.yaml           ✅ Monorepo config
├── SETUP.md                      ✅ Detailed setup guide
├── QUICKSTART.md                 ✅ This file
└── .supabase/                    📝 Created after `supabase start`
    └── config.json               📝 Local Supabase config
```

### 📝 Will Be Created by `supabase db reset`

```
supabase/
├── migrations/
│   └── [auto-generated]_initial_schema.sql    ← Your schema
├── functions/                                  ← Edge functions
│   ├── create-pass/
│   ├── claim-pass/
│   ├── issue-qr-token/
│   ├── redeem-pass/
│   └── ...
└── policies/                                   ← RLS definitions
```

### 📦 Apps to Create Next

```
apps/
├── consumer/
│   ├── app.json                  ← Expo config
│   └── package.json              ← Consumer app workspace
├── scanner/
│   ├── app.json                  ← Expo config
│   └── package.json              ← Scanner app workspace
└── admin/
    ├── app/                      ← Next.js pages
    └── package.json              ← Admin workspace
```

---

## 🎯 Three App Architecture

### 1. Consumer App (`apps/consumer`)
- **Stack**: React Native + Expo
- **For**: Members who buy passes & send them
- **Features**: 
  - Sign in with Apple/Google
  - Buy membership (Stripe)
  - Send passes
  - View QR code at door
- **Run**: `pnpm --filter consumer dev`

### 2. Scanner App (`apps/scanner`)
- **Stack**: React Native + Expo
- **For**: Door staff who scan passes
- **Features**:
  - Staff login
  - Scan QR codes
  - Show VALID/USED/EXPIRED results
- **Run**: `pnpm --filter scanner dev`

### 3. Admin Dashboard (`apps/admin`)
- **Stack**: Next.js + Tailwind
- **For**: Operations admins
- **Features**:
  - Manage plans & users
  - View scan logs
  - Create/disable staff
- **Run**: `pnpm --filter admin dev`

---

## 📋 Checklist

Before running `supabase start`:

- [ ] Docker Desktop downloaded and running
- [ ] SERVICE_ROLE_KEY obtained from Supabase dashboard
- [ ] `.env.local` updated with SERVICE_ROLE_KEY
- [ ] `pnpm install` dependencies ready
- [ ] Read SETUP.md for detailed steps

---

## 🔧 Troubleshooting

### "Docker daemon not running"
```bash
# Open Docker Desktop app
# Wait ~1 minute for it to start
# Verify:
docker ps
```

### "Cannot find project ref"
```bash
# You need to link the Supabase project (already done for you)
# If this error persists:
supabase login
supabase link --project-ref ssvgfaosfaxdvdxsdwdj
```

### "pnpm not found"
```bash
npm install -g pnpm
pnpm --version  # Should be 8.0+
```

### "Supabase status shows 'Not Running'"
```bash
# Make sure Docker is running, then:
supabase start
# Wait 30-60 seconds for services to boot
supabase status
```

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `.env.local` | Environment secrets (never commit) |
| `SETUP.md` | Detailed setup with all steps |
| `QUICKSTART.md` | This quick reference |
| `docs/Design.md` | Visual design system |
| `docs/PRD.md` | Product requirements |
| `docs/README.md` | Architecture & tech stack |
| `docs/claude.md` | AI assistant guide |

---

## 🌐 URLs After `supabase start`

Once everything is running:

| Service | URL | Purpose |
|---------|-----|---------|
| Supabase Studio | `http://localhost:54321` | Database GUI |
| Consumer App | `http://localhost:8081` | Member mobile app |
| Scanner App | `http://localhost:8082` | Staff scanner app |
| Admin Dashboard | `http://localhost:3000` | Operations dashboard |

---

## 🎓 Next: Create the Apps

Once Supabase is running, create the three apps:

```bash
# Consumer app (React Native/Expo)
mkdir -p apps/consumer
cd apps/consumer
npm create expo-app .

# Scanner app (React Native/Expo)
mkdir -p apps/scanner
cd apps/scanner
npm create expo-app .

# Admin dashboard (Next.js)
mkdir -p apps/admin
cd apps/admin
npx create-next-app@latest .
```

Then add the Supabase client to each:

```bash
pnpm add @supabase/supabase-js
```

---

## 💬 Commands Cheat Sheet

```bash
# Supabase
supabase start               # Boot local Supabase (requires Docker)
supabase status             # Check if running
supabase stop               # Stop Supabase
supabase db reset           # Full reset (clears all data, fresh schema)
supabase migration up       # Apply pending migrations
supabase logs               # View server logs

# pnpm
pnpm install                # Install all workspace dependencies
pnpm dev                    # Start all dev servers (root level)
pnpm build                  # Build all apps
pnpm test                   # Run all tests
pnpm lint                   # Lint all code

# Specific workspace
pnpm --filter consumer dev  # Run only consumer app
pnpm --filter scanner dev   # Run only scanner app
pnpm --filter admin dev     # Run only admin dashboard

# Git
git status                  # Check what's changed
git add .                   # Stage all changes
git commit -m "message"     # Commit
git push                    # Push to remote
```

---

## 🚀 You're Ready!

**Next step**: Open Docker Desktop and run `supabase start`

Questions? Check:
- `SETUP.md` for step-by-step
- `docs/claude.md` for architecture details
- `docs/PRD.md` for product context

Happy coding! 🎉

---

*Created: Jan 14, 2026*
*Status: Ready for Phase 2 (Docker + Local Supabase)*
