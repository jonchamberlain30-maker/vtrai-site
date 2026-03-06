#!/usr/bin/env zsh
set -euo pipefail

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
PAGES_WORKDIR="${PAGES_WORKDIR:-$HOME/vtrai-site-pages}"

echo "GitHub Pages setup"
echo
read "GH_USER?GitHub username: "
read "REPO_NAME?Repository name (e.g. vtrai-site): "
read "BRANCH_NAME?Branch to use [main]: "
BRANCH_NAME="${BRANCH_NAME:-main}"

if [[ -z "$GH_USER" || -z "$REPO_NAME" ]]; then
  echo "Username and repo are required."
  exit 1
fi

mkdir -p "$PAGES_WORKDIR"
rsync -av --delete \
  --exclude 'logs/' \
  --exclude '.DS_Store' \
  --exclude '.git/' \
  "$SRC_DIR/" "$PAGES_WORKDIR/"

cd "$PAGES_WORKDIR"

cat > .gitignore <<'EOF'
.DS_Store
logs/
EOF

touch .nojekyll

if [[ ! -d .git ]]; then
  git init
fi

git checkout -B "$BRANCH_NAME"
git add -A
git commit -m "Deploy VTRAI site to GitHub Pages" || true

REMOTE_URL="https://github.com/$GH_USER/$REPO_NAME.git"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

echo
echo "Local Pages repo prepared at: $PAGES_WORKDIR"
echo "Remote configured: $REMOTE_URL"
echo
echo "Next commands:"
echo "  cd \"$PAGES_WORKDIR\""
echo "  git push -u origin $BRANCH_NAME"
echo
echo "Then in GitHub repo settings:"
echo "  Settings -> Pages -> Build and deployment -> Source: Deploy from a branch"
echo "  Branch: $BRANCH_NAME / (root)"
echo
echo "Expected URL:"
echo "  https://$GH_USER.github.io/$REPO_NAME/"
