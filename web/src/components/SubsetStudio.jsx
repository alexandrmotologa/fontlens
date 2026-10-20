import React, { useState, useMemo } from 'react';
import { Download, Sparkles, Filter, Check, Copy, Scissors, RefreshCw } from 'lucide-react';

export default function SubsetStudio({
  fontFile,
  metadata,
  onSubsetComplete,
  harvestedGlyphs,
}) {
  const [selectedChars, setSelectedChars] = useState(
    harvestedGlyphs || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,;:!?-–—\'"()/$€@#'
  );
  const [flavor, setFlavor] = useState('woff2');
  const [stripHinting, setStripHinting] = useState(true);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Extract unique characters set
  const charArray = useMemo(() => {
    return Array.from(new Set(selectedChars.split(''))).sort();
  }, [selectedChars]);

  const applyPreset = (preset) => {
    switch (preset) {
      case 'ascii':
        setSelectedChars(''.padStart(95, ' ').split('').map((_, i) => String.fromCharCode(i + 32)).join(''));
        break;
      case 'alphanumeric':
        setSelectedChars('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
        break;
      case 'digits-currency':
        setSelectedChars('0123456789.,$€£¥₹₽₩%+-/*=');
        break;
      case 'western':
        {
          const base = ''.padStart(95, ' ').split('').map((_, i) => String.fromCharCode(i + 32)).join('');
          const ext = '€£¥©®™°±•–—‘’“”„…«»';
          setSelectedChars(base + ext);
        }
        break;
      case 'clear':
        setSelectedChars('');
        break;
      default:
        break;
    }
  };

  const handleSynthesize = async () => {
    if (!fontFile) {
      alert('Please upload a font file or choose a sample font first.');
      return;
    }

    setIsSynthesizing(true);
    try {
      const formData = new FormData();
      formData.append('font', fontFile);
      formData.append('text', selectedChars);
      formData.append('flavor', flavor);
      formData.append('strip_hinting', stripHinting ? 'true' : 'false');

      const res = await fetch('/api/subset-font', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Subsetting failed');
      }

      const data = await res.json();
      setResult(data);
      if (onSubsetComplete) {
        onSubsetComplete(data);
      }
    } catch (err) {
      alert(`Error during subset synthesis: ${err.message}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleDownload = () => {
    if (!result?.data_uri) return;
    const a = document.createElement('a');
    a.href = result.data_uri;
    a.download = result.filename || `font.subset.${flavor}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const preloadHtml = result
    ? `<link rel="preload" href="/fonts/${result.filename}" as="font" type="font/${flavor}" crossorigin>`
    : '';

  return (
    <div className="space-y-6">
      {/* Header Cards & Preset Bar */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              WOFF2 Subset Synthesizer
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Prune unused glyphs, redundant OpenType tables, and kerning pairs to shrink font files by up to 95%.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Presets:</span>
            <button
              onClick={() => applyPreset('ascii')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
            >
              ASCII Printable
            </button>
            <button
              onClick={() => applyPreset('alphanumeric')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
            >
              Alphanumeric
            </button>
            <button
              onClick={() => applyPreset('digits-currency')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
            >
              Digits & Currency
            </button>
            <button
              onClick={() => applyPreset('western')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
            >
              Western Latin
            </button>
            <button
              onClick={() => applyPreset('clear')}
              className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-xs text-rose-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Selected Characters Text Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Glyphs to Retain ({charArray.length} unique characters)
            </label>
            <span className="text-xs text-slate-500">
              Edit or paste text directly into the box
            </span>
          </div>
          <textarea
            value={selectedChars}
            onChange={(e) => setSelectedChars(e.target.value)}
            rows={4}
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 leading-relaxed resize-y"
            placeholder="Type or paste characters to keep in the subset..."
          />
        </div>

        {/* Subsetting Configuration Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Target Output Format
            </label>
            <select
              value={flavor}
              onChange={(e) => setFlavor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="woff2">WOFF2 (Brotli Compression - Best for Web)</option>
              <option value="woff">WOFF (Zopfli Compression)</option>
              <option value="ttf">TTF (Raw TrueType)</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={stripHinting}
                onChange={(e) => setStripHinting(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <div>
                <span className="font-semibold block text-slate-200">Strip Hinting Bytecode</span>
                <span className="text-slate-500 text-[11px]">Saves ~20-35% on size, safe for high-DPI screens</span>
              </div>
            </label>
          </div>

          <div className="flex items-end justify-end">
            <button
              onClick={handleSynthesize}
              disabled={isSynthesizing || charArray.length === 0}
              className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50"
            >
              {isSynthesizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4" />
                  <span>Synthesize {flavor.toUpperCase()} Subset</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results & Download Panel */}
      {result && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-emerald-900/50 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <h4 className="font-bold text-white text-sm">Synthesis Successful</h4>
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {result.filename}</span>
            </button>
          </div>

          {/* Savings Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Original File Size</div>
              <div className="text-xl font-mono font-bold text-slate-300 mt-1">
                {result.original_size_kb} KB
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-emerald-900/60">
              <div className="text-[11px] text-emerald-400 font-medium">Subset WOFF2 Size</div>
              <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                {result.subset_size_kb} KB
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-cyan-900/60">
              <div className="text-[11px] text-cyan-400 font-medium">Net Size Reduction</div>
              <div className="text-xl font-mono font-bold text-cyan-400 mt-1">
                -{result.compression_percent}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Retained Glyphs</div>
              <div className="text-xl font-mono font-bold text-slate-300 mt-1">
                {result.retained_glyph_count} / {result.original_glyph_count}
              </div>
            </div>
          </div>

          {/* Preload HTML Tag */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 text-xs text-slate-400 font-mono">
              <span>Optimized HTML Preload Tag</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(preloadHtml);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 text-xs font-mono text-emerald-300 overflow-x-auto">
              {preloadHtml}
            </pre>
          </div>
        </div>
      )}

      {/* Visual Glyph Grid */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Active Glyph Matrix ({charArray.length} Glyphs)
          </h4>
          <input
            type="text"
            placeholder="Filter glyphs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-16 lg:grid-cols-20 gap-2 max-h-72 overflow-y-auto p-1">
          {charArray
            .filter((c) => !searchTerm || c.includes(searchTerm) || c.charCodeAt(0).toString(16).includes(searchTerm.toLowerCase()))
            .map((char, idx) => (
              <div
                key={idx}
                className="group relative flex flex-col items-center justify-center h-12 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500 hover:bg-slate-800/60 transition-all cursor-pointer"
                title={`Character: ${char} (U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`}
              >
                <span className="text-base text-slate-100 font-sans">{char}</span>
                <span className="text-[9px] font-mono text-slate-500 group-hover:text-cyan-400">
                  {char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
