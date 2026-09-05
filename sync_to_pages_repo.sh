#!/usr/bin/env zsh
set -euo pipefail

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
# The manifest is the release boundary. No broad directory deletion or staging.
exec python3 "$SRC_DIR/../vtrai-automation/release_vectora_site.py" --apply "$@"
