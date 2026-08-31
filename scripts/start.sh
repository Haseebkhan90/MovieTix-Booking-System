#!/bin/sh
set -e
mkdir -p data
npx prisma db push
if [ ! -f data/.seeded ]; then
  npx tsx prisma/seed.ts
  touch data/.seeded
fi
exec npx tsx server/index.ts
