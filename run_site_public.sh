#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"
PORT="${PORT:-8790}"
LOCAL_HOST="${LOCAL_HOST:-127.0.0.1}"
SITE_URL=""
PY_PID=""

mkdir -p "$LOG_DIR"

cleanup() {
  if [[ -n "$PY_PID" ]] && kill -0 "$PY_PID" 2>/dev/null; then
    kill "$PY_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

cd "$ROOT_DIR"

port_is_busy() {
  lsof -iTCP:"$1" -sTCP:LISTEN -n -P >/dev/null 2>&1
}

if port_is_busy "$PORT"; then
  for p in {8791..8810}; do
    if ! port_is_busy "$p"; then
      PORT="$p"
      break
    fi
  done
fi

SITE_URL="http://$LOCAL_HOST:$PORT"

python3 -m http.server "$PORT" --bind "$LOCAL_HOST" >"$LOG_DIR/site.out.log" 2>"$LOG_DIR/site.err.log" &
PY_PID="$!"

# Wait until local server is reachable.
for _ in {1..40}; do
  if curl -fsS "$SITE_URL/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

echo "Local site running at: $SITE_URL"
echo "Starting public tunnel..."
echo "Press Ctrl+C to stop both server and tunnel."
echo

cloudflared tunnel --no-autoupdate --url "$SITE_URL" 2>&1 | tee "$LOG_DIR/cloudflared.log"
