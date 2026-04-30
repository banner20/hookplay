import React, { useEffect } from 'react';
import { MousePointer2, Type } from 'lucide-react';
import { useHookStore } from '../context/HookContext';

export default function CanvasToolbar() {
  const { activeTool, setActiveTool } = useHookStore();

  // Keyboard shortcuts: V = select, T = text
  useEffect(() => {
    const onKey = (e) => {
      // Don't fire when typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      if (e.key === 't' || e.key === 'T') setActiveTool('text');
      if (e.key === 'Escape') setActiveTool('select');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setActiveTool]);

  return (
    <div className="canvas-toolbar">
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
    </div>
  );
}
