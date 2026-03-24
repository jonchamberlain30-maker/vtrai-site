#!/usr/bin/env zsh
set -euo pipefail

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
DEST_DIR="/Users/jc/vtrai-site"

mkdir -p "$DEST_DIR"

python3 "$SRC_DIR/generate_sitemap.py"

rsync -av --delete \
  --exclude 'logs/' \
  --exclude '__pycache__/' \
  --exclude '*.pyc' \
  --exclude '.DS_Store' \
  "$SRC_DIR/" "$DEST_DIR/"

echo "Synced to: $DEST_DIR"
