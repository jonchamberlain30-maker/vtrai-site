#!/usr/bin/env zsh
set -euo pipefail

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
DEST_DIR="/Users/jc/vtrai-site"

mkdir -p "$DEST_DIR"

rsync -av --delete \
  --exclude 'logs/' \
  --exclude '.DS_Store' \
  "$SRC_DIR/" "$DEST_DIR/"

echo "Synced to: $DEST_DIR"
