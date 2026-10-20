"""Google Fonts downloader and resolver."""

from __future__ import annotations

import io
import re
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple


POPULAR_GOOGLE_FONTS = [
    {"family": "Inter", "category": "sans-serif", "weights": [400, 500, 600, 700]},
    {"family": "Roboto", "category": "sans-serif", "weights": [400, 500, 700]},
    {"family": "Poppins", "category": "sans-serif", "weights": [400, 600, 700]},
    {"family": "Montserrat", "category": "sans-serif", "weights": [400, 500, 700]},
    {"family": "Open Sans", "category": "sans-serif", "weights": [400, 600, 700]},
    {"family": "Lato", "category": "sans-serif", "weights": [400, 700]},
    {"family": "Playfair Display", "category": "serif", "weights": [400, 600, 700]},
    {"family": "Merriweather", "category": "serif", "weights": [400, 700]},
    {"family": "Plus Jakarta Sans", "category": "sans-serif", "weights": [400, 600, 700]},
    {"family": "Outfit", "category": "sans-serif", "weights": [400, 500, 600, 700]},
    {"family": "Fira Code", "category": "monospace", "weights": [400, 500, 700]},
    {"family": "Space Grotesk", "category": "sans-serif", "weights": [400, 600, 700]},
    {"family": "Work Sans", "category": "sans-serif", "weights": [400, 600]},
    {"family": "DM Sans", "category": "sans-serif", "weights": [400, 500, 700]},
    {"family": "Lora", "category": "serif", "weights": [400, 600]},
    {"family": "JetBrains Mono", "category": "monospace", "weights": [400, 700]},
]

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"


def get_popular_google_fonts() -> List[Dict]:
    """Return a curated list of trending web fonts."""
    return list(POPULAR_GOOGLE_FONTS)


def fetch_google_font(
    family_name: str,
    weight: int = 400,
    italic: bool = False,
) -> Tuple[bytes, str]:
    """Fetch font binary (.woff2) from Google Fonts API by family name.

    Returns:
        (font_bytes, filename)
    """
    clean_family = family_name.strip()
    encoded_family = urllib.parse.quote(clean_family)

    if italic:
        weight_spec = f"ital,wght@1,{weight}"
    else:
        weight_spec = f"wght@{weight}"

    css_url = f"https://fonts.googleapis.com/css2?family={encoded_family}:{weight_spec}&display=swap"

    req = urllib.request.Request(css_url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            css_content = resp.read().decode("utf-8")
    except Exception as e:
        raise RuntimeError(f"Failed to query Google Fonts CSS API for '{clean_family}': {e}")

    # Extract all .woff2 URLs in the response
    urls = re.findall(r"src:\s*url\((https://fonts\.gstatic\.com/[^)]+\.woff2)\)", css_content)
    if not urls:
        # Fallback to any URL in src
        urls = re.findall(r"src:\s*url\((https://[^)]+)\)", css_content)

    if not urls:
        raise ValueError(f"No font download URLs found in Google Fonts response for '{clean_family}'")

    # Usually the first block is latin or target subset
    target_url = urls[0]

    font_req = urllib.request.Request(target_url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(font_req, timeout=15) as font_resp:
            font_bytes = font_resp.read()
    except Exception as e:
        raise RuntimeError(f"Failed to download font binary from {target_url}: {e}")

    filename = f"{clean_family.replace(' ', '_')}-{weight}.woff2"
    return font_bytes, filename
