"""Codebase glyph harvesting, Unicode frequency analysis, and CSS unicode-range generation."""

from __future__ import annotations

import os
import re
import unicodedata
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set, Tuple


# Common Unicode blocks and their ranges
UNICODE_BLOCKS: List[Tuple[int, int, str]] = [
    (0x0000, 0x007F, "Basic Latin (ASCII)"),
    (0x0080, 0x00FF, "Latin-1 Supplement"),
    (0x0100, 0x017F, "Latin Extended-A"),
    (0x0180, 0x024F, "Latin Extended-B"),
    (0x0250, 0x02AF, "IPA Extensions"),
    (0x02B0, 0x02FF, "Spacing Modifier Letters"),
    (0x0300, 0x036F, "Combining Diacritical Marks"),
    (0x0370, 0x03FF, "Greek and Coptic"),
    (0x0400, 0x04FF, "Cyrillic"),
    (0x0500, 0x052F, "Cyrillic Supplementary"),
    (0x0590, 0x05FF, "Hebrew"),
    (0x0600, 0x06FF, "Arabic"),
    (0x1E00, 0x1EFF, "Latin Extended Additional"),
    (0x2000, 0x206F, "General Punctuation"),
    (0x2070, 0x209F, "Superscripts and Subscripts"),
    (0x20A0, 0x20CF, "Currency Symbols"),
    (0x2100, 0x214F, "Letterlike Symbols"),
    (0x2150, 0x218F, "Number Forms"),
    (0x2190, 0x21FF, "Arrows"),
    (0x2200, 0x22FF, "Mathematical Operators"),
    (0x2300, 0x23FF, "Miscellaneous Technical"),
    (0x2460, 0x24FF, "Enclosed Alphanumerics"),
    (0x2500, 0x257F, "Box Drawing"),
    (0x2580, 0x259F, "Block Elements"),
    (0x25A0, 0x25FF, "Geometric Shapes"),
    (0x2600, 0x26FF, "Miscellaneous Symbols"),
    (0x2700, 0x27BF, "Dingbats"),
    (0x3000, 0x303F, "CJK Symbols and Punctuation"),
    (0x3040, 0x309F, "Hiragana"),
    (0x30A0, 0x30FF, "Katakana"),
    (0x4E00, 0x9FFF, "CJK Unified Ideographs"),
    (0xAC00, 0xD7AF, "Hangul Syllables"),
    (0x1F300, 0x1F5FF, "Miscellaneous Symbols and Pictographs"),
    (0x1F600, 0x1F64F, "Emoticons"),
    (0x1F680, 0x1F6FF, "Transport and Map Symbols"),
    (0x1F900, 0x1F9FF, "Supplemental Symbols and Pictographs"),
]

# Standard charset presets
PRESETS: Dict[str, str] = {
    "ascii-printable": "".join(chr(i) for i in range(32, 127)),
    "digits": "0123456789",
    "punctuation": "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
    "currency": "$€£¥₹₽₩₪₺¢¤",
    "latin-basic": (
        "".join(chr(i) for i in range(32, 127))
        + "„”«»–—‘’‚…·•"
    ),
    "latin-western": (
        "".join(chr(i) for i in range(32, 127))
        + "".join(chr(i) for i in range(160, 256))
        + "„”«»–—‘’‚…·•€"
    ),
}

DEFAULT_EXTENSIONS: Set[str] = {
    ".html", ".htm", ".jsx", ".tsx", ".js", ".ts",
    ".vue", ".svelte", ".astro", ".md", ".mdx",
    ".json", ".txt", ".yaml", ".yml", ".py",
}

DEFAULT_IGNORED_DIRS: Set[str] = {
    ".git", "node_modules", "dist", "build", ".next",
    ".nuxt", ".turbo", ".venv", "venv", "__pycache__",
    ".idea", ".vscode", "target", "vendor", ".cache",
    "coverage", ".parcel-cache",
}


def get_unicode_block(cp: int) -> str:
    """Return the name of the Unicode block for a given codepoint."""
    for start, end, name in UNICODE_BLOCKS:
        if start <= cp <= end:
            return name
    return "Other / Private Use"


def format_codepoints_as_css_range(codepoints: Iterable[int]) -> str:
    """Format a collection of codepoints into a standard CSS unicode-range string.

    Example: U+0020-007E, U+00A0-00FF, U+20AC
    """
    sorted_cps = sorted(set(codepoints))
    if not sorted_cps:
        return ""

    ranges: List[Tuple[int, int]] = []
    start = sorted_cps[0]
    end = start

    for cp in sorted_cps[1:]:
        if cp == end + 1:
            end = cp
        else:
            ranges.append((start, end))
            start = cp
            end = cp
    ranges.append((start, end))

    tokens: List[str] = []
    for s, e in ranges:
        if s == e:
            tokens.append(f"U+{s:04X}")
        else:
            tokens.append(f"U+{s:04X}-{e:04X}")

    return ", ".join(tokens)


@dataclass
class BlockStatistics:
    name: str
    count: int
    percentage: float
    characters: str


@dataclass
class HarvestResult:
    unique_glyphs: str
    total_characters: int
    unique_count: int
    frequencies: Dict[str, int]
    blocks: List[BlockStatistics]
    css_unicode_range: str
    scanned_files_count: int = 0
    scanned_files: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "unique_glyphs": self.unique_glyphs,
            "total_characters": self.total_characters,
            "unique_count": self.unique_count,
            "frequencies": self.frequencies,
            "blocks": [
                {
                    "name": b.name,
                    "count": b.count,
                    "percentage": b.percentage,
                    "characters": b.characters,
                }
                for b in self.blocks
            ],
            "css_unicode_range": self.css_unicode_range,
            "scanned_files_count": self.scanned_files_count,
            "scanned_files": self.scanned_files,
        }


class CodebaseHarvester:
    """Scans files and source code to harvest unique glyphs and generate optimization data."""

    def __init__(
        self,
        extensions: Optional[Set[str]] = None,
        ignored_dirs: Optional[Set[str]] = None,
        include_presets: Optional[List[str]] = None,
    ):
        self.extensions = extensions or DEFAULT_EXTENSIONS
        self.ignored_dirs = ignored_dirs or DEFAULT_IGNORED_DIRS
        self.include_presets = include_presets or []

    def harvest_text(self, text: str, source_name: str = "inline_text") -> HarvestResult:
        """Harvest unique glyphs from a raw string of text or code."""
        counter = Counter(text)

        # Merge requested presets if any
        for preset_name in self.include_presets:
            preset_chars = PRESETS.get(preset_name, "")
            for ch in preset_chars:
                if ch not in counter:
                    counter[ch] = 1

        return self._build_result(counter, scanned_files=[source_name])

    def harvest_files(self, paths: List[str | Path]) -> HarvestResult:
        """Scan a list of file and/or directory paths and aggregate all glyphs."""
        counter: Counter[str] = Counter()
        scanned_files: List[str] = []

        for p in paths:
            path_obj = Path(p).resolve()
            if not path_obj.exists():
                continue

            if path_obj.is_file():
                self._scan_file(path_obj, counter, scanned_files)
            elif path_obj.is_dir():
                self._scan_directory(path_obj, counter, scanned_files)

        # Merge requested presets
        for preset_name in self.include_presets:
            preset_chars = PRESETS.get(preset_name, "")
            for ch in preset_chars:
                if ch not in counter:
                    counter[ch] = 1

        return self._build_result(counter, scanned_files=scanned_files)

    def _scan_directory(
        self, directory: Path, counter: Counter[str], scanned_files: List[str]
    ) -> None:
        for root, dirs, files in os.walk(directory):
            # In-place prune ignored directories
            dirs[:] = [d for d in dirs if d not in self.ignored_dirs and not d.startswith(".")]

            for filename in files:
                ext = Path(filename).suffix.lower()
                if ext in self.extensions:
                    file_path = Path(root) / filename
                    self._scan_file(file_path, counter, scanned_files)

    def _scan_file(
        self, file_path: Path, counter: Counter[str], scanned_files: List[str]
    ) -> None:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                counter.update(content)
                scanned_files.append(str(file_path))
        except Exception:
            # Skip unreadable binary or permission-denied files
            pass

    def _build_result(
        self, counter: Counter[str], scanned_files: List[str]
    ) -> HarvestResult:
        # Filter out ASCII control characters (0x00 to 0x1F, except newline/tab)
        filtered_counter: Counter[str] = Counter()
        for ch, count in counter.items():
            cp = ord(ch)
            if cp < 32 and ch not in ("\n", "\t", "\r"):
                continue
            filtered_counter[ch] = count

        # Sort unique characters by unicode code point
        sorted_chars = sorted(filtered_counter.keys(), key=ord)
        unique_glyphs = "".join(sorted_chars)
        total_chars = sum(filtered_counter.values())
        unique_count = len(sorted_chars)

        # Group by Unicode blocks
        block_chars: Dict[str, List[str]] = {}
        for ch in sorted_chars:
            block = get_unicode_block(ord(ch))
            block_chars.setdefault(block, []).append(ch)

        blocks: List[BlockStatistics] = []
        for block_name, chars in sorted(block_chars.items(), key=lambda x: -len(x[1])):
            char_count = sum(filtered_counter[c] for c in chars)
            pct = (char_count / total_chars * 100.0) if total_chars > 0 else 0.0
            blocks.append(
                BlockStatistics(
                    name=block_name,
                    count=len(chars),
                    percentage=round(pct, 2),
                    characters="".join(chars),
                )
            )

        codepoints = [ord(c) for c in sorted_chars]
        css_range = format_codepoints_as_css_range(codepoints)

        return HarvestResult(
            unique_glyphs=unique_glyphs,
            total_characters=total_chars,
            unique_count=unique_count,
            frequencies=dict(filtered_counter.most_common(200)),
            blocks=blocks,
            css_unicode_range=css_range,
            scanned_files_count=len(scanned_files),
            scanned_files=scanned_files,
        )
