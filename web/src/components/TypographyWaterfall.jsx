import React, { useState } from 'react';
import { Type, Sliders, Eye } from 'lucide-react';

const SIZES = [12, 14, 16, 20, 24, 32, 48, 64];

export default function TypographyWaterfall({ fontFamilyName, fallbackAlias }) {
  const [customText, setCustomText] = useState('Sphinx of black quartz, judge my vow. 0123456789 €$');
  const [lineHeight, setLineHeight] = useState(1.4);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [activeFontChoice, setActiveFontChoice] = useState('web'); // 'web', 'fallback', 'overlay'

  const family = fontFamilyName || 'CustomWebFont';
  const fbAlias = fallbackAlias || `${family}-Fallback`;

  const getFontFamily = (choice) => {
    if (choice === 'fallback') return `'${fbAlias}', sans-serif`;
    return `'${family}', sans-serif`;
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-cyan-400" />
              Typography Waterfall & Rendering Studio
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect glyph rendering and optical legibility across common editorial and UI scales.
            </p>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveFontChoice('web')}
              className={`px-2.5 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                activeFontChoice === 'web' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Web Font ({family})
            </button>
            <button
              onClick={() => setActiveFontChoice('fallback')}
              className={`px-2.5 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                activeFontChoice === 'fallback' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Adjusted Fallback
            </button>
            <button
              onClick={() => setActiveFontChoice('overlay')}
              className={`px-2.5 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                activeFontChoice === 'overlay' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overlay Diff
            </button>
          </div>
        </div>

        {/* Custom Text and Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Waterfall Preview Text
            </label>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Line Height</span>
                <span className="font-mono text-cyan-400">{lineHeight}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.2"
                step="0.1"
                value={lineHeight}
                onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Spacing</span>
                <span className="font-mono text-cyan-400">{letterSpacing}px</span>
              </div>
              <input
                type="range"
                min="-2"
                max="6"
                step="0.5"
                value={letterSpacing}
                onChange={(e) => setLetterSpacing(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Waterfall Rows */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 divide-y divide-slate-800/80">
        {SIZES.map((size) => (
          <div key={size} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-baseline gap-2 sm:gap-4">
            <span className="w-16 shrink-0 text-xs font-mono font-bold text-slate-500">
              {size}px
            </span>

            <div className="flex-1 relative overflow-hidden min-w-0 w-full">
              {activeFontChoice === 'overlay' ? (
                <div className="relative">
                  <div
                    className="text-amber-400/60 select-none break-words"
                    style={{
                      fontFamily: `'${fbAlias}', sans-serif`,
                      fontSize: `${size}px`,
                      lineHeight,
                      letterSpacing: `${letterSpacing}px`,
                    }}
                  >
                    {customText}
                  </div>
                  <div
                    className="text-cyan-300 absolute inset-0 select-none pointer-events-none break-words"
                    style={{
                      fontFamily: `'${family}', sans-serif`,
                      fontSize: `${size}px`,
                      lineHeight,
                      letterSpacing: `${letterSpacing}px`,
                      mixBlendMode: 'screen',
                    }}
                  >
                    {customText}
                  </div>
                </div>
              ) : (
                <div
                  className="text-slate-100 break-words"
                  style={{
                    fontFamily: getFontFamily(activeFontChoice),
                    fontSize: `${size}px`,
                    lineHeight,
                    letterSpacing: `${letterSpacing}px`,
                  }}
                >
                  {customText}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
