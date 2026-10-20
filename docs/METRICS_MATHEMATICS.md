# Font Metric Mathematics and Zero Layout Shift

When a browser renders a fallback font before a custom web font finishes downloading, Cumulative Layout Shift (CLS) occurs. This happens because the fallback font and the web font have different coordinate systems, units per em, vertical bounding boxes, and glyph advance widths.

CSS Fonts Module Level 4 introduces four metric override properties inside `@font-face`:
- `size-adjust`
- `ascent-override`
- `descent-override`
- `line-gap-override`

This document details the exact mathematical formulas FontLens uses to compute these overrides.

## 1. Units per em and Coordinate Systems

TrueType and OpenType fonts define their glyph vectors on a design grid known as Units Per Em (UPM). Common values are 1000, 1024, or 2048 units.

Let:
- $UPM_{web}$ be the units per em of the target web font.
- $UPM_{fallback}$ be the units per em of the system fallback font (for example, Arial uses 2048).

Because fonts have different UPM values, all internal font table metrics must be normalized to a unitless ratio relative to their respective UPM:

$$R_{metric} = \frac{Metric}{UPM}$$

## 2. Horizontal Advance Width and size-adjust

The primary source of layout shift in multi-line paragraphs is horizontal wrapping. If fallback glyphs are wider or narrower than web font glyphs, words wrap onto different lines, causing tall layout shifts.

To align paragraph line wrapping, FontLens computes the average character width ratio:

$$W_{web} = \frac{AvgCharWidth_{web}}{UPM_{web}}$$
$$W_{fallback} = \frac{AvgCharWidth_{fallback}}{UPM_{fallback}}$$

The required scale factor $S$ is:

$$S = \frac{W_{web}}{W_{fallback}}$$

In CSS `@font-face`, `size-adjust` is declared as a percentage:

$$\text{size-adjust} = S \times 100\%$$

When `size-adjust` is applied, the browser scales all glyph coordinates and default metrics of the fallback font by factor $S$.

## 3. Vertical Metric Overrides

Because `size-adjust` scales the fallback font by $S$, any vertical overrides applied alongside it must account for this divisor. In the browser layout engine, the effective ascent of the fallback font with overrides becomes:

$$\text{EffectiveAscent} = \text{font-size} \times S \times \text{ascent-override}$$

To make $\text{EffectiveAscent}$ match the web font:

$$\text{font-size} \times S \times \text{ascent-override} = \text{font-size} \times \left(\frac{Ascent_{web}}{UPM_{web}}\right)$$

Dividing both sides by $\text{font-size} \times S$ yields:

$$\text{ascent-override} = \frac{Ascent_{web} / UPM_{web}}{S} \times 100\%$$

Following the same derivation for descent and line gap:

$$\text{descent-override} = \frac{|Descent_{web}| / UPM_{web}}{S} \times 100\%$$

$$\text{line-gap-override} = \frac{LineGap_{web} / UPM_{web}}{S} \times 100\%$$

## 4. OpenType Metric Table Selection

OpenType fonts store vertical metrics across three distinct tables:
1. `OS/2.sTypoAscender`, `OS/2.sTypoDescender`, `OS/2.sTypoLineGap` (Typographic metrics)
2. `OS/2.usWinAscent`, `OS/2.usWinDescent` (Windows clipping metrics)
3. `hhea.ascent`, `hhea.descent`, `hhea.lineGap` (Mac / Cross-platform metrics)

Modern browser layout engines follow the OpenType specification regarding bit 7 of `OS/2.fsSelection` (`USE_TYPO_METRICS`):
- If bit 7 is set to 1: the browser uses the `OS/2` typographic values.
- If bit 7 is 0: Chromium, WebKit, and Gecko prioritize the `hhea` values.

FontLens inspects `OS/2.fsSelection` to identify whether `USE_TYPO_METRICS` is active, ensuring the computed values correspond to what the browser will actually execute.

## 5. Resulting CSS Output

Applying these calculations creates a paired font declaration:

```css
@font-face {
  font-family: 'Inter-Fallback';
  src: local('Arial');
  ascent-override: 90.25%;
  descent-override: 22.48%;
  line-gap-override: 0.00%;
  size-adjust: 107.40%;
}

:root {
  --font-primary: 'Inter', 'Inter-Fallback', sans-serif;
}
```

When the browser parses this stylesheet, it reserves the exact vertical and horizontal space required by `Inter`. When the `.woff2` file arrives over the network and swaps, the text box dimensions remain unchanged.
