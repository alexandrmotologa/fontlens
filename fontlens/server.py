"""FastAPI backend providing REST endpoints and serving the Visual Font Studio."""

from __future__ import annotations

import base64
import io
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from fontlens import __version__
from fontlens.analyzer import FontAnalyzer
from fontlens.fallbacks import get_fallback_registry
from fontlens.harvester import CodebaseHarvester
from fontlens.metrics import calculate_metric_overrides, extract_font_metrics
from fontlens.subsetter import FontSubsetter, SubsetConfig


app = FastAPI(
    title="FontLens API",
    description="Web Font Bloat Optimizer, Glyph Subset Synthesizer & Zero-CLS Metric Overrides",
    version=__version__,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextScanRequest(BaseModel):
    text: str
    presets: Optional[List[str]] = None


@app.get("/api/health")
def api_health() -> dict:
    return {"status": "ok", "version": __version__, "service": "FontLens"}


@app.get("/api/system-fonts")
def api_system_fonts() -> dict:
    registry = get_fallback_registry()
    fonts = registry.list_all()
    return {"fonts": [f.to_dict() for f in fonts]}


@app.post("/api/scan-text")
def api_scan_text(req: TextScanRequest) -> dict:
    harvester = CodebaseHarvester(include_presets=req.presets)
    result = harvester.harvest_text(req.text)
    return result.to_dict()


@app.post("/api/scan-files")
async def api_scan_files(files: List[UploadFile] = File(...)) -> dict:
    harvester = CodebaseHarvester()
    total_text = []
    scanned_names = []

    for f in files:
        content = await f.read()
        try:
            text = content.decode("utf-8", errors="ignore")
            total_text.append(text)
            scanned_names.append(f.filename or "unknown")
        except Exception:
            pass

    joined = "\n".join(total_text)
    result = harvester.harvest_text(joined, source_name=f"{len(files)} uploaded files")
    result.scanned_files_count = len(scanned_names)
    result.scanned_files = scanned_names
    return result.to_dict()


@app.post("/api/analyze-font")
async def api_analyze_font(font: UploadFile = File(...)) -> dict:
    font_bytes = await font.read()
    if not font_bytes:
        raise HTTPException(status_code=400, detail="Empty font file uploaded")

    try:
        analyzer = FontAnalyzer(font_bytes)
        meta = analyzer.get_metadata()
        glyphs = analyzer.list_glyphs(limit=300)
        return {
            "metadata": meta.to_dict(),
            "glyphs": [g.to_dict() for g in glyphs],
            "file_size_bytes": len(font_bytes),
            "file_size_kb": round(len(font_bytes) / 1024, 2),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse font: {str(e)}")


@app.post("/api/calculate-metrics")
async def api_calculate_metrics(
    font: UploadFile = File(...),
    fallback: str = Form("Arial"),
    strategy: str = Form("width"),
) -> dict:
    font_bytes = await font.read()
    if not font_bytes:
        raise HTTPException(status_code=400, detail="Empty font file uploaded")

    try:
        web_metrics = extract_font_metrics(font_bytes)
        registry = get_fallback_registry()

        # Calculate for selected fallback
        primary_override = calculate_metric_overrides(
            web_metrics, fallback=fallback, preferred_strategy=strategy
        )

        # Calculate comparison for all system fallbacks
        all_overrides = []
        for fb in registry.list_all():
            ov = calculate_metric_overrides(
                web_metrics, fallback=fb, preferred_strategy=strategy
            )
            all_overrides.append(ov.to_dict())

        return {
            "web_font_metrics": web_metrics.to_dict(),
            "selected_fallback": primary_override.to_dict(),
            "all_fallbacks": all_overrides,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Metric calculation failed: {str(e)}")


@app.post("/api/subset-font")
async def api_subset_font(
    font: UploadFile = File(...),
    text: Optional[str] = Form(None),
    flavor: str = Form("woff2"),
    strip_hinting: bool = Form(False),
    axes_clamp: Optional[str] = Form(None),
) -> dict:
    font_bytes = await font.read()
    if not font_bytes:
        raise HTTPException(status_code=400, detail="Empty font file uploaded")

    try:
        clamps = {}
        if axes_clamp:
            for item in axes_clamp.split(","):
                parts = item.split(":")
                if len(parts) == 2:
                    clamps[parts[0]] = float(parts[1])
                elif len(parts) == 3:
                    clamps[parts[0]] = (float(parts[1]), float(parts[2]))

        config = SubsetConfig(
            text=text,
            flavor=flavor,
            strip_hinting=strip_hinting,
            variable_axes_clamp=clamps or None,
        )

        subsetter = FontSubsetter(font_bytes)
        result = subsetter.subset(config)

        # Encode output as base64 data URI for instant web preview / download
        b64_data = base64.b64encode(result.output_bytes).decode("ascii")
        mime = "font/woff2" if flavor == "woff2" else ("font/woff" if flavor == "woff" else "font/ttf")
        data_uri = f"data:{mime};base64,{b64_data}"

        res_dict = result.to_dict()
        res_dict["data_uri"] = data_uri
        res_dict["filename"] = f"{Path(font.filename or 'font').stem}.subset.{flavor}"
        return res_dict
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Subsetting failed: {str(e)}")


@app.post("/api/glyph-svg")
async def api_glyph_svg(
    font: UploadFile = File(...),
    char: str = Form("A"),
) -> dict:
    font_bytes = await font.read()
    try:
        analyzer = FontAnalyzer(font_bytes)
        svg_info = analyzer.render_glyph_svg(char)
        if not svg_info:
            raise HTTPException(status_code=404, detail=f"Glyph '{char}' not found in font")
        return svg_info
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SVG generation failed: {str(e)}")


# Serve sample fonts
SAMPLES_DIR = Path(__file__).resolve().parent.parent / "samples"
if SAMPLES_DIR.exists():
    app.mount("/samples", StaticFiles(directory=SAMPLES_DIR), name="samples")

# Serve static web studio if built
STATIC_DIR = Path(__file__).resolve().parent.parent / "web" / "dist"
if STATIC_DIR.exists() and (STATIC_DIR / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        target = STATIC_DIR / full_path
        if target.exists() and target.is_file():
            return FileResponse(target)
        return FileResponse(STATIC_DIR / "index.html")


def run_server(host: str = "127.0.0.1", port: int = 8000) -> None:
    import uvicorn
    uvicorn.run("fontlens.server:app", host=host, port=port, reload=False)
