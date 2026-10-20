import React, { useState } from 'react';
import { Layers, Download, Copy, Check, Scissors, RefreshCw } from 'lucide-react';

export default function ChunkSplitterStudio({ fontFile, metadata }) {
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitData, setSplitData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [stripHinting, setStripHinting] = useState(true);

  const handleSplit = async () => {
    if (!fontFile) {
      alert('Please upload or load a font first.');
      return;
    }

    setIsSplitting(true);
    try {
      const formData = new FormData();
      formData.append('font', fontFile);
      formData.append('strip_hinting', stripHinting ? 'true' : 'false');

      const res = await fetch('/api/split-font', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Font splitting failed');
      }

      const data = await res.json();
      setSplitData(data);
    } catch (err) {
      alert(`Error splitting font: ${err.message}`);
    } finally {
      setIsSplitting(false);
    }
  };

  const copyCss = () => {
    if (!splitData?.combined_css) return;
    navigator.clipboard.writeText(splitData.combined_css);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Progressive Unicode-Range Font Chunking
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Split large fonts into 2–3 disjoint WOFF2 chunks so visitors only download the glyph sets they actually see.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={stripHinting}
                onChange={(e) => setStripHinting(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-cyan-500"
              />
              <span>Strip Hinting</span>
            </label>

            <button
              onClick={handleSplit}
              disabled={isSplitting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50"
            >
              {isSplitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Splitting Font...</span>
                </>
              ) : (
                <>
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Synthesize Progressive Chunks</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Chunks Display */}
        {splitData ? (
          <div className="space-y-4 mt-6 pt-4 border-t border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {splitData.chunks.map((chunk) => (
                <div key={chunk.chunk_id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-400 text-sm">{chunk.chunk_id}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono font-bold border border-emerald-800">
                      {chunk.size_kb} KB
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200">{chunk.label}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {chunk.glyph_count} glyphs retained
                  </div>
                  <div className="text-[10px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800 font-mono truncate">
                    {chunk.css_unicode_range}
                  </div>
                </div>
              ))}
            </div>

            {/* Combined CSS Output */}
            <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden mt-4">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 text-xs text-slate-400 font-mono">
                <span>Progressive @font-face Delivery Rules</span>
                <button
                  onClick={copyCss}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy Combined CSS'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed max-h-64">
                {splitData.combined_css}
              </pre>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl mt-4">
            Click &quot;Synthesize Progressive Chunks&quot; to split {metadata?.family || 'the current font'} into disjoint Latin, Latin-Extended, and Symbols WOFF2 bundles.
          </div>
        )}
      </div>
    </div>
  );
}
