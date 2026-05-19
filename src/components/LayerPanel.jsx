import React from 'react';
import { Eye, EyeOff, Lock, Unlock, Trash2, Type, Image as ImageIcon, Square, Circle, Minus } from 'lucide-react';
import { useHookStore } from '../context/HookContext';

const TYPE_ICON = {
  text:   <Type size={11} strokeWidth={2} />,
  image:  <ImageIcon size={11} strokeWidth={2} />,
  rect:   <Square size={11} strokeWidth={2} />,
  circle: <Circle size={11} strokeWidth={2} />,
  line:   <Minus size={11} strokeWidth={2} />,
};

export default function LayerPanel() {
  const {
    hookConfig, setHookConfig,
    selectedTextId, setSelectedTextId, setSelectedTextIds,
    selectedLayerId, setSelectedLayerId,
    selectedLayerType, setSelectedLayerType,
  } = useHookStore();

  const { texts = [], images = [], shapes = [] } = hookConfig;

  const allLayers = [
    ...images.map((l) => ({ ...l, _type: 'image' })),
    ...shapes.map((l) => ({ ...l, _type: 'shape' })),
    ...texts.map((l)  => ({ ...l, _type: 'text' })),
  ];

  if (allLayers.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>No layers yet</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.5 }}>
          Use the <strong>T</strong> key to add text,<br/>or the toolbar to add images and shapes.
        </p>
      </div>
    );
  }

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
    else { setSelectedLayerId(null); setSelectedLayerType(null); }
  };

  const getLabel = (layer) => {
    if (layer._type === 'text')  return (layer.content || 'Text').slice(0, 26);
    if (layer._type === 'image') return layer.name || 'Image';
    return { rect: 'Rectangle', circle: 'Ellipse', line: 'Line' }[layer.shape] ?? 'Shape';
  };

  const getIcon = (layer) => {
    if (layer._type === 'text')  return TYPE_ICON.text;
    if (layer._type === 'image') return TYPE_ICON.image;
    return TYPE_ICON[layer.shape] ?? TYPE_ICON.rect;
  };

  return (
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
              onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => patchLayer(layer._type, layer.id, { hidden: !layer.hidden }, e)}
                title={layer.hidden ? 'Show layer' : 'Hide layer'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', borderRadius: 4, display: 'flex', alignItems: 'center', color: layer.hidden ? '#6366f1' : 'var(--text-muted)' }}>
                {layer.hidden ? <EyeOff size={11} /> : <Eye size={11} />}
              </button>
              <button
                onClick={(e) => patchLayer(layer._type, layer.id, { locked: !layer.locked }, e)}
                title={layer.locked ? 'Unlock' : 'Lock'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', borderRadius: 4, display: 'flex', alignItems: 'center', color: layer.locked ? '#fbbf24' : 'var(--text-muted)' }}>
                {layer.locked ? <Lock size={11} /> : <Unlock size={11} />}
              </button>
              <button
                onClick={(e) => removeLayer(layer._type, layer.id, e)}
                title="Delete layer"
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
  );
}
