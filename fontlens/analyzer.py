"""Font analyzer and SVG glyph outline renderer."""

from __future__ import annotations

import io
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

from fontlens.metrics import FontMetrics, extract_font_metrics


@dataclass
class VariableAxis:
    tag: str
    name: str
    min_value: float
    default_value: float
    max_value: float

    def to_dict(self) -> dict:
        return {
            "tag": self.tag,
            "name": self.name,
            "min_value": self.min_value,
            "default_value": self.default_value,
            "max_value": self.max_value,
        }


@dataclass
class VariableInstance:
    name: str
    coordinates: Dict[str, float]

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "coordinates": self.coordinates,
        }


@dataclass
class TableInfo:
    tag: str
    length: int

    def to_dict(self) -> dict:
        return {"tag": self.tag, "length": self.length}


@dataclass
class GlyphInfo:
    name: str
    unicode_hex: Optional[str]
    character: Optional[str]
    width: int

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "unicode_hex": self.unicode_hex,
            "character": self.character,
            "width": self.width,
        }


@dataclass
class FontMetadata:
    family: str
    subfamily: str
    full_name: str
    postscript_name: str
    version: str
    designer: Optional[str]
    copyright: Optional[str]
    units_per_em: int
    glyph_count: int
    tables: List[TableInfo]
    is_variable: bool
    axes: List[VariableAxis]
    instances: List[VariableInstance]
    metrics: FontMetrics
    supported_unicodes_count: int

    def to_dict(self) -> dict:
        return {
            "family": self.family,
            "subfamily": self.subfamily,
            "full_name": self.full_name,
            "postscript_name": self.postscript_name,
            "version": self.version,
            "designer": self.designer,
            "copyright": self.copyright,
            "units_per_em": self.units_per_em,
            "glyph_count": self.glyph_count,
            "tables": [t.to_dict() for t in self.tables],
            "is_variable": self.is_variable,
            "axes": [a.to_dict() for a in self.axes],
            "instances": [i.to_dict() for i in self.instances],
            "metrics": self.metrics.to_dict(),
            "supported_unicodes_count": self.supported_unicodes_count,
        }


class FontAnalyzer:
    """Introspects font tables, metadata, variable axes, and renders SVG glyph paths."""

    def __init__(self, font_input: Union[str, Path, bytes, TTFont]):
        if isinstance(font_input, TTFont):
            self.font = font_input
        elif isinstance(font_input, (str, Path)):
            self.font = TTFont(str(font_input))
        else:
            self.font = TTFont(io.BytesIO(font_input))

        self.upm = self.font["head"].unitsPerEm

    def get_metadata(self) -> FontMetadata:
        """Extract full font metadata and OpenType metrics."""
        name_records: Dict[int, str] = {}
        if "name" in self.font:
            for rec in self.font["name"].names:
                try:
                    name_records[rec.nameID] = rec.toUnicode()
                except Exception:
                    pass

        family = name_records.get(16) or name_records.get(1, "Unknown")
        subfamily = name_records.get(17) or name_records.get(2, "Regular")
        full_name = name_records.get(4, f"{family} {subfamily}".strip())
        postscript = name_records.get(6, family.replace(" ", ""))
        version = name_records.get(5, "1.0")
        designer = name_records.get(9)
        copyright_notice = name_records.get(0)

        # Tables
        tables: List[TableInfo] = []
        for tag in self.font.keys():
            try:
                length = len(self.font.getTableData(tag))
            except Exception:
                length = 0
            tables.append(TableInfo(tag=tag, length=length))

        # Variable axes and named instances
        is_variable = "fvar" in self.font
        axes: List[VariableAxis] = []
        instances: List[VariableInstance] = []

        if is_variable:
            fvar = self.font["fvar"]
            for a in fvar.axes:
                axis_name = a.axisTag
                if "name" in self.font and a.axisNameID in name_records:
                    axis_name = name_records[a.axisNameID]
                axes.append(
                    VariableAxis(
                        tag=a.axisTag,
                        name=axis_name,
                        min_value=float(a.minValue),
                        default_value=float(a.defaultValue),
                        max_value=float(a.maxValue),
                    )
                )

            for inst in getattr(fvar, "instances", []):
                inst_name = name_records.get(inst.subfamilyNameID, "Instance")
                coords = {k: float(v) for k, v in inst.coordinates.items()}
                instances.append(VariableInstance(name=inst_name, coordinates=coords))

        cmap = self.font.getBestCmap() or {}
        supported_unicodes_count = len(cmap)
        metrics = extract_font_metrics(self.font)

        return FontMetadata(
            family=family,
            subfamily=subfamily,
            full_name=full_name,
            postscript_name=postscript,
            version=version,
            designer=designer,
            copyright=copyright_notice,
            units_per_em=self.upm,
            glyph_count=len(self.font.getGlyphOrder()),
            tables=tables,
            is_variable=is_variable,
            axes=axes,
            instances=instances,
            metrics=metrics,
            supported_unicodes_count=supported_unicodes_count,
        )

    def list_glyphs(self, limit: int = 500) -> List[GlyphInfo]:
        """List glyphs with character code points and advance widths."""
        cmap = self.font.getBestCmap() or {}
        rev_cmap = {v: k for k, v in cmap.items()}
        hmtx = self.font["hmtx"].metrics if "hmtx" in self.font else {}

        results: List[GlyphInfo] = []
        glyph_order = self.font.getGlyphOrder()

        for gname in glyph_order[:limit]:
            cp = rev_cmap.get(gname)
            char = chr(cp) if cp is not None else None
            hex_str = f"U+{cp:04X}" if cp is not None else None
            width = hmtx.get(gname, (self.upm // 2, 0))[0]

            results.append(
                GlyphInfo(
                    name=gname,
                    unicode_hex=hex_str,
                    character=char,
                    width=width,
                )
            )

        return results

    def render_glyph_svg(
        self,
        identifier: Union[str, int],
        view_box_padding: int = 100,
    ) -> Optional[Dict[str, Any]]:
        """Render a glyph's vector path as SVG data.

        Identifier can be a character ('A'), integer codepoint (65), or glyph name ('A').
        """
        glyph_set = self.font.getGlyphSet()
        cmap = self.font.getBestCmap() or {}

        # Resolve glyph name
        if isinstance(identifier, int):
            glyph_name = cmap.get(identifier)
        elif isinstance(identifier, str) and len(identifier) == 1:
            glyph_name = cmap.get(ord(identifier))
        else:
            glyph_name = identifier

        if not glyph_name or glyph_name not in glyph_set:
            return None

        pen = SVGPathPen(glyph_set)
        glyph = glyph_set[glyph_name]
        glyph.draw(pen)
        commands = pen.getCommands()

        hmtx = self.font["hmtx"].metrics if "hmtx" in self.font else {}
        width, lsb = hmtx.get(glyph_name, (self.upm // 2, 0))

        # OpenType font coordinates: origin (0,0) at baseline, y goes up.
        # In SVG: y goes down. We transform by flipping y: transform="matrix(1 0 0 -1 0 UPM)"
        ascent = getattr(self.font["hhea"], "ascent", int(self.upm * 0.8))
        descent = getattr(self.font["hhea"], "descent", -int(self.upm * 0.2))

        total_height = ascent - descent
        vb_min_x = -view_box_padding
        vb_min_y = -descent - view_box_padding
        vb_width = width + (2 * view_box_padding)
        vb_height = total_height + (2 * view_box_padding)

        return {
            "glyph_name": glyph_name,
            "width": width,
            "lsb": lsb,
            "units_per_em": self.upm,
            "ascent": ascent,
            "descent": descent,
            "svg_path": commands,
            "view_box": f"0 {-ascent} {width} {total_height}",
            "transform": f"scale(1, -1) translate(0, {-ascent})",
        }
