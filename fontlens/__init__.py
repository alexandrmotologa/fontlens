"""FontLens: Web Font Bloat Optimizer, Glyph Subset Synthesizer, and Zero-CLS Metric Overrides Generator."""

__version__ = "0.1.0"
__author__ = "Alexandr Motologa"
__license__ = "MIT"

from fontlens.analyzer import FontAnalyzer, FontMetadata
from fontlens.fallbacks import FallbackFont, FallbackRegistry, get_fallback_registry
from fontlens.harvester import CodebaseHarvester, HarvestResult
from fontlens.metrics import (
    FontMetrics,
    MetricOverrides,
    MultiPlatformOverrides,
    calculate_metric_overrides,
    calculate_multiplatform_overrides,
)
from fontlens.subsetter import FontSubsetter, SubsetConfig, SubsetResult

__all__ = [
    "CodebaseHarvester",
    "FallbackFont",
    "FallbackRegistry",
    "FontAnalyzer",
    "FontMetadata",
    "FontMetrics",
    "FontSubsetter",
    "HarvestResult",
    "MetricOverrides",
    "MultiPlatformOverrides",
    "SubsetConfig",
    "SubsetResult",
    "calculate_metric_overrides",
    "calculate_multiplatform_overrides",
    "get_fallback_registry",
]
