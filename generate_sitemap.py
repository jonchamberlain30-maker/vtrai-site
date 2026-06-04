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
    "about.html",
    "guides.html",
    "5-minute-token-verification-checklist.html",
    "public-proof-before-trading.html",
    "vtrai.html",
    "buy-and-verify.html",
    "base-token-checker.html",
    "solana-token-checker.html",
    "solana-mint-authority.html",
    "how-to-find-token-address-on-dexscreener.html",
    "dexscreener-token-checker.html",
    "mint-authority-freeze-authority.html",
    "lab.html",
    "open-preview.html",
    "proof-hunt.html",
    "proof.html",
    "report.html",
    "jupiter-review.html",
    "token-info.html",
    "token-role.html",
    "verify-token.html",
    "updates.html",
    "whitepaper.html",
    "liquidity-covenant.html",
    "wallet-control-policy.html",
    "privacy.html",
    "terms.html",
    "disclaimer.html",
    "contact.html",
]

CHANGEFREQ = {
    "index.html": "daily",
    "about.html": "weekly",
    "guides.html": "weekly",
    "5-minute-token-verification-checklist.html": "weekly",
    "public-proof-before-trading.html": "weekly",
    "vtrai.html": "daily",
    "buy-and-verify.html": "daily",
    "base-token-checker.html": "weekly",
    "solana-token-checker.html": "weekly",
    "solana-mint-authority.html": "weekly",
    "how-to-find-token-address-on-dexscreener.html": "weekly",
    "dexscreener-token-checker.html": "weekly",
    "mint-authority-freeze-authority.html": "weekly",
    "lab.html": "weekly",
    "open-preview.html": "daily",
    "proof-hunt.html": "daily",
    "token-info.html": "weekly",
    "report.html": "weekly",
    "jupiter-review.html": "weekly",
    "token-role.html": "weekly",
    "updates.html": "daily",
    "privacy.html": "monthly",
    "terms.html": "monthly",
    "disclaimer.html": "monthly",
    "contact.html": "monthly",
}

PRIORITY = {
    "index.html": "1.0",
    "about.html": "0.82",
    "guides.html": "0.9",
    "5-minute-token-verification-checklist.html": "0.92",
    "public-proof-before-trading.html": "0.9",
    "vtrai.html": "0.95",
    "buy-and-verify.html": "0.95",
    "base-token-checker.html": "0.9",
    "solana-token-checker.html": "0.9",
    "solana-mint-authority.html": "0.89",
    "how-to-find-token-address-on-dexscreener.html": "0.89",
    "dexscreener-token-checker.html": "0.88",
    "mint-authority-freeze-authority.html": "0.86",
    "lab.html": "0.88",
    "open-preview.html": "0.92",
    "proof-hunt.html": "0.92",
    "proof.html": "0.9",
    "report.html": "0.86",
    "jupiter-review.html": "0.86",
    "token-info.html": "0.88",
    "token-role.html": "0.88",
    "verify-token.html": "0.9",
    "updates.html": "0.9",
    "whitepaper.html": "0.8",
    "liquidity-covenant.html": "0.8",
    "wallet-control-policy.html": "0.75",
    "privacy.html": "0.6",
    "terms.html": "0.6",
    "disclaimer.html": "0.6",
    "contact.html": "0.65",
}

CANONICAL_RE = re.compile(r'<link\s+rel="canonical"\s+href="([^"]+)"', re.IGNORECASE)
ROBOTS_RE = re.compile(r'<meta\s+name="robots"\s+content="([^"]+)"', re.IGNORECASE)
STAGING_NAME_RE = re.compile(r".*-live-\d{8}\.html$", re.IGNORECASE)


def is_excluded(path: Path) -> bool:
    # Keep temporary cache-bust / staging pages out of sitemap permanently.
    return bool(STAGING_NAME_RE.match(path.name))


def parse_entry(path: Path) -> dict | None:
    if is_excluded(path):
        return None
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
