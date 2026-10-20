"""Refined Procedural SVG Generator for FontLens Official Logo & Brand Mascot.
Follows developer-branding design skill:
- Luxury White Squircle Container (1024x1024, rx=220)
- Massive Hexagonal Architectural Gateway Frame
- 85% Mass Optical Raptor / Peregrine Falcon Mascot (Origami Low-Poly)
- Athletic V-taper aerodynamic silhouette: Widest at shoulders, tapering inward
  to folded primary flight feathers and sharp tail keel.
- Highly legible predator eyes & prominent hooked raptor beak at 130px header scale.
- Volumetric origami facet shading (Titanium Slate, Deep Obsidian, Electric Cyan).
"""

from pathlib import Path


def generate_svg() -> str:
    # Color palette
    c_void = "#06080e"
    c_obsidian = "#0a0e17"
    c_deep = "#0f172a"
    c_shadow = "#1e293b"
    c_mid = "#334155"
    c_slate = "#475569"
    c_steel = "#64748b"
    c_silver = "#94a3b8"
    c_pale = "#cbd5e1"
    c_white = "#ffffff"

    c_cyan = "#00f5ff"
    c_cyan_bright = "#38bdf8"
    c_cyan_deep = "#0284c7"
    c_amber = "#f59e0b"

    # Athletic V-tapered silhouette
    silhouette = (
        "M 0,-285 "
        "L 50,-270 L 95,-240 L 75,-190 "   # Head & ear tuft/nape
        "L 160,-140 L 250,-65 L 260,10 "   # Massive broad shoulder cape
        "L 230,85 L 240,95 L 195,175 "     # Primary wing step 1
        "L 200,185 L 150,255 L 125,260 "   # Primary wing step 2
        "L 70,295 L 40,345 L 0,360 "       # Wingtips & sharp tail keel
        "L -40,345 L -70,295 L -125,260 "  # Left mirror
        "L -150,255 L -200,185 L -195,175 "
        "L -240,95 L -230,85 L -260,10 "
        "L -250,-65 L -160,-140 L -75,-190 "
        "L -95,-240 L -50,-270 Z"
    )

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <clipPath id="squircle-clip">
      <rect x="24" y="24" width="976" height="976" rx="220" />
    </clipPath>

    <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c_cyan}"/>
      <stop offset="100%" stop-color="{c_cyan_deep}"/>
    </linearGradient>

    <linearGradient id="eye-glow-left" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c_cyan_bright}"/>
      <stop offset="50%" stop-color="{c_cyan}"/>
      <stop offset="100%" stop-color="{c_cyan_deep}"/>
    </linearGradient>

    <linearGradient id="eye-glow-right" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{c_cyan_bright}"/>
      <stop offset="50%" stop-color="{c_cyan}"/>
      <stop offset="100%" stop-color="{c_cyan_deep}"/>
    </linearGradient>

    <linearGradient id="beak-cyan" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{c_cyan_bright}"/>
      <stop offset="40%" stop-color="{c_cyan}"/>
      <stop offset="100%" stop-color="{c_cyan_deep}"/>
    </linearGradient>

    <filter id="subtle-shadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="22" flood-color="#000000" flood-opacity="0.16" />
    </filter>
  </defs>

  <!-- Luxury White Squircle Container -->
  <rect x="24" y="24" width="976" height="976" rx="220" fill="#ffffff" stroke="#e2e8f0" stroke-width="6" />

  <g clip-path="url(#squircle-clip)">
    <g transform="translate(512, 512)" filter="url(#subtle-shadow)">

      <!-- Massive Hexagonal Architectural Gateway Frame -->
      <polygon points="
        0,-395
        342,-197
        342,197
        0,395
        -342,197
        -342,-197
      " fill="none" stroke="{c_deep}" stroke-width="40" stroke-linejoin="round" />

      <!-- Inner Precision Accent: Dashed Cyan Gateway -->
      <polygon points="
        0,-360
        312,-180
        312,180
        0,360
        -312,180
        -312,-180
      " fill="none" stroke="{c_cyan}" stroke-width="4" opacity="0.4" stroke-dasharray="16, 12" />

      <!-- Precision Optical Calibration Reticles -->
      <line x1="0" y1="-380" x2="0" y2="-340" stroke="{c_cyan}" stroke-width="3" opacity="0.7" />
      <line x1="0" y1="340" x2="0" y2="380" stroke="{c_cyan}" stroke-width="3" opacity="0.7" />
      <line x1="-330" y1="0" x2="-290" y2="0" stroke="{c_cyan}" stroke-width="3" opacity="0.7" />
      <line x1="290" y1="0" x2="330" y2="0" stroke="{c_cyan}" stroke-width="3" opacity="0.7" />

      <!-- 100% Watertight Solid Base Silhouette (Prevents white backdrop vertex leaks) -->
      <path d="{silhouette}" fill="{c_void}" />

      <!-- ==================== ORIGAMI LOW-POLY MESH ==================== -->

      <!-- Section A: Proud Raptor Crown & Crest -->
      <!-- Center Crown Apex -->
      <polygon points="0,-285 -50,-270 0,-235" fill="{c_slate}" />
      <polygon points="0,-285 50,-270 0,-235" fill="{c_mid}" />

      <!-- Lateral Crown Wings -->
      <polygon points="-50,-270 -95,-240 -45,-200 0,-235" fill="{c_steel}" />
      <polygon points="-95,-240 -75,-190 -45,-200" fill="{c_mid}" />

      <polygon points="50,-270 95,-240 45,-200 0,-235" fill="{c_shadow}" />
      <polygon points="95,-240 75,-190 45,-200" fill="{c_deep}" />

      <!-- Forehead Keel & Optical Prism Diamond -->
      <polygon points="0,-235 -45,-200 0,-160" fill="{c_silver}" />
      <polygon points="0,-235 45,-200 0,-160" fill="{c_shadow}" />

      <!-- Precision Metric Sensor (Cyan Prism) -->
      <polygon points="0,-205 -14,-185 0,-160 14,-185" fill="{c_cyan}" opacity="0.95" />
      <polygon points="0,-205 14,-185 0,-160" fill="{c_cyan_deep}" opacity="0.9" />

      <!-- Section B: Intense Predator Brow & Almond Optical Eyes -->
      <!-- Left Brow Ridge -->
      <polygon points="0,-160 -45,-200 -95,-165 -55,-135" fill="{c_pale}" />
      <polygon points="0,-160 -55,-135 -24,-125 0,-130" fill="{c_silver}" />

      <!-- Right Brow Ridge -->
      <polygon points="0,-160 45,-200 95,-165 55,-135" fill="{c_shadow}" />
      <polygon points="0,-160 55,-135 24,-125 0,-130" fill="{c_deep}" />

      <!-- Left Eye Socket & Almond Optic -->
      <polygon points="-24,-125 -55,-135 -92,-120 -48,-110" fill="{c_void}" />
      <polygon points="-28,-123 -54,-132 -86,-120 -48,-113" fill="url(#eye-glow-left)" />
      <!-- Left Pupil & Specular Spec -->
      <polygon points="-46,-127 -60,-122 -49,-116" fill="{c_deep}" />
      <polygon points="-42,-126 -46,-123 -40,-121" fill="{c_white}" />

      <!-- Right Eye Socket & Almond Optic -->
      <polygon points="24,-125 55,-135 92,-120 48,-110" fill="{c_void}" />
      <polygon points="28,-123 54,-132 86,-120 48,-113" fill="url(#eye-glow-right)" />
      <!-- Right Pupil & Specular Spec -->
      <polygon points="46,-127 60,-122 49,-116" fill="{c_deep}" />
      <polygon points="42,-126 46,-123 40,-121" fill="{c_white}" />

      <!-- Section C: Hooked Raptor Beak (Anatomical Curvature) -->
      <!-- Culmen Base -->
      <polygon points="0,-130 -24,-125 -18,-75 0,-80" fill="{c_silver}" />
      <polygon points="0,-130 24,-125 18,-75 0,-80" fill="{c_slate}" />

      <!-- Mid Beak Body -->
      <polygon points="0,-80 -18,-75 0,-20" fill="{c_steel}" />
      <polygon points="0,-80 18,-75 0,-20" fill="{c_mid}" />

      <!-- Hooked Downward Hook Tip (Electric Cyan Precision Apex) -->
      <polygon points="0,-20 -18,-35 -6,38 0,44" fill="url(#beak-cyan)" />
      <polygon points="0,-20 18,-35 6,38 0,44" fill="{c_cyan_deep}" />

      <!-- Under-beak Tomium -->
      <polygon points="0,44 -6,38 0,18 6,38" fill="{c_void}" />
      <polygon points="0,18 -18,-35 -30,-45 0,-40" fill="{c_deep}" />
      <polygon points="0,18 18,-35 30,-45 0,-40" fill="{c_obsidian}" />

      <!-- Section D: Cheeks, Malar Tear Mask & Gorget -->
      <!-- Left Malar Stripe -->
      <polygon points="-48,-110 -92,-120 -75,-190 -120,-130" fill="{c_obsidian}" />
      <polygon points="-48,-110 -120,-130 -95,-60 -40,-75" fill="{c_void}" />
      <!-- Left Cheek Plumage Contrast (Titanium Silver) -->
      <polygon points="-120,-130 -160,-140 -140,-60 -95,-60" fill="{c_silver}" />
      <polygon points="-95,-60 -140,-60 -110,10 -45,-5" fill="{c_slate}" />

      <!-- Right Malar Stripe (Mirror) -->
      <polygon points="48,-110 92,-120 75,-190 120,-130" fill="{c_void}" />
      <polygon points="48,-110 120,-130 95,-60 40,-75" fill="{c_void}" />
      <!-- Right Cheek Plumage Contrast -->
      <polygon points="120,-130 160,-140 140,-60 95,-60" fill="{c_mid}" />
      <polygon points="95,-60 140,-60 110,10 45,-5" fill="{c_shadow}" />

      <!-- Throat & Gorget -->
      <polygon points="0,18 -28,-40 -40,-75 -45,-5 0,55" fill="{c_mid}" />
      <polygon points="0,18 28,-40 40,-75 45,-5 0,55" fill="{c_deep}" />
      <polygon points="0,18 -30,-5 0,55" fill="{c_steel}" />
      <polygon points="0,18 30,-5 0,55" fill="{c_shadow}" />

      <!-- Section E: Massive Broad Shoulders (Widest point of the falcon) -->
      <!-- Left Shoulder Cape -->
      <polygon points="-160,-140 -250,-65 -190,-40 -140,-60" fill="{c_slate}" />
      <polygon points="-250,-65 -260,10 -200,25 -190,-40" fill="{c_steel}" />
      <polygon points="-190,-40 -200,25 -150,50 -110,10" fill="{c_silver}" />

      <!-- Right Shoulder Cape (Mirror Shadow) -->
      <polygon points="160,-140 250,-65 190,-40 140,-60" fill="{c_deep}" />
      <polygon points="250,-65 260,10 200,25 190,-40" fill="{c_shadow}" />
      <polygon points="190,-40 200,25 150,50 110,10" fill="{c_mid}" />

      <!-- Section F: Folded Primary Wings (Tapering inward sharply) -->
      <!-- Left Wing - Tier 1 -->
      <polygon points="-260,10 -230,85 -180,70 -200,25" fill="{c_shadow}" />
      <polygon points="-200,25 -180,70 -130,90 -150,50" fill="{c_slate}" />

      <!-- Left Wing - Tier 2 (Stepped notch at -240, 95) -->
      <polygon points="-230,85 -240,95 -195,175 -155,150 -180,70" fill="{c_deep}" />
      <polygon points="-180,70 -155,150 -105,160 -130,90" fill="{c_mid}" />

      <!-- Left Wing - Tier 3 (Primary Flight Wingtip) -->
      <polygon points="-195,175 -200,185 -150,255 -115,225 -155,150" fill="{c_obsidian}" />
      <polygon points="-155,150 -115,225 -80,220 -105,160" fill="{c_shadow}" />
      <polygon points="-150,255 -125,260 -70,295 -95,245 -115,225" fill="{c_void}" />

      <!-- Right Wing - Tier 1 (Mirror Deep Shadow) -->
      <polygon points="260,10 230,85 180,70 200,25" fill="{c_deep}" />
      <polygon points="200,25 180,70 130,90 150,50" fill="{c_shadow}" />

      <!-- Right Wing - Tier 2 -->
      <polygon points="230,85 240,95 195,175 155,150 180,70" fill="{c_obsidian}" />
      <polygon points="180,70 155,150 105,160 130,90" fill="{c_deep}" />

      <!-- Right Wing - Tier 3 (Primary Flight Wingtip) -->
      <polygon points="195,175 200,185 150,255 115,225 155,150" fill="{c_void}" />
      <polygon points="155,150 115,225 80,220 105,160" fill="{c_obsidian}" />
      <polygon points="150,255 125,260 70,295 95,245 115,225" fill="{c_void}" />

      <!-- Section G: Athletic Tapered Chest & Keel -->
      <!-- Central Pectoral Keel -->
      <polygon points="0,55 -65,90 0,155" fill="{c_steel}" />
      <polygon points="0,55 65,90 0,155" fill="{c_shadow}" />
      <polygon points="0,55 -30,105 0,155" fill="{c_silver}" />
      <polygon points="0,55 30,105 0,155" fill="{c_mid}" />

      <!-- Flanking Pectoral Plates -->
      <polygon points="0,55 -45,-5 -110,10 -65,90" fill="{c_slate}" />
      <polygon points="0,55 45,-5 110,10 65,90" fill="{c_deep}" />

      <polygon points="-65,90 -110,10 -150,50 -130,90 -95,115" fill="{c_mid}" />
      <polygon points="65,90 110,10 150,50 130,90 95,115" fill="{c_deep}" />

      <!-- Lower Torso & Abdominal Taper -->
      <polygon points="0,155 -65,90 -95,115 -50,180 0,205" fill="{c_shadow}" />
      <polygon points="0,155 65,90 95,115 50,180 0,205" fill="{c_deep}" />
      <polygon points="0,155 -25,175 0,205" fill="{c_slate}" />
      <polygon points="0,155 25,175 0,205" fill="{c_shadow}" />

      <polygon points="-95,115 -130,90 -105,160 -50,180" fill="{c_deep}" />
      <polygon points="95,115 130,90 105,160 50,180" fill="{c_obsidian}" />

      <!-- Section H: Tail Wedge & Aerodynamic Keel -->
      <!-- Center Tail Keel -->
      <polygon points="0,205 -50,180 -80,220 -35,285 0,310" fill="{c_shadow}" />
      <polygon points="0,205 50,180 80,220 35,285 0,310" fill="{c_deep}" />
      <polygon points="0,205 -20,255 0,310" fill="{c_mid}" />
      <polygon points="0,205 20,255 0,310" fill="{c_shadow}" />

      <!-- Lower Tail Feathers Point -->
      <polygon points="0,310 -35,285 -40,345 0,360" fill="{c_shadow}" />
      <polygon points="0,310 35,285 40,345 0,360" fill="{c_deep}" />
      <polygon points="-35,285 -70,295 -40,345" fill="{c_obsidian}" />
      <polygon points="35,285 70,295 40,345" fill="{c_void}" />

      <!-- Section I: Technical Zero-CLS Metric Overrides Horizon Laser -->
      <line x1="-190" y1="20" x2="-80" y2="20" stroke="{c_cyan}" stroke-width="2.5" opacity="0.65" stroke-dasharray="8, 6" />
      <line x1="80" y1="20" x2="190" y2="20" stroke="{c_cyan}" stroke-width="2.5" opacity="0.65" stroke-dasharray="8, 6" />
      <circle cx="-190" cy="20" r="3.5" fill="{c_cyan}" opacity="0.9" />
      <circle cx="190" cy="20" r="3.5" fill="{c_cyan}" opacity="0.9" />

    </g>
  </g>
</svg>"""
    return svg


def main():
    svg_str = generate_svg()
    out_dir = Path("B:/workgit/fontlens/docs/images")
    out_dir.mkdir(parents=True, exist_ok=True)

    svg_path = out_dir / "logo.svg"
    svg_path.write_text(svg_str, encoding="utf-8")
    print(f"Generated {svg_path} ({len(svg_str)} bytes)")


if __name__ == "__main__":
    main()
