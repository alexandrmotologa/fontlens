from pathlib import Path
from fontlens.exporter import (
    export_critical_html,
    export_nextjs_config,
    export_tailwind_v3,
    export_tailwind_v4,
    generate_audit_report,
)
from fontlens.metrics import calculate_metric_overrides, extract_font_metrics

SAMPLE_ROBOTO = Path(__file__).resolve().parent.parent / "samples" / "Roboto-Regular.ttf"


def test_exporter_frameworks():
    metrics = extract_font_metrics(str(SAMPLE_ROBOTO))
    overrides = calculate_metric_overrides(metrics, fallback="Arial")

    nextjs_code = export_nextjs_config(overrides)
    assert "localFont" in nextjs_code
    assert "ascent-override" in nextjs_code

    tw_v4 = export_tailwind_v4(overrides)
    assert "@theme" in tw_v4
    assert "--font-" in tw_v4

    tw_v3 = export_tailwind_v3(overrides)
    assert "module.exports" in tw_v3
    assert "fontFamily" in tw_v3

    html_code = export_critical_html(overrides)
    assert "<link rel=\"preload\"" in html_code
    assert "<style>" in html_code

    report = generate_audit_report(
        metadata={"family": "Roboto", "units_per_em": 2048, "is_variable": False},
        subset_data={"subset_size_kb": 12.5, "brotli_size_kb": 10.2},
        overrides=overrides,
    )
    assert report["font_family"] == "Roboto"
    assert "core_web_vitals_impact" in report
    assert report["core_web_vitals_impact"]["cls_before_overrides"] > 0.1
