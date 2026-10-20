"""Progressive font chunking with disjoint CSS unicode-range definitions."""

from __future__ import annotations

import io
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Union
from fontTools.ttLib import TTFont

from fontlens.harvester import format_codepoints_as_css_range
from fontlens.subsetter import FontSubsetter, SubsetConfig


# Standard chunk specifications
CHUNK_DEFINITIONS: List[Tuple[str, str, List[Tuple[int, int]]]] = [
    (
        "latin",
        "Basic Latin & Punctuation",
        [
            (0x0020, 0x007E),  # ASCII printable
            (0x00A0, 0x00FF),  # Latin-1 Supplement
            (0x2013, 0x2014),  # En / Em dash
            (0x2018, 0x201D),  # Curly quotes
            (0x2026, 0x2026),  # Ellipsis
            (0x20AC, 0x20AC),  # Euro
        ],
    ),
    (
        "latin-ext",
        "Latin Extended & Diacritics",
        [
            (0x0100, 0x017F),  # Latin Extended-A
            (0x0180, 0x024F),  # Latin Extended-B
            (0x1E00, 0x1EFF),  # Latin Extended Additional
        ],
    ),
    (
        "symbols",
        "Currency, Arrows & Mathematics",
        [
            (0x20A0, 0x20CF),  # Currency symbols
            (0x2190, 0x21FF),  # Arrows
            (0x2200, 0x22FF),  # Mathematical operators
            (0x25A0, 0x25FF),  # Geometric shapes
        ],
    ),
]


@dataclass
class FontChunk:
    chunk_id: str
    label: str
    output_bytes: bytes
    size_bytes: int
    size_kb: float
    glyph_count: int
    css_unicode_range: str
    filename: str

    def to_dict(self) -> dict:
        return {
            "chunk_id": self.chunk_id,
            "label": self.label,
            "size_bytes": self.size_bytes,
            "size_kb": self.size_kb,
            "glyph_count": self.glyph_count,
            "css_unicode_range": self.css_unicode_range,
            "filename": self.filename,
        }


@dataclass
class SplitResult:
    family_name: str
    original_size_bytes: int
    chunks: List[FontChunk]
    combined_css: str

    def to_dict(self) -> dict:
        return {
            "family_name": self.family_name,
            "original_size_bytes": self.original_size_bytes,
            "original_size_kb": round(self.original_size_bytes / 1024, 2),
            "chunks": [c.to_dict() for c in self.chunks],
            "combined_css": self.combined_css,
        }


def split_font(
    font_input: Union[str, bytes, TTFont],
    family_name: Optional[str] = None,
    strip_hinting: bool = True,
) -> SplitResult:
    """Split a font into progressive WOFF2 chunks with CSS unicode-range definitions."""
    if isinstance(font_input, TTFont):
        font = font_input
        buf = io.BytesIO()
        font.save(buf)
        orig_bytes = buf.getvalue()
    elif isinstance(font_input, bytes):
        orig_bytes = font_input
        font = TTFont(io.BytesIO(font_input))
    else:
        with open(font_input, "rb") as f:
            orig_bytes = f.read()
        font = TTFont(io.BytesIO(orig_bytes))

    if not family_name:
        family_name = "CustomFont"
        if "name" in font:
            for rec in font["name"].names:
                if rec.nameID in (1, 16):
                    try:
                        family_name = rec.toUnicode()
                        break
                    except Exception:
                        pass

    font_cmap = font.getBestCmap() or {}
    available_cps = set(font_cmap.keys())

    chunks: List[FontChunk] = []
    css_rules: List[str] = []

    for chunk_id, label, ranges in CHUNK_DEFINITIONS:
        # Collect codepoints in this chunk that exist in the font
        chunk_cps: List[int] = []
        for start, end in ranges:
            for cp in range(start, end + 1):
                if cp in available_cps:
                    chunk_cps.append(cp)

        if not chunk_cps:
            continue

        chunk_text = "".join(chr(cp) for cp in chunk_cps)
        subsetter = FontSubsetter(orig_bytes)
        config = SubsetConfig(
            text=chunk_text,
            flavor="woff2",
            strip_hinting=strip_hinting,
        )
        res = subsetter.subset(config)

        css_range = format_codepoints_as_css_range(chunk_cps)
        clean_name = family_name.replace(" ", "_")
        filename = f"{clean_name}-{chunk_id}.woff2"

        chunk_obj = FontChunk(
            chunk_id=chunk_id,
            label=label,
            output_bytes=res.output_bytes,
            size_bytes=res.subset_size_bytes,
            size_kb=round(res.subset_size_bytes / 1024, 2),
            glyph_count=res.retained_glyph_count,
            css_unicode_range=css_range,
            filename=filename,
        )
        chunks.append(chunk_obj)

        css_rule = (
            f"/* {family_name} ({label}) */\n"
            f"@font-face {{\n"
            f"  font-family: '{family_name}';\n"
            f"  src: url('/fonts/{filename}') format('woff2');\n"
            f"  font-display: swap;\n"
            f"  unicode-range: {css_range};\n"
            f"}}"
        )
        css_rules.append(css_rule)

    combined_css = "\n\n".join(css_rules)

    return SplitResult(
        family_name=family_name,
        original_size_bytes=len(orig_bytes),
        chunks=chunks,
        combined_css=combined_css,
    )
