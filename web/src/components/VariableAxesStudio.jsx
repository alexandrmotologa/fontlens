import React, { useState, useEffect } from 'react';
import { Sliders, Copy, Check, Type, Layers } from 'lucide-react';

export default function VariableAxesStudio({ metadata, fontFamilyName }) {
  const axes = metadata?.axes || [];
  const instances = metadata?.instances || [];
  const family = fontFamilyName || metadata?.family || 'CustomWebFont';

  // Initialize axis values with default values
  const [axisValues, setAxisValues] = useState({});
  const [sampleText, setSampleText] = useState(
    'Sphinx of black quartz, judge my vow. Zero layout shift with variable font axes.'
  );
  const [fontSize, setFontSize] = useState(36);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (axes.length > 0) {
      const initial = {};
      axes.forEach((a) => {
        initial[a.tag] = a.default_value;
      });
      setAxisValues(initial);
    }
  }, [metadata]);

  const handleAxisChange = (tag, val) => {
    setAxisValues((prev) => ({
      ...prev,
      [tag]: parseFloat(val),
    }));
  };

  const applyInstance = (inst) => {
    setAxisValues((prev) => ({
      ...prev,
      ...inst.coordinates,
    }));
  };

  const variationSettingsString = Object.entries(axisValues)
    .map(([tag, val]) => `"${tag}" ${val}`)
    .join(', ');

  const cssRule = `font-family: '${family}', sans-serif;\nfont-variation-settings: ${variationSettingsString};`;

  return (
    <div className="space-y-6">
      {/* Axes Controls & Sliders */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Variable Font Studio
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore dynamic typographic axes and generate precise CSS font-variation-settings.
            </p>
          </div>

          {/* Named Instances */}
          {instances.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Named Presets:</span>
              {instances.map((inst) => (
                <button
                  key={inst.name}
                  onClick={() => applyInstance(inst)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors font-medium"
                >
                  {inst.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {axes.map((axis) => {
            const currentVal = axisValues[axis.tag] ?? axis.default_value;
            return (
              <div key={axis.tag} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-bold text-white font-mono">{axis.tag}</span>
                    <span className="text-xs text-slate-400 ml-2">({axis.name})</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                    {currentVal}
                  </span>
                </div>

                <input
                  type="range"
                  min={axis.min_value}
                  max={axis.max_value}
                  step={axis.tag === 'opsz' ? 0.5 : 1}
                  value={currentVal}
                  onChange={(e) => handleAxisChange(axis.tag, e.target.value)}
                  className="w-full accent-cyan-400 cursor-pointer"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-1">
                  <span>Min: {axis.min_value}</span>
                  <span>Default: {axis.default_value}</span>
                  <span>Max: {axis.max_value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Visual Typography Preview */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Live Variation Rendering
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Size:</span>
              <input
                type="range"
                min="16"
                max="72"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-24 accent-cyan-400 cursor-pointer"
              />
              <span className="font-mono text-cyan-400">{fontSize}px</span>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400">
            {variationSettingsString}
          </div>
        </div>

        {/* Editable Sample Text */}
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 min-h-[160px] flex items-center justify-center">
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => setSampleText(e.target.innerText)}
            className="w-full text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded p-2 transition-all leading-tight text-center"
            style={{
              fontFamily: `'${family}', sans-serif`,
              fontSize: `${fontSize}px`,
              fontVariationSettings: variationSettingsString,
            }}
          >
            {sampleText}
          </div>
        </div>

        {/* Copyable CSS */}
        <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 text-xs text-slate-400 font-mono">
            <span>CSS font-variation-settings</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(cssRule);
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
            {cssRule}
          </pre>
        </div>
      </div>
    </div>
  );
}
