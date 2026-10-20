"""High-speed WOFF2 subset synthesizer with OpenType table pruning and variable font axis slicing."""

from __future__ import annotations

import gzip
import io
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Union
import brotli
from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


# OpenType tables safe to drop for modern web browsers
SAFE_DROP_TABLES: List[str] = [
    "gasp", "VDMX", "LTSH", "hdmx", "DSIG",
    "vhea", "vmtx", "PCLT", "feat", "morx", "mort",
    "prop", "opbd", "Zapf",
]


@dataclass
class SubsetConfig:
    text: Optional[str] = None
    unicodes: Optional[List[int]] = None
    glyphs: Optional[List[str]] = None
    flavor: str = "woff2"  # "woff2", "woff", "ttf", "otf"
    strip_hinting: bool = False
    drop_tables: List[str] = field(default_factory=lambda: list(SAFE_DROP_TABLES))
    retain_layout_features: bool = True  # GPOS, GSUB (kerning, ligatures)
    desubroutinize: bool = True
    variable_axes_clamp: Optional[Dict[str, Union[float, Tuple[float, float]]]] = None


@dataclass
class SubsetResult:
    output_bytes: bytes
    original_size_bytes: int
    subset_size_bytes: int
    compression_percent: float
    gzip_size_bytes: int
    brotli_size_bytes: int
    original_glyph_count: int
    retained_glyph_count: int
    original_tables: List[str]
    retained_tables: List[str]
    dropped_tables: List[str]
    is_variable: bool
    flavor: str

    def to_dict(self) -> dict:
        return {
            "original_size_bytes": self.original_size_bytes,
            "original_size_kb": round(self.original_size_bytes / 1024, 2),
            "subset_size_bytes": self.subset_size_bytes,
            "subset_size_kb": round(self.subset_size_bytes / 1024, 2),
            "compression_percent": round(self.compression_percent, 2),
            "gzip_size_bytes": self.gzip_size_bytes,
            "gzip_size_kb": round(self.gzip_size_bytes / 1024, 2),
            "brotli_size_bytes": self.brotli_size_bytes,
            "brotli_size_kb": round(self.brotli_size_bytes / 1024, 2),
            "original_glyph_count": self.original_glyph_count,
            "retained_glyph_count": self.retained_glyph_count,
            "original_tables": self.original_tables,
            "retained_tables": self.retained_tables,
            "dropped_tables": self.dropped_tables,
            "is_variable": self.is_variable,
            "flavor": self.flavor,
        }


class FontSubsetter:
    """Subsets TrueType/OpenType/WOFF2 fonts into lean web fonts."""

    def __init__(self, font_input: Union[str, Path, bytes, TTFont]):
        if isinstance(font_input, TTFont):
            self.font = font_input
            self.original_bytes = self._dump_font_to_bytes(font_input)
        elif isinstance(font_input, (str, Path)):
            with open(font_input, "rb") as f:
                self.original_bytes = f.read()
            self.font = TTFont(io.BytesIO(self.original_bytes))
        else:
            self.original_bytes = font_input
            self.font = TTFont(io.BytesIO(self.original_bytes))

        self.original_size = len(self.original_bytes)
        self.original_glyph_count = len(self.font.getGlyphOrder())
        self.original_tables = list(self.font.keys())
        self.is_variable = "fvar" in self.font

    @staticmethod
    def _dump_font_to_bytes(font: TTFont, flavor: Optional[str] = None) -> bytes:
        buf = io.BytesIO()
        old_flavor = font.flavor
        if flavor is not None:
            font.flavor = flavor
        font.save(buf)
        font.flavor = old_flavor
        return buf.getvalue()

    def subset(self, config: SubsetConfig) -> SubsetResult:
        """Execute subsetting and compression according to configuration."""
        # Work on a fresh copy of the TTFont
        font = TTFont(io.BytesIO(self.original_bytes))

        # Configure subsetter options
        options = Options()
        options.drop_tables += config.drop_tables
        options.desubroutinize = config.desubroutinize
        options.notdef_glyph = True
        options.notdef_outline = True

        if config.strip_hinting:
            options.hinting = False

        if not config.retain_layout_features:
            options.layout_features = []

        if config.flavor in ("woff2", "woff"):
            options.flavor = config.flavor

        subsetter = Subsetter(options=options)

        # Populate glyphs to keep
        if config.text:
            subsetter.populate(text=config.text)
        elif config.unicodes:
            subsetter.populate(unicodes=config.unicodes)
        elif config.glyphs:
            subsetter.populate(glyphs=config.glyphs)
        else:
            # Default fallback: keep ASCII printable if nothing specified
            subsetter.populate(text="".join(chr(i) for i in range(32, 127)))

        # Run subsetting
        subsetter.subset(font)

        # Handle variable font axes clamping/slicing on the subsetted font
        if self.is_variable and config.variable_axes_clamp and "fvar" in font:
            try:
                font = instantiateVariableFont(font, config.variable_axes_clamp)
            except Exception:
                # If axis clamping fails on edge cases, keep subsetted variable font
                pass

        # Set requested flavor
        if config.flavor == "woff2":
            font.flavor = "woff2"
        elif config.flavor == "woff":
            font.flavor = "woff"
        else:
            font.flavor = None

        # Save output bytes
        out_buf = io.BytesIO()
        font.save(out_buf)
        output_bytes = out_buf.getvalue()

        subset_size = len(output_bytes)
        retained_glyphs = len(font.getGlyphOrder())
        retained_tables = list(font.keys())
        dropped_tables = [t for t in self.original_tables if t not in retained_tables]

        # Calculate gzip and brotli metrics
        gzip_buf = io.BytesIO()
        with gzip.GzipFile(fileobj=gzip_buf, mode="wb", compresslevel=9) as gz:
            gz.write(output_bytes)
        gzip_size = len(gzip_buf.getvalue())

        try:
            brotli_size = len(brotli.compress(output_bytes, quality=11))
        except Exception:
            brotli_size = subset_size

        compression_pct = (
            ((self.original_size - subset_size) / self.original_size * 100.0)
            if self.original_size > 0
            else 0.0
        )

        return SubsetResult(
            output_bytes=output_bytes,
            original_size_bytes=self.original_size,
            subset_size_bytes=subset_size,
            compression_percent=max(0.0, compression_pct),
            gzip_size_bytes=gzip_size,
            brotli_size_bytes=brotli_size,
            original_glyph_count=self.original_glyph_count,
            retained_glyph_count=retained_glyphs,
            original_tables=self.original_tables,
            retained_tables=retained_tables,
            dropped_tables=dropped_tables,
            is_variable="fvar" in font,
            flavor=config.flavor,
        )
