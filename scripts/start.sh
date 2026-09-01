#!/bin/sh
set -e
mkdir -p data
export NODE_ENV="${NODE_ENV:-production}"
export DATABASE_URL="${DATABASE_URL:-file:../data/movietix.db}"
npx prisma db push
if [ ! -f data/.seeded ]; then
  npx tsx prisma/seed.ts
  touch data/.seeded
fi
exec npx tsx server/index.ts
