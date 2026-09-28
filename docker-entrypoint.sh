#!/bin/sh
set -e

sanitize() {
  sed -E \
    -e 's#postgres(ql)?://[^"[:space:]]*#postgresql://REDACTED#g' \
    -e 's#[A-Za-z0-9_.+-]+:5432#HOST:5432#g'
}

echo "CvakniTO: NODE_ENV=$NODE_ENV PORT=${PORT:-3000}"
echo "CvakniTO: DATABASE_URL set? $([ -n "$DATABASE_URL" ] && echo yes || echo NO)"
echo "CvakniTO: SESSION_SECRET set? $([ -n "$SESSION_SECRET" ] && echo yes || echo NO)"

EET_DIR="${EET_DATA_DIR:-/data/eet}"
mkdir -p "$EET_DIR" 2>/dev/null || true
echo "CvakniTO: EET cert dir $EET_DIR"

echo "CvakniTO: generating Prisma client..."
npx prisma generate >/dev/null 2>&1 || echo "CvakniTO: prisma generate failed (continuing)."

if [ -n "$DATABASE_URL" ] && [ "$DATABASE_URL" != "postgresql://placeholder:placeholder@localhost:5432/placeholder" ]; then
  echo "===== CvakniTO: DB PUSH ====="
  npx prisma db push --skip-generate > /tmp/push.log 2>&1
  PUSH=$?
  sanitize < /tmp/push.log
  if [ "$PUSH" -eq 0 ]; then
    echo "===== CvakniTO: DB schema OK ====="
  else
    echo "===== CvakniTO: DB PUSH FAILED (code $PUSH) ====="
  fi
else
  echo "CvakniTO: no real DATABASE_URL, skipping db push."
fi

echo "CvakniTO: starting server on port ${PORT:-3000}..."
exec npx next start -p "${PORT:-3000}"
