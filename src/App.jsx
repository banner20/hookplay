import React, { useState } from 'react';
import './App.css';
import VideoPreview from './components/VideoPreview';
import ControlsPanel from './components/ControlsPanel';
import TimelineScrubber from './components/TimelineScrubber';
import ExportModal from './components/ExportModal';
import { useHookStore } from './context/HookContext';
import { Download, Zap, Layers, Clapperboard } from 'lucide-react';

function Header({ onExport }) {
  const { appMode, setAppMode } = useHookStore();

  return (
    <header className="header">
      <div className="header-brand">
        <div className="brand-icon">
          <Zap size={14} color="#fff" strokeWidth={2.5} />
        </div>
        <h1>HookForge</h1>
        <span className="badge">ALPHA</span>
      </div>

      <div className="header-center">
        <div className="mode-toggle">
          <button
            className={`mode-toggle-btn ${appMode === 'design' ? 'active' : ''}`}
            onClick={() => setAppMode('design')}
          >
            <Layers size={12} strokeWidth={2.5} />
            Design
          </button>
          <button
            className={`mode-toggle-btn ${appMode === 'play' ? 'active' : ''}`}
            onClick={() => setAppMode('play')}
          >
            <Clapperboard size={12} strokeWidth={2.5} />
            Preview
          </button>
        </div>
      </div>

      <div className="header-actions">
        <button className="btn-export" onClick={onExport}>
          <Download size={14} strokeWidth={2.5} />
          Export
        </button>
      </div>
    </header>
  );
}

function App() {
  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <div className="app-container">
      <Header onExport={() => setShowExportModal(true)} />

      <main className="main-content">
        <section className="preview-section">
          <div className="canvas-container">
            <VideoPreview />
          </div>
          <TimelineScrubber />
        </section>

        <section className="controls-section">
          <ControlsPanel />
        </section>
      </main>

      {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} />}
    </div>
  );
}

export default App;
