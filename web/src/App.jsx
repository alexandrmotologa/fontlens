import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ZeroCLSStudio from './components/ZeroCLSStudio';
import SubsetStudio from './components/SubsetStudio';
import CodebaseHarvest from './components/CodebaseHarvest';
import VariableAxesStudio from './components/VariableAxesStudio';
import FontInspector from './components/FontInspector';
import ChunkSplitterStudio from './components/ChunkSplitterStudio';
import TypographyWaterfall from './components/TypographyWaterfall';

export default function App() {
  const [activeTab, setActiveTab] = useState('zero-cls');
  const [fontFile, setFontFile] = useState(null);
  const [fontDataUri, setFontDataUri] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [systemFonts, setSystemFonts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [harvestedGlyphs, setHarvestedGlyphs] = useState('');

  // Fetch supported system fallback fonts on mount
  useEffect(() => {
    fetch('/api/system-fonts')
      .then((res) => res.json())
      .then((data) => {
        if (data.fonts) setSystemFonts(data.fonts);
      })
      .catch((err) => console.error('Failed to load system fonts', err));

    // Load initial sample
    loadSampleFont('inter');
  }, []);

  const loadSampleFont = async (sampleName) => {
    setIsLoading(true);
    try {
      const fileName = sampleName === 'roboto' ? 'Roboto-Regular.ttf' : 'Inter-Variable.ttf';
      const res = await fetch(`/samples/${fileName}`);
      if (!res.ok) {
        throw new Error('Direct sample fetch failed');
      }
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: 'font/ttf' });
      await processFontFile(file);
    } catch (err) {
      console.log('Sample direct load fallback', err);
    } finally {
      setIsLoading(false);
    }
  };

  const processFontFile = async (file) => {
    setFontFile(file);
    setIsLoading(true);

    // Read base64 data URI for CSS font-face preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFontDataUri(e.target.result);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('font', file);

      const res = await fetch('/api/analyze-font', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to analyze font');
      }

      const data = await res.json();
      setMetadata(data.metadata);
    } catch (err) {
      alert(`Font Analysis Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchGoogleFont = async (family) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/fetch-google-font', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family, weight: 400 }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to download Google Font');
      }

      const data = await res.json();
      setFontDataUri(data.data_uri);
      setMetadata(data.metadata);

      // Convert data URI back to File object for subsequent subsetting
      const byteString = atob(data.data_uri.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: 'font/woff2' });
      const file = new File([blob], data.filename, { type: 'font/woff2' });
      setFontFile(file);
    } catch (err) {
      alert(`Google Fonts Fetch Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToSubsetter = (glyphs) => {
    setHarvestedGlyphs(glyphs);
    setActiveTab('subset');
  };

  const isVariable = Boolean(metadata?.is_variable);
  const familyName = metadata?.family || 'CustomWebFont';

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      <Navbar
        currentFont={metadata?.family}
        onLoadSample={loadSampleFont}
        onFileUpload={processFontFile}
        onFetchGoogleFont={handleFetchGoogleFont}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isVariable={isVariable}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading && (
          <div className="mb-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800 text-cyan-300 text-xs flex items-center justify-between">
            <span>Parsing OpenType tables and calculating font metric ratios...</span>
            <span className="font-mono animate-pulse">Processing</span>
          </div>
        )}

        {activeTab === 'zero-cls' && (
          <ZeroCLSStudio
            webMetrics={metadata?.metrics}
            systemFonts={systemFonts}
            fontDataUri={fontDataUri}
            fontFamilyName={familyName}
            fontFile={fontFile}
          />
        )}

        {activeTab === 'waterfall' && (
          <TypographyWaterfall
            fontFamilyName={familyName}
            fallbackAlias={`${familyName}-Fallback`}
          />
        )}

        {activeTab === 'subset' && (
          <SubsetStudio
            fontFile={fontFile}
            metadata={metadata}
            harvestedGlyphs={harvestedGlyphs}
          />
        )}

        {activeTab === 'chunking' && (
          <ChunkSplitterStudio
            fontFile={fontFile}
            metadata={metadata}
          />
        )}

        {activeTab === 'harvest' && (
          <CodebaseHarvest onSendToSubsetter={handleSendToSubsetter} />
        )}

        {activeTab === 'variable' && isVariable && (
          <VariableAxesStudio
            metadata={metadata}
            fontFamilyName={familyName}
          />
        )}

        {activeTab === 'inspector' && (
          <FontInspector
            metadata={metadata}
            fontFile={fontFile}
          />
        )}
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FontLens: High-Speed Web Typography & Zero-CLS Metric Synthesizer</span>
          <span className="font-mono">Open Source under MIT License</span>
        </div>
      </footer>
    </div>
  );
}
