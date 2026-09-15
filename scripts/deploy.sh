#!/usr/bin/env bash
# Deploy kalnostics-siteadmin-fe (Next.js, served at /admin) on this server:
# pull, build, verify, restart.
#
# Same rationale as kaltros-fe/scripts/deploy.sh: this droplet is low on RAM
# and a build can be OOM-killed partway through, leaving .next/ incomplete.
# This script keeps the last known-good .next/ around and only ever leaves a
# verified build in place.
set -euo pipefail

REPO_DIR="/opt/kalnostics/kalnostics-siteadmin-fe"
BRANCH="${1:-main}"
PM2_APP="kalnostics-siteadmin"
BUILD_DIR="$REPO_DIR/.next"
BUILD_BAK="$REPO_DIR/.next.bak"

cd "$REPO_DIR"

echo "==> Checking working tree is clean (ignoring untracked files)"
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "ERROR: working tree has uncommitted changes — aborting so nothing gets clobbered." >&2
  git status --short
  exit 1
fi

echo "==> Pulling origin/$BRANCH"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH" --no-ff

echo "==> Installing dependencies (frozen lockfile)"
pnpm install --frozen-lockfile

echo "==> Backing up current .next/ before building"
rm -rf "$BUILD_BAK"
if [[ -d "$BUILD_DIR" ]]; then
  cp -a "$BUILD_DIR" "$BUILD_BAK"
fi

restore_backup() {
  if [[ -d "$BUILD_BAK" ]]; then
    rm -rf "$BUILD_DIR"
    cp -a "$BUILD_BAK" "$BUILD_DIR"
  fi
}

echo "==> Building"
if ! pnpm build; then
  echo "ERROR: build failed — restoring previous .next/, nothing deployed." >&2
  restore_backup
  exit 1
fi

echo "==> Verifying build output"
if [[ ! -f "$BUILD_DIR/BUILD_ID" ]] || [[ ! -d "$BUILD_DIR/server" ]]; then
  echo "ERROR: build finished but .next/ looks incomplete (missing BUILD_ID or server/)." >&2
  echo "==> Restoring previous .next/ to avoid an outage." >&2
  restore_backup
  exit 1
fi

echo "==> Build verified. Restarting pm2 app: $PM2_APP"
pm2 restart "$PM2_APP"

echo "==> Health-checking the app"
ok=false
for _ in $(seq 1 10); do
  sleep 1
  code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3001/admin/ || echo 000)
  if [[ "$code" != "000" && ! "$code" =~ ^5 ]]; then
    ok=true
    break
  fi
done

if [[ "$ok" != true ]]; then
  echo "ERROR: app did not come up healthy after restart — rolling back." >&2
  restore_backup
  pm2 restart "$PM2_APP"
  exit 1
fi

rm -rf "$BUILD_BAK"
echo "==> Deploy successful: $BRANCH is live and healthy."
