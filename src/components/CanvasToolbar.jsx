import React, { useEffect } from 'react';
import { MousePointer2, Type, LayoutGrid, ZoomIn, ZoomOut, Magnet } from 'lucide-react';
import { useHookStore } from '../context/HookContext';

export default function CanvasToolbar() {
  const {
    activeTool, setActiveTool,
    canvasZoom, setCanvasZoom, CANVAS_ZOOM_LEVELS,
    showGrid, setShowGrid,
    snapToGrid, setSnapToGrid,
  } = useHookStore();

  const stepZoom = (dir) => {
    setCanvasZoom((z) => {
      const idx = CANVAS_ZOOM_LEVELS.findIndex((l) => l >= z - 0.001);
      const next = dir > 0
        ? CANVAS_ZOOM_LEVELS[Math.min(idx + 1, CANVAS_ZOOM_LEVELS.length - 1)]
        : CANVAS_ZOOM_LEVELS[Math.max(idx - 1, 0)];
      return next ?? z;
    });
  };

  // Global keyboard shortcuts for canvas tools
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      if (e.key === 't' || e.key === 'T') setActiveTool('text');
      if (e.key === 'Escape') setActiveTool('select');
      if (e.key === 'g' || e.key === 'G') setShowGrid((v) => !v);
      if ((e.key === '=' || e.key === '+') && !e.ctrlKey && !e.metaKey) stepZoom(1);
      if (e.key === '-' && !e.ctrlKey && !e.metaKey) stepZoom(-1);
      if (e.key === '0' && !e.ctrlKey && !e.metaKey) setCanvasZoom(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setActiveTool, setShowGrid, setCanvasZoom]);

  const isZoomedIn  = canvasZoom > 1.001;
  const isZoomedOut = canvasZoom < 0.999;

  return (
    <div className="canvas-toolbar">
      {/* Tools */}
      <button
        className={`canvas-tool-btn ${activeTool === 'select' ? 'active' : ''}`}
        onClick={() => setActiveTool('select')}
        title="Select & Move (V)"
      >
        <MousePointer2 size={13} strokeWidth={2} />
        <span>Select</span>
        <kbd>V</kbd>
      </button>

      <div className="canvas-toolbar-divider" />

      <button
        className={`canvas-tool-btn ${activeTool === 'text' ? 'active' : ''}`}
        onClick={() => setActiveTool('text')}
        title="Add Text (T)"
      >
        <Type size={13} strokeWidth={2} />
        <span>Text</span>
        <kbd>T</kbd>
      </button>

      <div className="canvas-toolbar-divider" />

      {/* Grid */}
      <button
        className={`canvas-tool-btn ${showGrid ? 'active' : ''}`}
        onClick={() => setShowGrid((v) => !v)}
        title="Toggle grid (G)"
      >
        <LayoutGrid size={13} strokeWidth={2} />
        <span>Grid</span>
        <kbd>G</kbd>
      </button>

      {/* Snap */}
      <button
        className={`canvas-tool-btn ${snapToGrid ? 'active' : ''}`}
        onClick={() => setSnapToGrid((v) => !v)}
        title="Snap to grid"
      >
        <Magnet size={13} strokeWidth={2} />
        <span>Snap</span>
      </button>

      <div className="canvas-toolbar-divider" />

      {/* Zoom controls */}
      <button
        className="canvas-tool-btn"
        onClick={() => stepZoom(-1)}
        disabled={canvasZoom <= CANVAS_ZOOM_LEVELS[0]}
        title="Zoom out (−)"
      >
        <ZoomOut size={13} strokeWidth={2} />
      </button>

      <button
        className="canvas-tool-btn"
        onClick={() => setCanvasZoom(1)}
        title="Reset zoom (0)"
        style={{
          minWidth: 40,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: (isZoomedIn || isZoomedOut) ? 'var(--accent-primary)' : undefined,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {Math.round(canvasZoom * 100)}%
      </button>

      <button
        className="canvas-tool-btn"
        onClick={() => stepZoom(1)}
        disabled={canvasZoom >= CANVAS_ZOOM_LEVELS[CANVAS_ZOOM_LEVELS.length - 1]}
        title="Zoom in (+)"
      >
        <ZoomIn size={13} strokeWidth={2} />
      </button>
    </div>
  );
}
