#!/usr/bin/env bash
#
# Davey Cooks — deploy a new release on the VPS.
#
# Run from the repo checkout after `git pull`:
#
#   cd /var/www/apps/davey-cooks/repo
#   git pull
#   ./scripts/deploy.sh             # build, stage, switch, smoke test
#   ./scripts/deploy.sh --rollback  # point `current` back at the previous release
#
# Layout (see docs/SITE.md):
#   /var/www/apps/davey-cooks/
#   ├── repo/                 git checkout (this script lives in repo/scripts/)
#   ├── releases/<id>/        one static build per deploy
#   └── current -> releases/<id>   Apache's DocumentRoot
#
# Environment overrides:
#   APP_DIR        app root (default: parent of the repo)
#   KEEP_RELEASES  how many releases to keep (default: 3)
#   SITE_HOST      hostname for the smoke test (default: davey-cooks.djm-apps.com)
#   SKIP_SMOKE=1   skip the smoke test
#
# Apache does not need a reload: switching the `current` symlink is enough.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="${APP_DIR:-$(dirname "$REPO_DIR")}"
RELEASES_DIR="$APP_DIR/releases"
CURRENT_LINK="$APP_DIR/current"
KEEP_RELEASES="${KEEP_RELEASES:-3}"
SITE_HOST="${SITE_HOST:-davey-cooks.djm-apps.com}"
MIN_NODE_MAJOR=20
MIN_NODE_MINOR=9

step() { printf '\n\033[1;33m==>\033[0m %s\n' "$*"; }
ok()   { printf '    \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '    \033[33m!\033[0m %s\n' "$*"; }
die()  { printf '\n\033[31mDeploy failed:\033[0m %s\n' "$*" >&2; exit 1; }

# Atomically point `current` at a release directory.
switch_current() {
  local target="$1"
  ln -sfn "$target" "$CURRENT_LINK.tmp"
  mv -T "$CURRENT_LINK.tmp" "$CURRENT_LINK"
}

# ---------------------------------------------------------------- preflight
if [[ "$(id -u)" -eq 0 ]]; then
  die "don't run this with sudo. Root-owned files break later builds. Run it as your normal user."
fi

[[ -f "$REPO_DIR/package.json" ]] || die "package.json not found in $REPO_DIR"
mkdir -p "$RELEASES_DIR"

# ----------------------------------------------------------------- rollback
if [[ "${1:-}" == "--rollback" ]]; then
  step "Rolling back"
  current_target="$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)"
  [[ -n "$current_target" ]] || die "$CURRENT_LINK doesn't exist; nothing to roll back."
  # Release names start with a timestamp, so reverse name order is newest first.
  previous=""
  found_current=0
  while IFS= read -r dir; do
    if [[ "$found_current" -eq 1 ]]; then previous="$dir"; break; fi
    [[ "$(readlink -f "$dir")" == "$current_target" ]] && found_current=1
  done < <(ls -1d "$RELEASES_DIR"/*/ 2>/dev/null | sed 's:/$::' | sort -r)
  [[ -n "$previous" ]] || die "no release older than $(basename "$current_target") to roll back to."
  switch_current "$previous"
  ok "current -> $(basename "$previous") (was $(basename "$current_target"))"
  exit 0
fi

[[ -z "${1:-}" ]] || die "unknown option: $1 (use --rollback or no arguments)"

step "Checking environment"
command -v node >/dev/null || die "node is not installed or not on PATH"
command -v npm  >/dev/null || die "npm is not installed or not on PATH"
node_version="$(node -p 'process.versions.node')"
IFS=. read -r node_major node_minor _ <<<"$node_version"
if (( node_major < MIN_NODE_MAJOR || (node_major == MIN_NODE_MAJOR && node_minor < MIN_NODE_MINOR) )); then
  die "Node $node_version is too old; Next.js 16 needs $MIN_NODE_MAJOR.$MIN_NODE_MINOR or newer."
fi
ok "node $node_version, npm $(npm --version)"

if [[ -n "$(find "$REPO_DIR" -maxdepth 2 -not -user "$(id -un)" -not -path '*/.git/*' -print -quit)" ]]; then
  die "some files in $REPO_DIR aren't owned by $(id -un). Fix with: sudo chown -R $(id -un):$(id -gn) $APP_DIR"
fi

cd "$REPO_DIR"
commit="$(git rev-parse --short HEAD)"
ok "commit $commit: $(git log -1 --format=%s)"
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  warn "the repo has uncommitted changes; they will be included in this build"
fi

# -------------------------------------------------------------------- build
step "Installing dependencies (npm ci)"
npm ci --no-audit --no-fund

step "Building (npm run build)"
npm run build

step "Checking build output"
for f in index.html 404.html recipes/index.html about/index.html og-image.png; do
  [[ -f "out/$f" ]] || die "expected out/$f is missing; not deploying."
done
recipe_count="$(find out/recipes -mindepth 2 -maxdepth 2 -name index.html | wc -l | tr -d ' ')"
mdx_count="$(find content/recipes -maxdepth 1 -name '*.mdx' | wc -l | tr -d ' ')"
[[ "$recipe_count" -eq "$mdx_count" ]] \
  || die "built $recipe_count recipe pages but found $mdx_count .mdx files."
ok "$recipe_count recipe pages, $(du -sh out | cut -f1) total"

# ------------------------------------------------------------------ release
step "Staging release"
release_id="$(date +%Y%m%d-%H%M%S)-$commit"
release_dir="$RELEASES_DIR/$release_id"
staging_dir="$RELEASES_DIR/.staging-$release_id"
rm -rf "$staging_dir"
cp -a out/. "$staging_dir/"
chmod -R a+rX "$staging_dir"   # Apache (www-data) needs read access
mv "$staging_dir" "$release_dir"
ok "releases/$release_id"

previous_target="$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)"
switch_current "$release_dir"
ok "current -> releases/$release_id"

step "Pruning old releases (keeping $KEEP_RELEASES)"
live="$(readlink -f "$CURRENT_LINK")"
pruned=0
while IFS= read -r dir; do
  [[ "$(readlink -f "$dir")" == "$live" ]] && continue
  rm -rf "$dir"
  pruned=$((pruned + 1))
done < <(ls -1d "$RELEASES_DIR"/*/ 2>/dev/null | sed 's:/$::' | sort -r | tail -n +"$((KEEP_RELEASES + 1))")
ok "removed $pruned old release(s)"

# --------------------------------------------------------------- smoke test
if [[ "${SKIP_SMOKE:-0}" == "1" ]]; then
  warn "smoke test skipped (SKIP_SMOKE=1)"
else
  step "Smoke test (local Apache, bypassing Cloudflare)"
  failed=0
  check() {
    local path="$1" expected="$2" status
    status="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 10 \
      --resolve "$SITE_HOST:443:127.0.0.1" "https://$SITE_HOST$path" || echo 000)"
    if [[ "$status" == "$expected" ]]; then
      ok "$path -> $status"
    else
      warn "$path -> $status (expected $expected)"
      failed=1
    fi
  }
  check / 200
  check /recipes/ 200
  check /about/ 200
  check /og-image.png 200
  check /this-page-does-not-exist/ 404

  if [[ "$failed" -eq 1 ]]; then
    printf '\n\033[31mThe smoke test failed.\033[0m The new release is live, so check it now.\n'
    if [[ -n "$previous_target" ]]; then
      printf 'To go back to the previous release:  %s --rollback\n' "$0"
    fi
    exit 1
  fi
fi

printf '\n\033[1;32mDeployed %s\033[0m  https://%s/\n' "$release_id" "$SITE_HOST"
