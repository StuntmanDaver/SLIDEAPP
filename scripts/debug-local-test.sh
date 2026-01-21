#!/bin/bash
set -e

# Start Supabase if not running
supabase start

# Extract local keys and URL
# For local run, we use localhost directly
eval $(supabase status -o json | node -e '
  const fs = require("fs");
  const input = fs.readFileSync(0, "utf-8");
  const jsonMatch = input.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) process.exit(1);
  
  const d = JSON.parse(jsonMatch[0]);
  const url = d.API_URL; // Keep localhost
    
  console.log(`export SUPABASE_URL="${url}"`);
  console.log(`export SUPABASE_ANON_KEY="${d.ANON_KEY}"`);
  console.log(`export SUPABASE_SERVICE_ROLE_KEY="${d.SERVICE_ROLE_KEY}"`);
  console.log(`export NEXT_PUBLIC_SUPABASE_URL="${url}"`);
  console.log(`export NEXT_PUBLIC_SUPABASE_ANON_KEY="${d.ANON_KEY}"`);
')

echo "✅ Loaded local Supabase keys for LOCAL test run"
echo "URL: $SUPABASE_URL"

# Run integration test locally
deno test --allow-net --allow-env --allow-read tests/integration/pass-lifecycle.test.ts
