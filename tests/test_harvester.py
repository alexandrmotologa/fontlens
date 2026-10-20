import pytest
from fontlens.harvester import CodebaseHarvester, format_codepoints_as_css_range, get_unicode_block


def test_format_codepoints_as_css_range():
    cps = [ord("a"), ord("b"), ord("c"), 0x20AC]
    css_range = format_codepoints_as_css_range(cps)
    assert "U+0061-0063" in css_range
    assert "U+20AC" in css_range


def test_unicode_block():
    assert get_unicode_block(ord("A")) == "Basic Latin (ASCII)"
    assert get_unicode_block(0x20AC) == "Currency Symbols"
    assert get_unicode_block(0x0410) == "Cyrillic"


def test_harvest_text():
    harvester = CodebaseHarvester()
    sample = "Hello World! 123 € $ <div className='test'>React 19</div>"
    res = harvester.harvest_text(sample)

    assert res.total_characters > 0
    assert "H" in res.unique_glyphs
    assert "€" in res.unique_glyphs
    assert "$" in res.unique_glyphs
    assert res.unique_count == len(set(sample))
    assert any(b.name == "Basic Latin (ASCII)" for b in res.blocks)
    assert any(b.name == "Currency Symbols" for b in res.blocks)


def test_harvest_with_presets():
    harvester = CodebaseHarvester(include_presets=["digits", "currency"])
    res = harvester.harvest_text("abc")
    for d in "0123456789":
        assert d in res.unique_glyphs
    assert "€" in res.unique_glyphs
