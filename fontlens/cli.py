"""FontLens command line interface with Rich terminal UI."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import List, Optional

# Ensure standard output supports UTF-8 on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from fontlens import __version__
from fontlens.analyzer import FontAnalyzer
from fontlens.fallbacks import get_fallback_registry
from fontlens.harvester import CodebaseHarvester
from fontlens.metrics import calculate_metric_overrides, extract_font_metrics
from fontlens.subsetter import FontSubsetter, SubsetConfig


console = Console()


def print_banner() -> None:
    banner = (
        f"[bold cyan]FontLens[/bold cyan] [dim]v{__version__}[/dim]\n"
        "[dim]Web Font Bloat Optimizer, Glyph Subset Synthesizer & Zero-CLS Metric Overrides[/dim]"
    )
    console.print(Panel(banner, border_style="cyan"))


def cmd_harvest(args: argparse.Namespace) -> None:
    """Harvest glyphs from files or directories."""
    harvester = CodebaseHarvester()
    with console.status("[bold green]Harvesting glyphs from codebase..."):
        result = harvester.harvest_files(args.paths)

    if args.json:
        print(json.dumps(result.to_dict(), indent=2))
        return

    print_banner()
    console.print(f"[bold]Scanned files:[/bold] {result.scanned_files_count}")
    console.print(f"[bold]Total characters scanned:[/bold] {result.total_characters:,}")
    console.print(f"[bold green]Unique glyphs extracted:[/bold green] {result.unique_count:,}\n")

    # Display Unicode blocks table
    table = Table(title="Unicode Blocks Distribution", border_style="dim")
    table.add_column("Block", style="cyan")
    table.add_column("Glyphs", justify="right")
    table.add_column("Coverage %", justify="right")
    table.add_column("Sample", style="dim")

    for block in result.blocks[:8]:
        sample = block.characters[:18] + ("..." if len(block.characters) > 18 else "")
        table.add_row(block.name, str(block.count), f"{block.percentage:.1f}%", sample)

    console.print(table)
    console.print("\n[bold yellow]CSS unicode-range:[/bold yellow]")
    console.print(f"[dim]{result.css_unicode_range}[/dim]\n")

    if args.output:
        out_p = Path(args.output)
        out_p.write_text(result.unique_glyphs, encoding="utf-8")
        console.print(f"[bold green]Saved {result.unique_count} glyphs to {out_p}[/bold green]")


def cmd_subset(args: argparse.Namespace) -> None:
    """Subset and compress a font file to WOFF2."""
    font_path = Path(args.font)
    if not font_path.exists():
        console.print(f"[bold red]Error:[/bold red] Font file not found: {font_path}")
        sys.exit(1)

    print_banner()

    # Determine glyphs
    text_to_keep: Optional[str] = None
    if args.scan:
        with console.status(f"[bold green]Harvesting glyphs from {args.scan}..."):
            harvest = CodebaseHarvester().harvest_files([args.scan])
            text_to_keep = harvest.unique_glyphs
            console.print(f"[dim]Harvested {harvest.unique_count} unique glyphs from scanned files.[/dim]")
    elif args.glyphs_file:
        text_to_keep = Path(args.glyphs_file).read_text(encoding="utf-8")
    elif args.text:
        text_to_keep = args.text
    else:
        # Default ASCII printable
        text_to_keep = "".join(chr(i) for i in range(32, 127))

    # Parse variable axis clamps if any, e.g. wght:400:700 or wght:600
    axis_clamps = {}
    if args.clamp:
        for item in args.clamp.split(","):
            parts = item.split(":")
            if len(parts) == 2:
                axis_clamps[parts[0]] = float(parts[1])
            elif len(parts) == 3:
                axis_clamps[parts[0]] = (float(parts[1]), float(parts[2]))

    config = SubsetConfig(
        text=text_to_keep,
        flavor=args.flavor,
        strip_hinting=args.no_hinting,
        variable_axes_clamp=axis_clamps or None,
    )

    with console.status(f"[bold green]Synthesizing {args.flavor.upper()} subset..."):
        subsetter = FontSubsetter(font_path)
        result = subsetter.subset(config)

    # Determine output path
    if args.output:
        out_path = Path(args.output)
    else:
        out_path = font_path.with_name(f"{font_path.stem}.subset.{args.flavor}")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(result.output_bytes)

    # Summary table
    table = Table(title="Subset Optimization Summary", border_style="cyan")
    table.add_column("Metric", style="bold")
    table.add_column("Original Font", justify="right")
    table.add_column("Optimized Subset", justify="right", style="green")
    table.add_column("Savings", justify="right", style="bold green")

    orig_kb = result.original_size_bytes / 1024
    sub_kb = result.subset_size_bytes / 1024
    saved_kb = orig_kb - sub_kb

    table.add_row(
        "File Size",
        f"{orig_kb:.1f} KB",
        f"{sub_kb:.1f} KB",
        f"-{result.compression_percent:.1f}% ({saved_kb:.1f} KB)",
    )
    table.add_row(
        "Brotli Transfer",
        f"~{orig_kb * 0.7:.1f} KB",
        f"{result.brotli_size_bytes / 1024:.1f} KB",
        f"-{((orig_kb * 0.7 - result.brotli_size_bytes / 1024) / (orig_kb * 0.7) * 100):.1f}%",
    )
    table.add_row(
        "Glyph Count",
        f"{result.original_glyph_count:,}",
        f"{result.retained_glyph_count:,}",
        f"-{((result.original_glyph_count - result.retained_glyph_count) / result.original_glyph_count * 100):.1f}%",
    )
    table.add_row(
        "Dropped Tables",
        "-",
        f"{len(result.dropped_tables)} tables",
        ", ".join(result.dropped_tables[:4]) + ("..." if len(result.dropped_tables) > 4 else ""),
    )

    console.print(table)
    console.print(f"\n[bold green]✓ Saved subset to:[/bold green] {out_path.resolve()}\n")


def cmd_metrics(args: argparse.Namespace) -> None:
    """Calculate Zero-CLS font metric overrides."""
    font_path = Path(args.font)
    if not font_path.exists():
        console.print(f"[bold red]Error:[/bold red] Font file not found: {font_path}")
        sys.exit(1)

    print_banner()

    web_metrics = extract_font_metrics(str(font_path))
    registry = get_fallback_registry()

    targets = [args.fallback] if args.fallback else (
        [f.name for f in registry.list_all()] if args.all_fallbacks else ["Arial", "Georgia", "Segoe UI", "Roboto"]
    )

    table = Table(
        title=f"Zero-CLS Overrides for {web_metrics.family_name} (UPM: {web_metrics.units_per_em})",
        border_style="green",
    )
    table.add_column("System Fallback", style="bold cyan")
    table.add_column("size-adjust", justify="right")
    table.add_column("ascent-override", justify="right")
    table.add_column("descent-override", justify="right")
    table.add_column("line-gap-override", justify="right")
    table.add_column("Est. CLS Reduction", justify="right", style="green")

    last_override = None
    for name in targets:
        override = calculate_metric_overrides(web_metrics, fallback=name, preferred_strategy=args.strategy)
        last_override = override
        table.add_row(
            override.fallback_font_name,
            f"{override.size_adjust:.2f}%",
            f"{override.ascent_override:.2f}%",
            f"{override.descent_override:.2f}%",
            f"{override.line_gap_override:.2f}%",
            f"~{override.estimated_cls_reduction:.1f}%",
        )

    console.print(table)

    if last_override:
        console.print("\n[bold yellow]Ready-to-use CSS Snippet:[/bold yellow]")
        console.print(Panel(last_override.full_css_snippet, border_style="dim"))


def cmd_analyze(args: argparse.Namespace) -> None:
    """Analyze font tables, metadata, and variable axes."""
    font_path = Path(args.font)
    if not font_path.exists():
        console.print(f"[bold red]Error:[/bold red] Font file not found: {font_path}")
        sys.exit(1)

    analyzer = FontAnalyzer(str(font_path))
    meta = analyzer.get_metadata()

    if args.json:
        print(json.dumps(meta.to_dict(), indent=2))
        return

    print_banner()
    console.print(f"[bold]Family:[/bold] {meta.family}")
    console.print(f"[bold]Subfamily:[/bold] {meta.subfamily}")
    console.print(f"[bold]Version:[/bold] {meta.version}")
    console.print(f"[bold]Units Per Em:[/bold] {meta.units_per_em}")
    console.print(f"[bold]Total Glyphs:[/bold] {meta.glyph_count:,}")
    console.print(f"[bold]Unicode Mapped Characters:[/bold] {meta.supported_unicodes_count:,}")
    console.print(f"[bold]Variable Font:[/bold] {'Yes' if meta.is_variable else 'No'}\n")

    if meta.is_variable and meta.axes:
        table = Table(title="Variable Font Axes", border_style="cyan")
        table.add_column("Tag", style="bold")
        table.add_column("Name")
        table.add_column("Min", justify="right")
        table.add_column("Default", justify="right")
        table.add_column("Max", justify="right")

        for ax in meta.axes:
            table.add_row(ax.tag, ax.name, str(ax.min_value), str(ax.default_value), str(ax.max_value))
        console.print(table)
        console.print("")

    # Tables summary
    table = Table(title=f"OpenType Tables ({len(meta.tables)})", border_style="dim")
    table.add_column("Tag", style="cyan")
    table.add_column("Size (Bytes)", justify="right")
    table.add_column("Safe to Drop for Web?", justify="center")

    from fontlens.subsetter import SAFE_DROP_TABLES
    for t in meta.tables:
        safe = "[yellow]Yes[/yellow]" if t.tag in SAFE_DROP_TABLES else "[dim]Keep[/dim]"
        table.add_row(t.tag, f"{t.length:,}", safe)
    console.print(table)


def cmd_studio(args: argparse.Namespace) -> None:
    """Launch the FontLens Visual Studio web server."""
    from fontlens.server import run_server
    print_banner()
    console.print(f"[bold green]Starting FontLens Visual Studio on http://{args.host}:{args.port}[/bold green]")
    run_server(host=args.host, port=args.port)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="fontlens",
        description="Web Font Bloat Optimizer, Glyph Subset Synthesizer & Zero-CLS Metric Overrides",
    )
    parser.add_argument("--version", action="version", version=f"fontlens {__version__}")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # harvest
    p_harvest = subparsers.add_parser("harvest", help="Scan code files to harvest used glyphs")
    p_harvest.add_argument("paths", nargs="+", help="Files or directories to scan")
    p_harvest.add_argument("-o", "--output", help="Save harvested unique glyphs to file")
    p_harvest.add_argument("--json", action="store_true", help="Output JSON format")
    p_harvest.set_defaults(func=cmd_harvest)

    # subset
    p_subset = subparsers.add_parser("subset", help="Synthesize optimized WOFF2 subset")
    p_subset.add_argument("font", help="Path to TTF, OTF, WOFF, or WOFF2 font")
    p_subset.add_argument("-t", "--text", help="Explicit text/characters to retain")
    p_subset.add_argument("-g", "--glyphs-file", help="File containing characters to retain")
    p_subset.add_argument("-s", "--scan", help="Scan directory/files for glyphs")
    p_subset.add_argument("-o", "--output", help="Output file path (defaults to .subset.woff2)")
    p_subset.add_argument("--flavor", choices=["woff2", "woff", "ttf", "otf"], default="woff2")
    p_subset.add_argument("--no-hinting", action="store_true", help="Strip hinting bytecode for smaller size")
    p_subset.add_argument("--clamp", help="Clamp variable axes, e.g. 'wght:400:700' or 'wght:600'")
    p_subset.set_defaults(func=cmd_subset)

    # metrics
    p_metrics = subparsers.add_parser("metrics", help="Calculate Zero-CLS font metric overrides")
    p_metrics.add_argument("font", help="Path to font file")
    p_metrics.add_argument("-f", "--fallback", help="Specific fallback font (e.g. Arial, Georgia, Segoe UI)")
    p_metrics.add_argument("--all-fallbacks", action="store_true", help="Show all supported system fallbacks")
    p_metrics.add_argument("--strategy", choices=["width", "xheight"], default="width", help="size-adjust matching strategy")
    p_metrics.add_argument("--css", action="store_true", help="Print CSS code directly")
    p_metrics.set_defaults(func=cmd_metrics)

    # analyze
    p_analyze = subparsers.add_parser("analyze", help="Introspect font tables, metadata, and variable axes")
    p_analyze.add_argument("font", help="Path to font file")
    p_analyze.add_argument("--json", action="store_true", help="Output JSON format")
    p_analyze.set_defaults(func=cmd_analyze)

    # studio
    p_studio = subparsers.add_parser("studio", help="Launch interactive web studio")
    p_studio.add_argument("--host", default="127.0.0.1", help="Host interface to bind")
    p_studio.add_argument("--port", type=int, default=8000, help="Port to bind")
    p_studio.set_defaults(func=cmd_studio)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
