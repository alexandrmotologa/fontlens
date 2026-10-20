import React, { useState } from 'react';
import { Upload, FileText, ArrowRight, Copy, Check, BarChart3, Sparkles } from 'lucide-react';

export default function CodebaseHarvest({ onSendToSubsetter }) {
  const [inputText, setInputText] = useState(
    `<main className="app-shell">\n  <h1>FontLens Web Performance</h1>\n  <p>Price: $19.99 / €17.50 / £15.00 — Zero layout shift guaranteed.</p>\n  <button onClick={handleOptimize}>Start Subsetting →</button>\n</main>`
  );
  const [harvestResult, setHarvestResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleScanText = async () => {
    if (!inputText.trim()) return;
    setIsScanning(true);
    try {
      const res = await fetch('/api/scan-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      setHarvestResult(data);
    } catch (err) {
      alert(`Harvest error: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    setIsScanning(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      const res = await fetch('/api/scan-files', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setHarvestResult(data);
      if (data.unique_glyphs) {
        setInputText(`// Harvested from ${files.length} uploaded files:\n${data.unique_glyphs}`);
      }
    } catch (err) {
      alert(`File scanning error: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input & Code Dropper */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Codebase Glyph Harvest
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Scan HTML, JSX, Vue, Svelte, Markdown and static strings to discover the exact unique characters needed.
            </p>
          </div>

          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Drop Files (JSX, HTML, MD...)</span>
            <input
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Source Code or Text to Inspect
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={6}
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 leading-relaxed resize-y"
            placeholder="Paste source code or drop files..."
          />
        </div>

        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            onClick={handleScanText}
            disabled={isScanning || !inputText.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isScanning ? 'Extracting...' : 'Harvest Unique Glyphs'}</span>
          </button>
        </div>
      </div>

      {/* Harvest Results */}
      {harvestResult && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400">
                Total Characters: <strong className="text-white font-mono">{harvestResult.total_characters}</strong>
              </span>
              <span className="text-xs text-slate-400">
                Unique Glyphs: <strong className="text-cyan-400 font-mono">{harvestResult.unique_count}</strong>
              </span>
            </div>

            <button
              onClick={() => onSendToSubsetter(harvestResult.unique_glyphs)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-colors"
            >
              <span>Send to WOFF2 Subsetter</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Unicode Blocks Breakdown */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              Detected Unicode Blocks
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {harvestResult.blocks.map((b) => (
                <div key={b.name} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{b.name}</span>
                    <span className="text-cyan-400 font-mono font-bold">{b.count} glyphs</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 truncate font-mono">
                    {b.characters}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CSS Unicode Range Output */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 text-xs text-slate-400 font-mono">
              <span>CSS unicode-range</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(harvestResult.css_unicode_range);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 text-xs font-mono text-cyan-300 overflow-x-auto">
              unicode-range: {harvestResult.css_unicode_range};
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
