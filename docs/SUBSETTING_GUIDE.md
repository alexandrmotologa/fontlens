# Web Font Subsetting and OpenType Table Pruning

Standard commercial and open source fonts often bundle thousands of glyphs and legacy metadata tables that modern browsers do not need. A typical variable font file can range from 300 KB to 2 MB. By removing unreferenced glyphs and pruning obsolete OpenType tables, FontLens reduces file weight by 85% to 95%.

## OpenType Tables Evaluated for Web Deployment

### 1. Essential Tables (Retained)

| Table | Purpose |
| :--- | :--- |
| `cmap` | Character code to glyph index mapping. |
| `head` | Global font header containing UPM and bounding boxes. |
| `hhea` | Horizontal layout header containing ascent and descent metrics. |
| `hmtx` | Horizontal advance widths and left side bearings. |
| `maxp` | Memory allocation requirements for rasterization. |
| `name` | Family and style identification strings. |
| `OS/2` | Core Windows and typographic metric records. |
| `post` | PostScript metrics and fixed-pitch indicators. |
| `glyf` / `loca` | TrueType outline geometries and location index. |
| `CFF ` / `CFF2` | Compact Font Format Bezier curves (for OTF fonts). |
| `fvar`, `gvar`, `HVAR` | Variable font axis definitions and glyph deltas. |
| `GPOS`, `GSUB` | Kerning pairs, accents, and contextual ligatures. |

### 2. Obsolete Tables (Pruned by Default)

| Table | Reason for Pruning |
| :--- | :--- |
| `gasp` | Grid-fitting hints designed for low-resolution CRT monitors. |
| `VDMX` | Precalculated vertical device metrics for 1990s Windows rasterizers. |
| `LTSH` | Linear threshold metrics for PCL printers. |
| `hdmx` | Horizontal device metrics table for legacy screen resolutions. |
| `DSIG` | Digital signatures. Ignored and rejected by modern web security parsers. |
| `vhea`, `vmtx` | Vertical writing metrics. Unnecessary for horizontal Latin text. |
| `PCLT` | Hewlett-Packard LaserJet printer table. |

## Subsetting Variable Fonts

Variable fonts contain an `fvar` table defining multi-dimensional design axes such as weight (`wght`), width (`wdth`), and optical size (`opsz`).

When subsetting variable fonts:
1. FontLens extracts the exact glyph set requested from the codebase scan.
2. It preserves the delta variation records (`gvar`, `HVAR`, `MVAR`) for all retained glyphs.
3. If an axis range is specified (such as clamping weight to 400 to 700), FontLens uses `fontTools.varLib.instancer` to slice the variation space, eliminating delta data outside that range.

## Compression Format

FontLens outputs standard `.woff2` files compressed using Brotli at quality level 11. Brotli uses dictionary matching tailored for TrueType and OpenType byte streams, producing files 25% smaller than legacy gzip `.woff` files.
