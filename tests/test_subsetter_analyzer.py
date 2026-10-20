from pathlib import Path
import pytest
from fontlens.analyzer import FontAnalyzer
from fontlens.subsetter import FontSubsetter, SubsetConfig


SAMPLE_ROBOTO = Path(__file__).resolve().parent.parent / "samples" / "Roboto-Regular.ttf"
SAMPLE_INTER = Path(__file__).resolve().parent.parent / "samples" / "Inter-Variable.ttf"


def test_subset_roboto():
    subsetter = FontSubsetter(SAMPLE_ROBOTO)
    assert subsetter.original_size > 0
    assert subsetter.original_glyph_count > 1000

    config = SubsetConfig(
        text="Hello FontLens Zero CLS 123",
        flavor="woff2",
        strip_hinting=True,
    )
    result = subsetter.subset(config)

    assert result.flavor == "woff2"
    assert result.subset_size_bytes < subsetter.original_size
    assert result.compression_percent > 90.0  # Should be >95% smaller
    assert result.retained_glyph_count < 100
    assert len(result.output_bytes) > 0


def test_subset_inter_variable():
    subsetter = FontSubsetter(SAMPLE_INTER)
    assert subsetter.is_variable is True

    config = SubsetConfig(
        text="Quick brown fox jumps over lazy dog",
        flavor="woff2",
        variable_axes_clamp={"wght": (400, 700)},
    )
    result = subsetter.subset(config)

    assert result.flavor == "woff2"
    assert result.subset_size_bytes < subsetter.original_size
    assert result.is_variable is True


def test_analyzer_metadata():
    analyzer = FontAnalyzer(SAMPLE_ROBOTO)
    meta = analyzer.get_metadata()

    assert meta.family == "Roboto"
    assert meta.units_per_em == 2048
    assert meta.glyph_count > 1000
    assert len(meta.tables) > 10

    glyphs = analyzer.list_glyphs(limit=20)
    assert len(glyphs) == 20


def test_analyzer_svg_render():
    analyzer = FontAnalyzer(SAMPLE_ROBOTO)
    svg_info = analyzer.render_glyph_svg("A")

    assert svg_info is not None
    assert svg_info["glyph_name"] == "A"
    assert len(svg_info["svg_path"]) > 0
    assert "view_box" in svg_info
