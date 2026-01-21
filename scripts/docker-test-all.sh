#!/bin/bash
set -e

# Ensure .env exists and has required secrets
if [ ! -f .env ]; then
  if [ -f .env.local ]; then
    cp .env.local .env
    echo "✅ Created .env from .env.local"
  else
    touch .env
    echo "⚠️ Created empty .env"
  fi
fi

if ! grep -q "QR_TOKEN_SIGNING_SECRET" .env 2>/dev/null; then
  echo "" >> .env
  echo "QR_TOKEN_SIGNING_SECRET=test-secret-12345678901234567890123456789012" >> .env
  echo "✅ Added QR_TOKEN_SIGNING_SECRET to .env"
fi

# Export for Supabase CLI just in case
export QR_TOKEN_SIGNING_SECRET=$(grep QR_TOKEN_SIGNING_SECRET .env | cut -d '=' -f2)
echo "Secret: $QR_TOKEN_SIGNING_SECRET"

# Restart Supabase to pick up env vars
echo "🔄 Restarting Supabase..."
supabase stop
supabase start

# Extract local keys and URL
# We replace localhost/127.0.0.1 with host.docker.internal so containers can reach it
eval $(supabase status -o json | node -e '
  const fs = require("fs");
  const input = fs.readFileSync(0, "utf-8");
  const jsonMatch = input.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) process.exit(1);
  
  const d = JSON.parse(jsonMatch[0]);
  const url = d.API_URL
    .replace("127.0.0.1", "host.docker.internal")
    .replace("localhost", "host.docker.internal");
    
  console.log(`export SUPABASE_URL="${url}"`);
  console.log(`export SUPABASE_ANON_KEY="${d.ANON_KEY}"`);
  console.log(`export SUPABASE_SERVICE_ROLE_KEY="${d.SERVICE_ROLE_KEY}"`);
  console.log(`export NEXT_PUBLIC_SUPABASE_URL="${url}"`);
  console.log(`export NEXT_PUBLIC_SUPABASE_ANON_KEY="${d.ANON_KEY}"`);
')

echo "✅ Loaded local Supabase keys"
echo "URL: $SUPABASE_URL"

# Run tests
# Exported variables override .env.local values in docker-compose
pnpm docker:test
