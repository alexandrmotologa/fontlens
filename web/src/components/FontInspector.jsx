import React, { useState } from 'react';
import { Info, Database, Layers, CheckCircle, AlertTriangle } from 'lucide-react';

const SAFE_DROP_TABLES = new Set([
  'gasp', 'VDMX', 'LTSH', 'hdmx', 'DSIG',
  'vhea', 'vmtx', 'PCLT', 'feat', 'morx', 'mort',
]);

export default function FontInspector({ metadata, glyphs, fontFile }) {
  const [selectedChar, setSelectedChar] = useState('A');
  const [svgPathData, setSvgPathData] = useState(null);
  const [isLoadingSvg, setIsLoadingSvg] = useState(false);

  const fetchGlyphSvg = async (char) => {
    setSelectedChar(char);
    if (!fontFile) return;

    setIsLoadingSvg(true);
    try {
      const formData = new FormData();
      formData.append('font', fontFile);
      formData.append('char', char);

      const res = await fetch('/api/glyph-svg', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSvgPathData(data);
      }
    } catch (err) {
      console.error('Failed to fetch SVG', err);
    } finally {
      setIsLoadingSvg(false);
    }
  };

  const metrics = metadata?.metrics;

  return (
    <div className="space-y-6">
      {/* Top Metadata Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Font Family</div>
          <div className="text-xl font-bold text-white mt-1 truncate">
            {metadata?.family || 'Unknown'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{metadata?.subfamily || 'Regular'}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Units Per Em (UPM)</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {metadata?.units_per_em || 2048}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Design coordinate grid</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Glyphs</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {metadata?.glyph_count || 0}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {metadata?.supported_unicodes_count || 0} mapped Unicodes
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Variable Font</div>
          <div className="text-xl font-bold text-indigo-400 mt-1">
            {metadata?.is_variable ? 'Yes' : 'No'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {metadata?.axes?.length || 0} axes defined
          </div>
        </div>
      </div>

      {/* Metrics Table */}
      {metrics && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            TrueType / OpenType Metrics Breakdown
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block">sTypoAscender</span>
              <span className="text-cyan-300 font-bold text-sm">{metrics.typo_ascent}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block">sTypoDescender</span>
              <span className="text-cyan-300 font-bold text-sm">{metrics.typo_descent}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block">sTypoLineGap</span>
              <span className="text-cyan-300 font-bold text-sm">{metrics.typo_line_gap}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block">USE_TYPO_METRICS</span>
              <span className={metrics.use_typo_metrics ? "text-emerald-400 font-bold" : "text-slate-400"}>
                {metrics.use_typo_metrics ? "Enabled (Bit 7)" : "Disabled"}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block">hhea.ascent</span>
              <span className="text-slate-200 font-bold text-sm">{metrics.hhea_ascent}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block">hhea.descent</span>
              <span className="text-slate-200 font-bold text-sm">{metrics.hhea_descent}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block">xAvgCharWidth</span>
              <span className="text-slate-200 font-bold text-sm">{metrics.avg_char_width}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block">sxHeight / sCapHeight</span>
              <span className="text-slate-200 font-bold text-sm">
                {metrics.x_height || '-'} / {metrics.cap_height || '-'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Vector Glyph Outline Inspector */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Vector Glyph Contour Inspector
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact SVG path data extracted directly from font contour tables.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {['A', 'R', 'g', '&', '€', 'Q', 'M'].map((ch) => (
              <button
                key={ch}
                onClick={() => fetchGlyphSvg(ch)}
                className={`w-7 h-7 rounded text-xs font-mono font-bold transition-colors ${
                  selectedChar === ch
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {svgPathData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex items-center justify-center p-6 rounded-xl bg-slate-950 border border-slate-800 h-64">
              <svg
                viewBox={svgPathData.view_box}
                className="w-48 h-48 text-cyan-400 stroke-cyan-400 fill-cyan-400/20"
                style={{ overflow: 'visible' }}
              >
                <g transform={svgPathData.transform}>
                  <path d={svgPathData.svg_path} strokeWidth="10" />
                </g>
              </svg>
            </div>

            <div className="md:col-span-2 space-y-2 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500">Glyph Name: </span>
                <span className="text-white font-bold">{svgPathData.glyph_name}</span>
                <span className="text-slate-500 ml-4">Advance Width: </span>
                <span className="text-cyan-400 font-bold">{svgPathData.width}</span>
                <span className="text-slate-500 ml-4">LSB: </span>
                <span className="text-cyan-400 font-bold">{svgPathData.lsb}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block mb-1">SVG Path String:</span>
                <div className="text-slate-300 text-[11px] break-all max-h-24 overflow-y-auto">
                  {svgPathData.svg_path}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">
            Click any character button above to inspect its vector outline.
          </div>
        )}
      </div>

      {/* OpenType Tables Directory */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          OpenType Tables Directory ({metadata?.tables?.length || 0} Tables)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {metadata?.tables?.map((table) => {
            const isSafeToDrop = SAFE_DROP_TABLES.has(table.tag);
            return (
              <div
                key={table.tag}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white text-xs">{table.tag}</span>
                  {isSafeToDrop ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                      Prunable
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">Core</span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-2">
                  {table.length.toLocaleString()} B
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
