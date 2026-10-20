from pathlib import Path
from fontlens.metrics import calculate_multiplatform_overrides

SAMPLE_ROBOTO = Path(__file__).resolve().parent.parent / "samples" / "Roboto-Regular.ttf"


def test_multiplatform_overrides():
    multi = calculate_multiplatform_overrides(str(SAMPLE_ROBOTO))
    assert multi.web_font_family == "Roboto"
    assert multi.windows.fallback_font_name in ("Segoe UI", "Arial")
    assert multi.macos.fallback_font_name in ("Helvetica", "Arial")
    assert multi.android.fallback_font_name in ("Roboto", "Arial")
    assert "Roboto-Fallback-Windows" in multi.full_css_snippet
    assert "Roboto-Fallback-Apple" in multi.full_css_snippet
    assert "Roboto-Fallback-Android" in multi.full_css_snippet
