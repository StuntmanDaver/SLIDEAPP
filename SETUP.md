# Slide App — Local Development Setup

## ✅ Completed Steps

### 1. Environment Configuration
✅ **Created `.env.local`** with Supabase credentials
- File: `/slide/.env.local`
- Contains all required API keys and URLs
- ⚠️ **TODO**: Replace `SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE` with actual key

### 2. Monorepo Configuration
✅ **Created root configuration files**
- `package.json` — Root workspace config
- `pnpm-workspace.yaml` — pnpm workspace definition
- `.env.local` — Environment variables

### 3. Supabase Linking
✅ **Linked to cloud project**
```
Project ID: ssvgfaosfaxdvdxsdwdj
Status: ACTIVE_HEALTHY ✓
```

---

## ⏳ Next Steps (Manual)

### Step 1: Get SERVICE_ROLE_KEY
1. Go to https://app.supabase.com
2. Select **"Slide APP"** project
3. Navigate to **Settings → API**
4. Copy the **"Service Role Secret"** key
5. Update `.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_actual_key_here
   ```

### Step 2: Start Docker Desktop
- Open Docker Desktop app
- Wait for it to fully start (~1 min)
- Verify: `docker ps` should work

### Step 3: Boot Local Supabase
```bash
cd /Users/davidk/Documents/App\ Ideas\ /Slide\ App/slide
supabase start
```

Expected output:
```
Seeding data...
Started supabase local development server.
```

### Step 4: Apply Database Migrations
```bash
# Option A: Full reset (clears all data, applies migrations fresh)
supabase db reset

# Option B: Incremental migrations (preserves data)
supabase migration up
```

### Step 5: Seed Initial Data
```bash
pnpm seed
```

This will create:
- Admin user
- Staff scanner and admin roles
- Sample subscription plans

### Step 6: Install Dependencies & Start Dev Server
```bash
pnpm install
pnpm dev
```

This starts:
- Consumer app (mobile)
- Scanner app (mobile)
- Admin dashboard (web)

---

## 📋 Configuration Summary

### API Keys (in `.env.local`)
| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://ssvgfaosfaxdvdxsdwdj.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_ROLE_KEY` | **TODO: Replace with actual key** |

### Project Details
| Field | Value |
|-------|-------|
| Project Name | Slide APP |
| Region | us-east-2 |
| Database | PostgreSQL 17.6.1 |
| Status | ACTIVE_HEALTHY ✓ |

### Monorepo Structure
```
slide/
├── .env.local              ✅ Environment variables
├── package.json            ✅ Root workspace config
├── pnpm-workspace.yaml     ✅ Workspace definition
├── apps/                   (scaffolding - create when ready)
│   ├── consumer/           (iOS/Android consumer app)
│   ├── scanner/            (iOS/Android staff scanner)
│   └── admin/              (Next.js admin dashboard)
├── packages/
│   └── shared/             (Shared types, schemas, constants)
├── supabase/
│   ├── migrations/         (SQL migrations)
│   ├── functions/          (Edge Functions)
│   └── policies/           (RLS policies)
├── scripts/
│   └── seed/               (Database seeding)
└── docs/
    ├── claude.md           (Architecture guide)
    ├── PRD.md              (Product requirements)
    ├── README.md           (Technical README)
    └── Design.md           (Design system)
```

---

## 🚀 Quick Reference Commands

```bash
# Start Supabase (requires Docker)
supabase start

# Reset database (dev only)
supabase db reset

# Apply migrations
supabase migration up

# Deploy Edge Function
supabase functions deploy function-name

# Run dev servers
pnpm dev

# Seed database
pnpm seed

# Check Supabase status
supabase status

# Stop Supabase
supabase stop
```

---

## ⚠️ Important Security Notes

- ❌ **Never commit `.env.local`** — it's already in `.gitignore`
- ❌ **Never share `SUPABASE_SERVICE_ROLE_KEY`** — it has full DB access
- ✅ Public keys (`ANON_KEY`, `PUBLISHABLE_KEY`) are safe to share
- ✅ Always use `.env.local` for secrets in local development
- ✅ Use CI/CD secrets for production deployments

---

## 📚 Documentation

- **[Design.md](./docs/Design.md)** — Visual design language & component specs
- **[PRD.md](./docs/PRD.md)** — Product requirements & user journeys
- **[README.md](./docs/README.md)** — Technical architecture & quick-start
- **[claude.md](./docs/claude.md)** — AI assistant implementation guide

---

*Setup guide created: Jan 14, 2026*
*Awaiting: SERVICE_ROLE_KEY + Docker Desktop*
