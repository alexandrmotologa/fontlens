from pathlib import Path
from fontlens.splitter import split_font

SAMPLE_ROBOTO = Path(__file__).resolve().parent.parent / "samples" / "Roboto-Regular.ttf"


def test_split_font():
    res = split_font(str(SAMPLE_ROBOTO), family_name="Roboto")
    assert res.family_name == "Roboto"
    assert len(res.chunks) >= 2
    assert any(c.chunk_id == "latin" for c in res.chunks)
    assert "@font-face" in res.combined_css
    assert "unicode-range:" in res.combined_css
