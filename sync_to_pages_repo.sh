#!/usr/bin/env zsh
set -euo pipefail

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
PAGES_WORKDIR="${PAGES_WORKDIR:-$HOME/vtrai-site-pages}"

if [[ ! -d "$PAGES_WORKDIR/.git" ]]; then
  echo "Missing git repo at $PAGES_WORKDIR. Run setup_github_pages.sh first."
  exit 1
fi

python3 "$SRC_DIR/generate_sitemap.py"

rsync -av --delete \
  --exclude 'logs/' \
  --exclude '__pycache__/' \
  --exclude '*.pyc' \
  --exclude '.DS_Store' \
  --exclude '.git/' \
  "$SRC_DIR/" "$PAGES_WORKDIR/"

echo "Synced site files to: $PAGES_WORKDIR"
echo "Now commit + push:"
echo "  cd \"$PAGES_WORKDIR\""
echo "  git add -A && git commit -m \"Update site\" && git push"
