from pathlib import Path
import pytest
from fontlens.fallbacks import get_fallback_registry
from fontlens.metrics import calculate_metric_overrides, extract_font_metrics


SAMPLE_ROBOTO = Path(__file__).resolve().parent.parent / "samples" / "Roboto-Regular.ttf"
SAMPLE_INTER = Path(__file__).resolve().parent.parent / "samples" / "Inter-Variable.ttf"


def test_fallback_registry():
    registry = get_fallback_registry()
    fonts = registry.list_all()
    assert len(fonts) >= 10
    arial = registry.get("Arial")
    assert arial is not None
    assert arial.units_per_em == 2048
    assert arial.category == "sans-serif"


def test_extract_font_metrics():
    metrics = extract_font_metrics(str(SAMPLE_ROBOTO))
    assert metrics.family_name == "Roboto"
    assert metrics.units_per_em == 2048
    assert metrics.ascent > 0
    assert metrics.descent < 0
    assert metrics.avg_char_width > 0


def test_calculate_metric_overrides():
    metrics = extract_font_metrics(str(SAMPLE_ROBOTO))
    overrides = calculate_metric_overrides(metrics, fallback="Arial")

    assert overrides.web_font_family == "Roboto"
    assert overrides.fallback_font_name == "Arial"
    assert overrides.ascent_override > 0
    assert overrides.descent_override > 0
    assert overrides.size_adjust > 0
    assert "@font-face" in overrides.css_rule
    assert "ascent-override:" in overrides.css_rule
    assert "size-adjust:" in overrides.css_rule
    assert overrides.estimated_cls_reduction > 90.0


def test_inter_variable_metrics():
    metrics = extract_font_metrics(str(SAMPLE_INTER))
    assert metrics.family_name == "Inter"
    assert metrics.use_typo_metrics is True
    overrides = calculate_metric_overrides(metrics, fallback="Segoe UI")
    assert overrides.fallback_font_name == "Segoe UI"
    assert "Inter-Fallback" in overrides.css_rule
