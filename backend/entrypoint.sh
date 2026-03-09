#!/bin/sh

# Jalankan migrasi database D1 secara lokal
echo "Initializing database..."
npx wrangler d1 execute woc-database --local --file=./schema.sql --yes
npx wrangler d1 execute woc-database --local --file=./seed_layanan.sql --yes

# Jalankan perintah utama (Wrangler dev)
echo "Starting backend server..."
exec npx wrangler dev --ip 0.0.0.0 --remote=false