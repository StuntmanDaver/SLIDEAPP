# Authentication Setup Guide

## Supabase Auth Providers Configuration

### Step 1: Sign in with Apple

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable "Apple"
3. To get Apple credentials:
   - Visit Apple Developer Portal (https://developer.apple.com)
   - Create a Services ID for your app
   - Configure "Sign in with Apple" capability
   - Generate a private key for the Services ID
   - Configure redirect URLs: `https://[PROJECT_REF].supabase.co/auth/v1/callback`

### Step 2: Sign in with Google

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable "Google"
3. To get Google credentials:
   - Visit Google Cloud Console (https://console.cloud.google.com)
   - Create OAuth 2.0 Client ID (Web type)
   - Add authorized redirect URLs:
     - `https://[PROJECT_REF].supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for local dev)
   - Copy Client ID and Client Secret to Supabase

### Step 3: Email/Password for Staff

1. Staff accounts are created via admin dashboard
2. Email/Password authentication is enabled by default in Supabase

### Environment Variables

After configuring providers, get from Supabase dashboard:

```bash
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Store SERVICE_ROLE_KEY securely (server-side only).
