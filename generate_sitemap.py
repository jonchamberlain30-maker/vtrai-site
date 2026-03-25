#!/usr/bin/env python3
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import re
from xml.sax.saxutils import escape


SITE_DIR = Path(__file__).resolve().parent
SITEMAP_PATH = SITE_DIR / "sitemap.xml"
SITE_ORIGIN = "https://getvectora.ai"

ORDER = [
    "index.html",
    "guides.html",
    "buy-and-verify.html",
    "solana-token-checker.html",
    "dexscreener-token-checker.html",
    "mint-authority-freeze-authority.html",
    "open-preview.html",
    "proof.html",
    "token-info.html",
    "verify-token.html",
    "updates.html",
    "whitepaper.html",
    "liquidity-covenant.html",
    "wallet-control-policy.html",
]

CHANGEFREQ = {
    "index.html": "daily",
    "guides.html": "weekly",
    "buy-and-verify.html": "daily",
    "solana-token-checker.html": "weekly",
    "dexscreener-token-checker.html": "weekly",
    "mint-authority-freeze-authority.html": "weekly",
    "open-preview.html": "daily",
    "token-info.html": "weekly",
    "updates.html": "daily",
}

PRIORITY = {
    "index.html": "1.0",
    "guides.html": "0.9",
    "buy-and-verify.html": "0.95",
    "solana-token-checker.html": "0.9",
    "dexscreener-token-checker.html": "0.88",
    "mint-authority-freeze-authority.html": "0.86",
    "open-preview.html": "0.92",
    "proof.html": "0.9",
    "token-info.html": "0.88",
    "verify-token.html": "0.9",
    "updates.html": "0.9",
    "whitepaper.html": "0.8",
    "liquidity-covenant.html": "0.8",
    "wallet-control-policy.html": "0.75",
}

CANONICAL_RE = re.compile(r'<link\s+rel="canonical"\s+href="([^"]+)"', re.IGNORECASE)
ROBOTS_RE = re.compile(r'<meta\s+name="robots"\s+content="([^"]+)"', re.IGNORECASE)


def parse_entry(path: Path) -> dict | None:
    text = path.read_text(encoding="utf-8")
    robots_match = ROBOTS_RE.search(text)
    robots = (robots_match.group(1).strip().lower() if robots_match else "")
    if "noindex" in robots:
      return None

    canonical_match = CANONICAL_RE.search(text)
    if canonical_match:
        loc = canonical_match.group(1).strip()
    elif path.name == "index.html":
        loc = f"{SITE_ORIGIN}/"
    else:
        loc = f"{SITE_ORIGIN}/{path.name}"

    lastmod = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).date().isoformat()
    return {
        "name": path.name,
        "loc": loc,
        "lastmod": lastmod,
        "changefreq": CHANGEFREQ.get(path.name, "weekly"),
        "priority": PRIORITY.get(path.name, "0.7"),
    }


def render(entries: list[dict]) -> str:
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for entry in entries:
        lines.extend(
            [
                "  <url>",
                f"    <loc>{escape(entry['loc'])}</loc>",
                f"    <lastmod>{entry['lastmod']}</lastmod>",
                f"    <changefreq>{entry['changefreq']}</changefreq>",
                f"    <priority>{entry['priority']}</priority>",
                "  </url>",
            ]
        )
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def main() -> int:
    order_index = {name: idx for idx, name in enumerate(ORDER)}
    entries = []
    for path in SITE_DIR.glob("*.html"):
        entry = parse_entry(path)
        if entry:
            entries.append(entry)
    entries.sort(key=lambda entry: (order_index.get(entry["name"], len(order_index)), entry["name"]))
    SITEMAP_PATH.write_text(render(entries), encoding="utf-8")
    print(SITEMAP_PATH)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
