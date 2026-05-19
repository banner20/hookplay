import React, { useEffect, useRef, useState } from 'react';
import { MousePointer2, Type, LayoutGrid, ZoomIn, ZoomOut, Magnet, Image, Square, Circle, Minus } from 'lucide-react';
import { useHookStore } from '../context/HookContext';

export default function CanvasToolbar() {
  const {
    activeTool, setActiveTool,
    canvasZoom, setCanvasZoom, CANVAS_ZOOM_LEVELS,
    showGrid, setShowGrid,
    snapToGrid, setSnapToGrid,
    addImageLayer, addShapeLayer,
  } = useHookStore();

  const fileInputRef = useRef(null);
  const [showShapes, setShowShapes] = useState(false);

  const handleImageFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => addImageLayer(url, file.name, img.naturalWidth / img.naturalHeight);
    img.src = url;
    e.target.value = '';
  };

  useEffect(() => {
    if (!showShapes) return;
    const onMouseDown = (e) => {
      setShowShapes(false);
    };
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [showShapes]);

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

      {/* Image upload */}
      <button className="canvas-tool-btn" onClick={() => fileInputRef.current?.click()} title="Add image (I)">
        <Image size={13} strokeWidth={2} />
        <span>Image</span>
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} style={{ display: 'none' }} />

      {/* Shape tool */}
      <div style={{ position: 'relative' }}>
        <button className="canvas-tool-btn" onClick={(e) => { e.stopPropagation(); setShowShapes(v => !v); }} title="Add shape">
          <Square size={13} strokeWidth={2} />
          <span>Shape</span>
        </button>
        {showShapes && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: 4,
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 8, padding: 4, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 90,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}>
            {[
              { type: 'rect',   icon: <Square size={12} />, label: 'Rectangle' },
              { type: 'circle', icon: <Circle size={12} />, label: 'Ellipse' },
              { type: 'line',   icon: <Minus  size={12} />, label: 'Line' },
            ].map(({ type, icon, label }) => (
              <button key={type} onClick={(e) => { e.stopPropagation(); addShapeLayer(type); setShowShapes(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'none',
                  border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 6, fontSize: 12,
                  textAlign: 'left', transition: 'background 0.1s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        )}
      </div>

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
