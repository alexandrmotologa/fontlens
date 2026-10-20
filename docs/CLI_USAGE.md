# FontLens CLI Reference

FontLens provides a command-line interface for terminal workflows, automated build scripts, and CI/CD pipelines.

## Installation

```bash
pip install fontlens
```

Verify installation:

```bash
fontlens --version
```

## Commands

### 1. Harvest Codebase Glyphs

Scans source code directories to collect unique Unicode characters and output a formatted CSS `unicode-range`.

```bash
# Scan a frontend project directory
fontlens harvest src/ public/ -o dist/used-glyphs.txt

# Output structured JSON for automation
fontlens harvest src/ --json
```

Supported file extensions include `.html`, `.jsx`, `.tsx`, `.vue`, `.svelte`, `.astro`, `.md`, `.json`, and `.py`.

### 2. Synthesize WOFF2 Subset

Subsets a font using harvested characters or explicit strings, drops unneeded tables, and outputs a compressed `.woff2` file.

```bash
# Subset using direct text
fontlens subset Inter.ttf --text "Hello World 123" -o Inter.subset.woff2

# Subset using a scanned codebase
fontlens subset Roboto.ttf --scan ./src/ -o dist/fonts/Roboto.subset.woff2

# Strip hinting bytecode for smaller size
fontlens subset Inter.ttf --scan ./src/ --no-hinting

# Clamp variable font weight axis to 400-700
fontlens subset Inter-Variable.ttf --scan ./src/ --clamp "wght:400:700"
```

### 3. Calculate Zero-CLS Metric Overrides

Computes exact `@font-face` metric overrides for system fallback fonts to eliminate layout shift.

```bash
# Calculate overrides against Arial
fontlens metrics Roboto.ttf --fallback Arial

# Show comparisons across all standard system fonts
fontlens metrics Inter.ttf --all-fallbacks

# Print CSS directly for piping into stylesheets
fontlens metrics Inter.ttf --fallback "Segoe UI" --css
```

### 4. Analyze Font Metadata

Inspects OpenType tables, variable axes, units per em, and glyph counts.

```bash
fontlens analyze Inter-Variable.ttf

# Output JSON
fontlens analyze Roboto.ttf --json
```

### 5. Launch Visual Studio Web UI

Starts the interactive web studio on a local server.

```bash
# Default binding (http://127.0.0.1:8000)
fontlens studio

# Custom port and host
fontlens studio --host 0.0.0.0 --port 3000
```
