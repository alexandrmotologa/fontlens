import React, { useRef, useState } from 'react';
import { Type, Upload, Sparkles, FileText, Activity, Layers, Download, Search, Globe } from 'lucide-react';

export default function Navbar({
  currentFont,
  onLoadSample,
  onFileUpload,
  onFetchGoogleFont,
  activeTab,
  setActiveTab,
  isVariable,
}) {
  const fileInputRef = useRef(null);
  const [googleFontInput, setGoogleFontInput] = useState('');
  const [isFetchingGFont, setIsFetchingGFont] = useState(false);
  const [showGFontModal, setShowGFontModal] = useState(false);

  const tabs = [
    { id: 'zero-cls', label: 'Zero-CLS Studio', icon: Activity },
    { id: 'waterfall', label: 'Typography Waterfall', icon: Type },
    { id: 'subset', label: 'WOFF2 Subsetter', icon: Sparkles },
    { id: 'chunking', label: 'Font Chunking', icon: Layers },
    { id: 'harvest', label: 'Codebase Harvest', icon: FileText },
    ...(isVariable ? [{ id: 'variable', label: 'Variable Axes', icon: Type }] : []),
    { id: 'inspector', label: 'Font Inspector', icon: Type },
  ];

  const handleGoogleFontSubmit = async (e) => {
    e?.preventDefault();
    if (!googleFontInput.trim()) return;
    setIsFetchingGFont(true);
    try {
      await onFetchGoogleFont(googleFontInput.trim());
      setShowGFontModal(false);
      setGoogleFontInput('');
    } catch (err) {
      alert(`Google Fonts Error: ${err.message}`);
    } finally {
      setIsFetchingGFont(false);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-white font-black text-xl tracking-tighter">fl</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">FontLens</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono font-medium">
                  v0.1.0
                </span>
                {currentFont && (
                  <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                    {currentFont}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Web Font Bloat Optimizer & Zero-CLS Synthesizer
              </p>
            </div>
          </div>

          {/* Quick Font Loader / Upload / Google Fonts */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowGFontModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 text-xs font-medium transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Google Fonts</span>
            </button>

            <div className="hidden lg:flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs text-slate-300">
              <span className="text-slate-500 px-2 font-medium">Quick:</span>
              <button
                onClick={() => onLoadSample('inter')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium"
              >
                Inter
              </button>
              <button
                onClick={() => onLoadSample('roboto')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium"
              >
                Roboto
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) onFileUpload(e.target.files[0]);
              }}
              accept=".ttf,.otf,.woff,.woff2"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>

            <a
              href="https://github.com/alexandrmotologa/fontlens"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="GitHub Repository"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-t border-slate-800/80 pt-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Google Fonts Import Modal */}
      {showGFontModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Import from Google Fonts
              </h3>
              <button
                onClick={() => setShowGFontModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGoogleFontSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Font Family Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Poppins, Plus Jakarta Sans, Outfit, Playfair Display"
                  value={googleFontInput}
                  onChange={(e) => setGoogleFontInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Popular quick picks */}
              <div>
                <span className="text-[11px] text-slate-500 font-medium block mb-1.5">Trending Web Fonts:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Poppins', 'Montserrat', 'Playfair Display', 'Plus Jakarta Sans', 'Outfit', 'Space Grotesk', 'Fira Code'].map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setGoogleFontInput(name)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGFontModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFetchingGFont || !googleFontInput.trim()}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 disabled:opacity-50"
                >
                  {isFetchingGFont ? 'Fetching...' : 'Fetch & Load Font'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
