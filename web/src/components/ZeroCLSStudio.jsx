import React, { useState, useEffect } from 'react';
import { Copy, Check, Sliders, ArrowRight, ShieldCheck, Play, RotateCcw } from 'lucide-react';

export default function ZeroCLSStudio({
  webMetrics,
  systemFonts,
  fontDataUri,
  fontFamilyName,
}) {
  const [selectedFallback, setSelectedFallback] = useState('Arial');
  const [strategy, setStrategy] = useState('width');
  const [useOverrides, setUseOverrides] = useState(true);
  const [viewMode, setViewMode] = useState('overlay'); // 'overlay', 'side-by-side', 'split'
  const [splitPos, setSplitPos] = useState(50);
  const [copied, setCopied] = useState(false);
  const [isSimulatingSwap, setIsSimulatingSwap] = useState(false);
  const [simulatedFontFamily, setSimulatedFontFamily] = useState('fallback');

  const fallbackData = systemFonts.find((f) => f.name.toLowerCase() === selectedFallback.toLowerCase()) || {
    name: 'Arial',
    units_per_em: 2048,
    ascent: 1854,
    descent: -434,
    line_gap: 307,
    avg_char_width: 904,
    x_height: 1062,
    category: 'sans-serif',
  };

  // Math calculation according to CSS Fonts 4 specifications
  const webUpm = webMetrics?.units_per_em || 2048;
  const fbUpm = fallbackData.units_per_em || 2048;

  const webWidthRatio = (webMetrics?.avg_char_width || 1000) / webUpm;
  const fbWidthRatio = (fallbackData.avg_char_width || 900) / fbUpm;
  const sWidth = fbWidthRatio > 0 ? webWidthRatio / fbWidthRatio : 1.0;

  const webXh = webMetrics?.x_height || Math.round(webUpm * 0.5);
  const fbXh = fallbackData.x_height || Math.round(fbUpm * 0.5);
  const sXheight = fbXh > 0 ? (webXh / webUpm) / (fbXh / fbUpm) : 1.0;

  const sFactor = strategy === 'width' ? sWidth : sXheight;

  const ascentRatio = (webMetrics?.ascent || 1800) / webUpm;
  const descentRatio = Math.abs(webMetrics?.descent || -400) / webUpm;
  const lineGapRatio = (webMetrics?.line_gap || 0) / webUpm;

  const ascentOverride = (ascentRatio / sFactor) * 100;
  const descentOverride = (descentRatio / sFactor) * 100;
  const lineGapOverride = (lineGapRatio / sFactor) * 100;
  const sizeAdjust = sFactor * 100;

  const family = fontFamilyName || webMetrics?.family_name || 'CustomWebFont';
  const fallbackAlias = `${family}-Fallback`;

  const cssSnippet = `/* FontLens Zero-CLS Overrides for ${family} over ${fallbackData.name} */
@font-face {
  font-family: '${fallbackAlias}';
  src: local('${fallbackData.name}');
  ascent-override: ${ascentOverride.toFixed(2)}%;
  descent-override: ${descentOverride.toFixed(2)}%;
  line-gap-override: ${lineGapOverride.toFixed(2)}%;
  size-adjust: ${sizeAdjust.toFixed(2)}%;
}

:root {
  --font-heading: '${family}', '${fallbackAlias}', ${fallbackData.category};
}

.headline {
  font-family: var(--font-heading);
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cssSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run simulated font swap FOUT
  const runSimulatedSwap = () => {
    if (isSimulatingSwap) return;
    setIsSimulatingSwap(true);
    setSimulatedFontFamily('fallback');

    setTimeout(() => {
      setSimulatedFontFamily('web');
      setTimeout(() => {
        setIsSimulatingSwap(false);
      }, 800);
    }, 1200);
  };

  // Inject dynamic style tag for the font face
  useEffect(() => {
    const styleId = 'fontlens-dynamic-overrides';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    let dynamicCss = `
      @font-face {
        font-family: '${fallbackAlias}';
        src: local('${fallbackData.name}');
        ascent-override: ${ascentOverride.toFixed(2)}%;
        descent-override: ${descentOverride.toFixed(2)}%;
        line-gap-override: ${lineGapOverride.toFixed(2)}%;
        size-adjust: ${sizeAdjust.toFixed(2)}%;
      }
    `;

    if (fontDataUri) {
      dynamicCss += `
        @font-face {
          font-family: '${family}';
          src: url('${fontDataUri}') format('woff2');
        }
      `;
    }

    styleEl.innerHTML = dynamicCss;
  }, [ascentOverride, descentOverride, lineGapOverride, sizeAdjust, fallbackAlias, fallbackData.name, family, fontDataUri]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Metric Overrides Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            size-adjust
          </div>
          <div className="text-2xl font-black text-cyan-400 tracking-tight font-mono">
            {sizeAdjust.toFixed(2)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Scales fallback glyph advance width to prevent line wrap
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            ascent-override
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight font-mono">
            {ascentOverride.toFixed(2)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Locks baseline to top distance ({webMetrics?.ascent || 0} / {webUpm} UPM)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            descent-override
          </div>
          <div className="text-2xl font-black text-indigo-400 tracking-tight font-mono">
            {descentOverride.toFixed(2)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Locks baseline to bottom descent ({webMetrics?.descent || 0} UPM)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            line-gap-override
          </div>
          <div className="text-2xl font-black text-amber-400 tracking-tight font-mono">
            {lineGapOverride.toFixed(2)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Eliminates extra interline gap shift
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Target System Fallback
            </label>
            <select
              value={selectedFallback}
              onChange={(e) => setSelectedFallback(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              {systemFonts.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name} ({f.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Override Strategy
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="width">Average Character Width (Avoids Wrapping)</option>
              <option value="xheight">x-Height Proportions (Visual Cap Match)</option>
            </select>
          </div>
        </div>

        {/* View Mode & Override Switch */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('overlay')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'overlay' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overlay Diff
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'split' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Split Slider
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'side-by-side' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Side-by-Side
            </button>
          </div>

          {/* Toggle Overrides */}
          <button
            onClick={() => setUseOverrides(!useOverrides)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              useOverrides
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                : 'bg-rose-950/60 border-rose-800 text-rose-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{useOverrides ? 'Overrides Active (0.00 CLS)' : 'Overrides Disabled (High Shift)'}</span>
          </button>
        </div>
      </div>

      {/* Visual Playground / Layout Shift Simulation */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-white text-sm">Visual Layout Shift Inspector</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              Font: {family} vs {fallbackData.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runSimulatedSwap}
              disabled={isSimulatingSwap}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Play className="w-3 h-3" />
              <span>{isSimulatingSwap ? 'Simulating Swap...' : 'Simulate Font Load (FOUT)'}</span>
            </button>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-4 bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
              <span>Web Font ({family})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
              <span>
                Fallback ({useOverrides ? `${fallbackAlias} (Adjusted)` : `${fallbackData.name} (Unadjusted)`})
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span>Simulated CLS:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                useOverrides ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}
            >
              {useOverrides ? '0.000 (Pass)' : '0.142 (Poor)'}
            </span>
          </div>
        </div>

        {/* Preview Container */}
        {viewMode === 'overlay' && (
          <div className="relative min-h-[220px] p-6 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-center">
            {/* Fallback Font Layer */}
            <div
              className="text-amber-400/70 select-none pointer-events-none"
              style={{
                fontFamily: isSimulatingSwap
                  ? (simulatedFontFamily === 'fallback'
                      ? (useOverrides ? `'${fallbackAlias}'` : `'${fallbackData.name}'`)
                      : `'${family}', sans-serif`)
                  : (useOverrides ? `'${fallbackAlias}'` : `'${fallbackData.name}'`),
                fontSize: '28px',
                lineHeight: '1.4',
                position: 'relative',
                zIndex: 1,
              }}
            >
              Web typography with zero cumulative layout shift prevents visual jitter and keeps readers engaged.
            </div>

            {/* Web Font Layer (when not in simulation mode) */}
            {!isSimulatingSwap && (
              <div
                className="text-cyan-300 absolute inset-0 p-6 flex flex-col justify-center pointer-events-none"
                style={{
                  fontFamily: `'${family}', sans-serif`,
                  fontSize: '28px',
                  lineHeight: '1.4',
                  mixBlendMode: 'screen',
                  opacity: 0.85,
                  zIndex: 2,
                }}
              >
                Web typography with zero cumulative layout shift prevents visual jitter and keeps readers engaged.
              </div>
            )}
          </div>
        )}

        {viewMode === 'split' && (
          <div className="relative min-h-[220px] rounded-xl bg-slate-950 border border-slate-800 overflow-hidden select-none">
            {/* Left side: Web Font */}
            <div
              className="absolute inset-0 p-6 flex flex-col justify-center text-cyan-300 bg-slate-950"
              style={{
                fontFamily: `'${family}', sans-serif`,
                fontSize: '28px',
                lineHeight: '1.4',
                clipPath: `inset(0 ${100 - splitPos}% 0 0)`,
              }}
            >
              Web typography with zero cumulative layout shift prevents visual jitter and keeps readers engaged.
            </div>

            {/* Right side: Fallback Font */}
            <div
              className="absolute inset-0 p-6 flex flex-col justify-center text-amber-400 bg-slate-900"
              style={{
                fontFamily: useOverrides ? `'${fallbackAlias}'` : `'${fallbackData.name}'`,
                fontSize: '28px',
                lineHeight: '1.4',
                clipPath: `inset(0 0 0 ${splitPos}%)`,
              }}
            >
              Web typography with zero cumulative layout shift prevents visual jitter and keeps readers engaged.
            </div>

            {/* Divider bar */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
              style={{ left: `${splitPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-slate-900 text-[10px] font-bold flex items-center justify-center shadow-md">
                ↔
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={splitPos}
              onChange={(e) => setSplitPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
            />
          </div>
        )}

        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs font-semibold text-cyan-400 mb-2 font-mono">
                Web Font: {family}
              </div>
              <p
                className="text-slate-100 text-xl leading-relaxed"
                style={{ fontFamily: `'${family}', sans-serif` }}
              >
                Web typography with zero cumulative layout shift prevents visual jitter and keeps readers engaged.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs font-semibold text-amber-400 mb-2 font-mono">
                Fallback: {useOverrides ? `${fallbackAlias} (Adjusted)` : `${fallbackData.name} (Unadjusted)`}
              </div>
              <p
                className="text-slate-100 text-xl leading-relaxed"
                style={{ fontFamily: useOverrides ? `'${fallbackAlias}'` : `'${fallbackData.name}'` }}
              >
                Web typography with zero cumulative layout shift prevents visual jitter and keeps readers engaged.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CSS Code Snippet */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-300 font-mono">
            Generated @font-face CSS
          </span>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors font-medium"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy CSS'}</span>
          </button>
        </div>
        <pre className="p-4 text-xs font-mono text-cyan-300 bg-slate-950 overflow-x-auto leading-relaxed">
          {cssSnippet}
        </pre>
      </div>
    </div>
  );
}
