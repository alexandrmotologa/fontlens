from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from fontlens.server import app

client = TestClient(app)
SAMPLE_ROBOTO = Path(__file__).resolve().parent.parent / "samples" / "Roboto-Regular.ttf"


def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["service"] == "FontLens"


def test_api_system_fonts():
    res = client.get("/api/system-fonts")
    assert res.status_code == 200
    data = res.json()
    assert len(data["fonts"]) >= 10
    assert any(f["name"] == "Arial" for f in data["fonts"])


def test_api_scan_text():
    res = client.post("/api/scan-text", json={"text": "Hello FontLens! 123", "presets": ["currency"]})
    assert res.status_code == 200
    data = res.json()
    assert data["total_characters"] > 0
    assert "H" in data["unique_glyphs"]
    assert "€" in data["unique_glyphs"]


def test_api_analyze_font():
    with open(SAMPLE_ROBOTO, "rb") as f:
        res = client.post(
            "/api/analyze-font",
            files={"font": ("Roboto-Regular.ttf", f, "font/ttf")},
        )
    assert res.status_code == 200
    data = res.json()
    assert data["metadata"]["family"] == "Roboto"
    assert len(data["glyphs"]) > 0


def test_api_calculate_metrics():
    with open(SAMPLE_ROBOTO, "rb") as f:
        res = client.post(
            "/api/calculate-metrics",
            files={"font": ("Roboto-Regular.ttf", f, "font/ttf")},
            data={"fallback": "Arial", "strategy": "width"},
        )
    assert res.status_code == 200
    data = res.json()
    assert "selected_fallback" in data
    assert data["selected_fallback"]["fallback_font_name"] == "Arial"
    assert "ascent-override" in data["selected_fallback"]["css_rule"]


def test_api_subset_font():
    with open(SAMPLE_ROBOTO, "rb") as f:
        res = client.post(
            "/api/subset-font",
            files={"font": ("Roboto-Regular.ttf", f, "font/ttf")},
            data={"text": "Hello World", "flavor": "woff2", "strip_hinting": "true"},
        )
    assert res.status_code == 200
    data = res.json()
    assert data["flavor"] == "woff2"
    assert data["subset_size_bytes"] < data["original_size_bytes"]
    assert "data:font/woff2;base64," in data["data_uri"]
