import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, Trash2, Type, Image as ImageIcon, Square, Circle, Minus, ChevronDown, ChevronRight } from 'lucide-react';
import { useHookStore } from '../context/HookContext';

const TYPE_ICON = {
  text:    <Type size={11} strokeWidth={2} />,
  image:   <ImageIcon size={11} strokeWidth={2} />,
  rect:    <Square size={11} strokeWidth={2} />,
  circle:  <Circle size={11} strokeWidth={2} />,
  line:    <Minus size={11} strokeWidth={2} />,
  star:    <span style={{ fontSize: 10, lineHeight: 1 }}>★</span>,
  arrow:   <span style={{ fontSize: 10, lineHeight: 1 }}>→</span>,
  diamond: <span style={{ fontSize: 10, lineHeight: 1 }}>◆</span>,
  hexagon: <span style={{ fontSize: 10, lineHeight: 1 }}>⬡</span>,
  chevron: <span style={{ fontSize: 10, lineHeight: 1 }}>›</span>,
  cross:   <span style={{ fontSize: 10, lineHeight: 1 }}>✕</span>,
};

const SHAPE_PRESETS = [
  { label: 'Highlight',    shape: 'rect',    width: 80, height: 11, fill: '#FFE400', fillOpacity: 0.28, hasStroke: false, borderRadius: 4,   name: 'Highlight'   },
  { label: 'Pill',         shape: 'rect',    width: 42, height: 9,  fill: '#6366f1', fillOpacity: 0.9,  hasStroke: false, borderRadius: 999,  name: 'Pill'        },
  { label: 'Underline',    shape: 'line',    width: 40, height: 3,  fill: '#6366f1', fillOpacity: 1,    hasStroke: false,                     name: 'Underline'   },
  { label: 'Outline Pill', shape: 'rect',    width: 42, height: 9,  fill: '#000000', fillOpacity: 0,    hasStroke: true,  strokeColor: '#ffffff', strokeWidth: 2, borderRadius: 999, name: 'Outline Pill' },
  { label: 'Ring',         shape: 'circle',  width: 22, height: 22, fill: '#000000', fillOpacity: 0,    hasStroke: true,  strokeColor: '#6366f1', strokeWidth: 3, name: 'Ring' },
  { label: 'Star',         shape: 'star',    width: 15, height: 15, fill: '#FFE400', fillOpacity: 1,    hasStroke: false,                     name: 'Star'        },
  { label: 'Arrow',        shape: 'arrow',   width: 28, height: 10, fill: '#ffffff', fillOpacity: 1,    hasStroke: false,                     name: 'Arrow'       },
  { label: 'Diamond',      shape: 'diamond', width: 13, height: 13, fill: '#6366f1', fillOpacity: 0.9,  hasStroke: false,                     name: 'Diamond'     },
  { label: 'Hexagon',      shape: 'hexagon', width: 18, height: 16, fill: '#6366f1', fillOpacity: 0.85, hasStroke: false,                     name: 'Hexagon'     },
  { label: 'Chevron',      shape: 'chevron', width: 16, height: 12, fill: '#ffffff', fillOpacity: 0.9,  hasStroke: false,                     name: 'Chevron'     },
  { label: 'Cross',        shape: 'cross',   width: 12, height: 12, fill: '#ffffff', fillOpacity: 0.8,  hasStroke: false,                     name: 'Cross'       },
  { label: 'Divider',      shape: 'line',    width: 80, height: 1,  fill: '#ffffff', fillOpacity: 0.2,  hasStroke: false,                     name: 'Divider'     },
];

export default function LayerPanel() {
  const [presetsOpen, setPresetsOpen] = useState(true);
  const {
    hookConfig, setHookConfig,
    selectedTextId, setSelectedTextId, setSelectedTextIds,
    selectedLayerId, setSelectedLayerId,
    selectedLayerType, setSelectedLayerType,
    addShapeLayer,
  } = useHookStore();

  const { texts = [], images = [], shapes = [] } = hookConfig;

  const allLayers = [
    ...images.map((l) => ({ ...l, _type: 'image' })),
    ...shapes.map((l) => ({ ...l, _type: 'shape' })),
    ...texts.map((l)  => ({ ...l, _type: 'text' })),
  ];

  const isSelected = (layer) =>
    layer._type === 'text'
      ? selectedTextId === layer.id
      : selectedLayerId === layer.id && selectedLayerType === layer._type;

  const handleSelect = (layer) => {
    if (layer._type === 'text') {
      setSelectedTextId(layer.id); setSelectedTextIds([layer.id]);
      setSelectedLayerId(layer.id); setSelectedLayerType('text');
    } else {
      setSelectedLayerId(layer.id); setSelectedLayerType(layer._type);
      setSelectedTextId(null); setSelectedTextIds([]);
    }
  };

  const patchLayer = (type, id, patch, e) => {
    e?.stopPropagation();
    const key = type === 'text' ? 'texts' : type === 'image' ? 'images' : 'shapes';
    setHookConfig((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).map((l) => l.id === id ? { ...l, ...patch } : l),
    }));
  };

  const removeLayer = (type, id, e) => {
    e?.stopPropagation();
    const key = type === 'text' ? 'texts' : type === 'image' ? 'images' : 'shapes';
    setHookConfig((prev) => ({ ...prev, [key]: (prev[key] ?? []).filter((l) => l.id !== id) }));
    if (type === 'text') { setSelectedTextId(null); setSelectedTextIds([]); }
    else if (selectedLayerId === id) { setSelectedLayerId(null); setSelectedLayerType(null); }
  };

  const getLabel = (layer) => {
    if (layer._type === 'text')  return (layer.content || 'Text').slice(0, 26);
    if (layer._type === 'image') return layer.name || 'Image';
    return layer.name || ({ rect: 'Rectangle', circle: 'Ellipse', line: 'Line', star: 'Star', arrow: 'Arrow', diamond: 'Diamond', hexagon: 'Hexagon', chevron: 'Chevron', cross: 'Cross' }[layer.shape] ?? 'Shape');
  };

  const getIcon = (layer) => {
    if (layer._type === 'text')  return TYPE_ICON.text;
    if (layer._type === 'image') return TYPE_ICON.image;
    return TYPE_ICON[layer.shape] ?? TYPE_ICON.rect;
  };

  return (
    <div style={{ paddingBottom: 12 }}>
      {/* Shape presets */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => setPresetsOpen(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}
        >
          <span>Shape Presets</span>
          {presetsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        {presetsOpen && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6, padding: '0 10px 12px',
          }}>
            {SHAPE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => addShapeLayer(preset.shape, preset)}
                title={`Add ${preset.label}`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  padding: '8px 6px', borderRadius: 8, cursor: 'pointer',
                  background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)',
                  transition: 'border-color 0.12s, background 0.12s',
                  color: 'var(--text-secondary)', fontSize: 10, fontWeight: 500,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-overlay)'; }}
              >
                <ShapePreview preset={preset} />
                <span style={{ fontSize: 9, letterSpacing: '0.02em' }}>{preset.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Layer list */}
      {allLayers.length === 0 ? (
        <div style={{ padding: '20px 16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>No layers yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.5 }}>
            Use presets above, press <strong>T</strong> for text,<br/>or use the toolbar for images.
          </p>
        </div>
      ) : (
        <div style={{ padding: '8px 0' }}>
          {[...allLayers].reverse().map((layer) => {
            const sel = isSelected(layer);
            return (
              <div
                key={layer.id}
                onClick={() => handleSelect(layer)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 12px', margin: '1px 8px', borderRadius: 7,
                  background: sel ? 'rgba(99,102,241,0.15)' : 'transparent',
                  border: `1px solid ${sel ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                  cursor: 'pointer', transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ color: 'var(--text-muted)', width: 14, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {getIcon(layer)}
                </span>
                {layer._type === 'text' && (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: layer.fill ?? '#fff', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }} />
                )}
                <span style={{
                  flex: 1, fontSize: 12, fontWeight: sel ? 600 : 400,
                  color: layer.hidden ? 'var(--text-muted)' : sel ? '#a5b4fc' : 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontStyle: layer.hidden ? 'italic' : 'normal', textTransform: 'none',
                }}>
                  {getLabel(layer)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={(e) => patchLayer(layer._type, layer.id, { hidden: !layer.hidden }, e)}
                    title={layer.hidden ? 'Show' : 'Hide'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', borderRadius: 4, display: 'flex', alignItems: 'center', color: layer.hidden ? '#6366f1' : 'var(--text-muted)' }}>
                    {layer.hidden ? <EyeOff size={11} /> : <Eye size={11} />}
                  </button>
                  <button onClick={(e) => patchLayer(layer._type, layer.id, { locked: !layer.locked }, e)}
                    title={layer.locked ? 'Unlock' : 'Lock'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', borderRadius: 4, display: 'flex', alignItems: 'center', color: layer.locked ? '#fbbf24' : 'var(--text-muted)' }}>
                    {layer.locked ? <Lock size={11} /> : <Unlock size={11} />}
                  </button>
                  <button onClick={(e) => removeLayer(layer._type, layer.id, e)}
                    title="Delete"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', borderRadius: 4, display: 'flex', alignItems: 'center', color: 'var(--text-muted)', transition: 'color 0.1s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Mini preview of the shape preset
function ShapePreview({ preset }) {
  const SVG_PATHS = {
    star:    'M50,5 L61,35 L95,35 L68,57 L79,91 L50,70 L21,91 L32,57 L5,35 L39,35 Z',
    arrow:   'M5,35 L65,35 L65,15 L95,50 L65,85 L65,65 L5,65 Z',
    diamond: 'M50,5 L95,50 L50,95 L5,50 Z',
    hexagon: 'M25,5 L75,5 L100,50 L75,95 L25,95 L0,50 Z',
    chevron: 'M5,5 L70,50 L5,95 L20,95 L85,50 L20,5 Z',
    cross:   'M35,0 L65,0 L65,35 L100,35 L100,65 L65,65 L65,100 L35,100 L35,65 L0,65 L0,35 L35,35 Z',
  };

  const fillHex   = preset.fill ?? '#6366f1';
  const fillOp    = preset.fillOpacity ?? 0.85;
  const isLine    = preset.shape === 'line';
  const isSvgShape = !!SVG_PATHS[preset.shape];

  const baseStyle = {
    width: 36, height: isLine ? 3 : 20,
    borderRadius: preset.shape === 'circle' ? '50%' : isLine ? 0 : `${Math.min(preset.borderRadius ?? 8, 10)}px`,
  };

  if (isSvgShape) {
    return (
      <svg viewBox="0 0 100 100" style={{ width: 28, height: 20, display: 'block', overflow: 'visible' }} preserveAspectRatio="xMidYMid meet">
        <path d={SVG_PATHS[preset.shape]} fill={fillHex} fillOpacity={fillOp}
          stroke={preset.hasStroke ? (preset.strokeColor ?? '#ffffff') : 'none'}
          strokeWidth={preset.hasStroke ? 4 : 0} />
      </svg>
    );
  }

  const r = parseInt(fillHex.slice(1,3)||'99',16);
  const g = parseInt(fillHex.slice(3,5)||'66',16);
  const b = parseInt(fillHex.slice(5,7)||'f1',16);

  return (
    <div style={{
      ...baseStyle,
      background: `rgba(${r},${g},${b},${fillOp})`,
      border: preset.hasStroke ? `2px solid ${preset.strokeColor ?? '#fff'}` : 'none',
    }} />
  );
}
