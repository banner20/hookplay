import React, { useEffect, useMemo, useState } from 'react';
import { PRESET_META, useHookStore } from '../context/HookContext';
import {
  BookmarkCheck,
  BookmarkPlus,
  ChevronRight,
  House,
  LayoutGrid,
  Layers,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';

function Label({ children }) {
  return <span className="ctrl-label">{children}</span>;
}

function SectionLabel({ children }) {
  return <p className="ctrl-section-label">{children}</p>;
}

function Divider() {
  return <div className="ctrl-divider" />;
}

function CtrlInput({ label, ...props }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <input className="ctrl-input" {...props} />
    </div>
  );
}

function CtrlSelect({ label, children, ...props }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <select className="ctrl-select" {...props}>{children}</select>
    </div>
  );
}

function Slider({ label, value, min, max, step = 0.1, unit = '', onChange }) {
  return (
    <div className="slider-wrapper">
      <div className="slider-header">
        <Label>{label}</Label>
        <span className="slider-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

function ColorSwatch({ value, onChange }) {
  return (
    <div className="color-swatch" style={{ background: value }}>
      <div className="color-swatch-preview" style={{ background: value }} />
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function PresetCard({ preset, active, onClick, onDelete }) {
  const meta = PRESET_META[preset.id] ?? {
    label: preset.name,
    desc: preset.description,
    accent: preset.accent,
  };
  const previewWidths = [70, 100, 55];

  return (
    <button
      className={`preset-card ${active ? 'active' : ''}`}
      style={{ '--card-accent': meta.accent }}
      onClick={() => onClick(preset.id)}
    >
      <div className="preset-card-preview">
        {previewWidths.map((width, index) => (
          <div
            key={index}
            className="preset-preview-line"
            style={{ width: width * 0.36, background: meta.accent }}
          />
        ))}
      </div>
      {!preset.isBuiltIn && (
        <span
          onClick={(event) => {
            event.stopPropagation();
            onDelete(preset.id);
          }}
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            width: 22,
            height: 22,
            borderRadius: 999,
            border: '1px solid var(--border-subtle)',
            background: 'rgba(0,0,0,0.28)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <Trash2 size={11} />
        </span>
      )}
      <span className="preset-card-name">{meta.label}</span>
      <span className="preset-card-desc">{preset.category} · {meta.desc}</span>
    </button>
  );
}

// Flat list of all curves for per-layer picker
const ALL_CURVES = [
  'Ease Out Smooth', 'Ease Out Expo', 'Pop', 'Soft Float',
  'Spring Stiff', 'Spring Soft', 'Overshoot', 'Elastic',
  'Bounce Light', 'No Overshoot', 'Linear',
];

function LayerCurvePicker({ value, onChange, accent = '#6366f1' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {/* Big preview of selected curve */}
      {value && (
        <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CurvePreviewSVG curveName={value} color={accent} width={100} height={38} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>{value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Layer easing</div>
          </div>
        </div>
      )}
      {/* Grid of options */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {/* 'Auto/global' option */}
        <button
          className={`curve-btn ${!value ? 'active' : ''}`}
          onClick={() => onChange(null)}
          title="Use global curve"
        >
          <span style={{ fontSize: 13, lineHeight: 1 }}>⚙️</span>
          <span style={{ fontSize: 8, lineHeight: 1.2 }}>Global</span>
        </button>
        {ALL_CURVES.map((c) => (
          <button
            key={c}
            className={`curve-btn ${value === c ? 'active' : ''}`}
            onClick={() => onChange(c)}
            title={c}
          >
            <CurvePreviewSVG
              curveName={c}
              color={value === c ? accent : 'rgba(255,255,255,0.25)'}
              width={48}
              height={22}
            />
            <span style={{ fontSize: 8, lineHeight: 1.2, letterSpacing: '0.01em', marginTop: 1 }}>{c}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function LayerCard({ text, expanded, onToggle, onUpdate, onDelete }) {
  const { hookConfig } = useHookStore();
  const isPunch = text.type === 'punch';

  return (
    <div className={`layer-card ${expanded ? 'selected' : ''}`}>
      <div className="layer-card-header" onClick={onToggle}>
        <div className="layer-dot" style={{ background: text.fill, border: `1px solid ${text.fill === '#ffffff' ? '#555' : 'transparent'}` }} />
        <span className="layer-content-text">{text.content || 'Empty layer'}</span>
        <span className={`layer-type-badge ${isPunch ? 'punch' : ''}`}>
          {text.role || (isPunch ? 'headline' : 'support')}
        </span>
        <button
          className="layer-delete-btn"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(text.id);
          }}
        >
          <Trash2 size={13} />
        </button>
        <ChevronRight size={13} className={`layer-chevron ${expanded ? 'open' : ''}`} />
      </div>

      {expanded && (
        <div className="layer-card-body">
          <div>
            <Label>Text content</Label>
            <input
              className="ctrl-input"
              value={text.content}
              onChange={(event) => onUpdate(text.id, 'content', event.target.value)}
              placeholder="Enter text..."
            />
          </div>

          <div className="row-2">
            <CtrlSelect
              label="Font"
              value={text.font}
              onChange={(event) => onUpdate(text.id, 'font', event.target.value)}
            >
              <option value="Inter">Inter</option>
              <option value="Outfit">Outfit</option>
              <option value="Cormorant Garamond">Cormorant Garamond</option>
            </CtrlSelect>
            <CtrlSelect
              label="Type"
              value={text.type}
              onChange={(event) => onUpdate(text.id, 'type', event.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="punch">Punch</option>
            </CtrlSelect>
          </div>

          <div>
            <Label>Animation</Label>
            <AnimPicker
              value={text.animation}
              onChange={(val) => onUpdate(text.id, 'animation', val)}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Label>Easing curve{!text.curve ? ' (using global)' : ''}</Label>
              {text.curve && (
                <button
                  style={{ fontSize: 10, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => onUpdate(text.id, 'curve', null)}
                >
                  ↩ global
                </button>
              )}
            </div>
            <LayerCurvePicker
              value={text.curve}
              onChange={(val) => onUpdate(text.id, 'curve', val)}
              accent={text.fill && text.fill !== '#ffffff' ? text.fill : '#6366f1'}
            />
          </div>

          <div>
            <Label>Colors</Label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
                <ColorSwatch value={text.fill} onChange={(value) => onUpdate(text.id, 'fill', value)} />
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Fill</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
                <div className="color-swatch" style={{ background: text.stroke, opacity: text.hasStroke ? 1 : 0.35 }}>
                  <div className="color-swatch-preview" style={{ background: text.stroke }} />
                  <input type="color" value={text.stroke} onChange={(event) => onUpdate(text.id, 'stroke', event.target.value)} />
                </div>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Stroke</span>
              </div>

              <label className="toggle-row" style={{ marginLeft: 2 }}>
                <input
                  type="checkbox"
                  checked={text.hasStroke}
                  onChange={(event) => onUpdate(text.id, 'hasStroke', event.target.checked)}
                />
                <span>Stroke on</span>
              </label>

              {text.hasStroke && (
                <div style={{ marginLeft: 'auto' }}>
                  <input
                    className="ctrl-input"
                    type="number"
                    value={text.strokeWidth}
                    min={1}
                    max={10}
                    onChange={(event) => onUpdate(text.id, 'strokeWidth', parseInt(event.target.value, 10) || 1)}
                    style={{ width: 52, textAlign: 'center' }}
                    title="Stroke width"
                  />
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
              <div className="color-swatch" style={{ background: text.bgColor === 'transparent' ? '#1c1c28' : text.bgColor, border: text.bgColor === 'transparent' ? '1px dashed var(--border-strong)' : 'none' }}>
                {text.bgColor !== 'transparent' && (
                  <div className="color-swatch-preview" style={{ background: text.bgColor }} />
                )}
                <input
                  type="color"
                  value="#000000"
                  onChange={(event) => onUpdate(text.id, 'bgColor', event.target.value)}
                />
              </div>
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>BG</span>
            </div>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={text.bgColor !== 'transparent'}
                onChange={(event) => onUpdate(text.id, 'bgColor', event.target.checked ? '#000000' : 'transparent')}
              />
              <span>Background pill</span>
            </label>
          </div>

          <Divider />
          
          <div>
            <Label>Timing</Label>
            <div className="row-2">
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Entry (s)</span>
                <input
                  className="ctrl-input"
                  type="number"
                  step={0.1}
                  min={0}
                  max={hookConfig.timing.duration - 0.1}
                  value={text.entryTime ?? 0}
                  onChange={(e) => onUpdate(text.id, 'entryTime', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Duration (s)</span>
                <input
                  className="ctrl-input"
                  type="number"
                  step={0.1}
                  min={0.1}
                  max={hookConfig.timing.duration}
                  value={text.duration ?? (hookConfig.timing.duration - (text.entryTime ?? 0))}
                  onChange={(e) => onUpdate(text.id, 'duration', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          <Divider />
          <div className="row-3">
            <CtrlInput
              label="X %"
              type="number"
              value={text.x}
              min={0}
              max={100}
              onChange={(event) => onUpdate(text.id, 'x', parseFloat(event.target.value))}
            />
            <CtrlInput
              label="Y %"
              type="number"
              value={text.y}
              min={0}
              max={100}
              onChange={(event) => onUpdate(text.id, 'y', parseFloat(event.target.value))}
            />
            <CtrlInput
              label="Size"
              type="number"
              value={text.fontSize}
              min={8}
              max={120}
              onChange={(event) => onUpdate(text.id, 'fontSize', parseInt(event.target.value, 10))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const CURVES = {
  entry: [
    'Ease Out Smooth',
    'Ease Out Expo',
    'Pop',
    'Soft Float',
    'Spring Stiff',
    'Spring Soft',
    'Overshoot',
    'Linear',
  ],
  emphasis: [
    'Pop',
    'Elastic',
    'Bounce Light',
    'No Overshoot',
    'Spring Stiff',
    'Overshoot',
    'Ease Out Expo',
    'Linear',
  ],
};

// Bezier control points for visual preview
const CURVE_BEZIER = {
  'Ease Out Smooth':  [[0, 0], [0.25, 0.1], [0.25, 1],  [1, 1]],
  'Ease Out Expo':    [[0, 0], [0.16, 1],   [0.3, 1],   [1, 1]],
  'Pop':              [[0, 0], [0.2, 1.4],  [0.6, 1.1], [1, 1]],
  'Elastic':          [[0, 0], [0.1, 1.8],  [0.5, 0.9], [1, 1]],
  'Bounce Light':     [[0, 0], [0.2, 1.6],  [0.7, 0.95],[1, 1]],
  'Soft Float':       [[0, 0], [0.4, 0],    [0.6, 1],   [1, 1]],
  'Ease In':          [[0, 0], [0.42, 0],   [1, 1],     [1, 1]],
  'No Overshoot':     [[0, 0], [0, 0.5],    [0.5, 1],   [1, 1]],
  'Spring Stiff':     [[0, 0], [0.1, 1.3],  [0.4, 1.05],[1, 1]],
  'Spring Soft':      [[0, 0], [0.3, 0.8],  [0.7, 1],   [1, 1]],
  'Overshoot':        [[0, 0], [0.15, 1.6], [0.5, 0.85],[1, 1]],
  'Linear':           [[0, 0], [0.33, 0.33],[0.66, 0.66],[1, 1]],
};

function CurvePreviewSVG({ curveName, color = '#6366f1', width = 56, height = 32 }) {
  const pts = CURVE_BEZIER[curveName];
  if (!pts) return null;
  const pad = 4;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const toX = (v) => pad + v * w;
  const toY = (v) => pad + (1 - Math.max(0, Math.min(1.8, v))) / 1.8 * h;

  // Sample 40 points along the cubic bezier
  const [p0, p1, p2, p3] = pts;
  const samples = Array.from({ length: 40 }, (_, i) => {
    const t = i / 39;
    const mt = 1 - t;
    const x = mt**3*p0[0] + 3*mt**2*t*p1[0] + 3*mt*t**2*p2[0] + t**3*p3[0];
    const y = mt**3*p0[1] + 3*mt**2*t*p1[1] + 3*mt*t**2*p2[1] + t**3*p3[1];
    return `${toX(x)},${toY(y)}`;
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {/* grid lines */}
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
      {/* curve */}
      <polyline
        points={samples.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {/* end dot */}
      <circle cx={toX(1)} cy={toY(1)} r="2.5" fill={color} />
    </svg>
  );
}

const LAYER_ANIMS = [
  { id: null,           label: 'Auto',       icon: '⚡' },
  { id: 'slam',         label: 'Slam',       icon: '💥' },
  { id: 'rise',         label: 'Rise',       icon: '⬆️' },
  { id: 'rise-down',    label: 'Drop',       icon: '⬇️' },
  { id: 'drift-up',     label: 'Drift',      icon: '🌊' },
  { id: 'fade-up',      label: 'Fade Up',    icon: '🌅' },
  { id: 'pill-pop',     label: 'Pill Pop',   icon: '🔘' },
  { id: 'counter-slam', label: 'Counter',    icon: '🎯' },
  { id: 'zoom-spin',    label: 'Zoom',       icon: '🔍' },
  { id: 'blur-in',      label: 'Blur In',    icon: '✨' },
  { id: 'slide-left',   label: 'Slide ←',    icon: '◀️' },
  { id: 'slide-right',  label: 'Slide →',    icon: '▶️' },
  { id: 'flip-x',       label: 'Flip X',     icon: '🔄' },
  { id: 'flip-y',       label: 'Flip Y',     icon: '↕️' },
  { id: 'expand',       label: 'Expand',     icon: '↔️' },
  { id: 'typewriter',   label: 'Type',       icon: '⌨️' },
  { id: 'wave',         label: 'Wave',       icon: '🌊' },
  { id: 'scramble',     label: 'Scramble',   icon: '🎲' },
  { id: 'glitch',       label: 'Glitch',     icon: '⚡' },
];

function AnimPicker({ value, onChange }) {
  return (
    <div className="anim-grid">
      {LAYER_ANIMS.map((anim) => (
        <button
          key={String(anim.id)}
          className={`anim-btn ${(value ?? null) === anim.id ? 'active' : ''}`}
          onClick={() => onChange(anim.id)}
          title={anim.label}
        >
          <span className="anim-btn-icon">{anim.icon}</span>
          {anim.label}
        </button>
      ))}
    </div>
  );
}

function CurveSelector({ label, value, options, onChange, accentColor = '#6366f1' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Live visualizer for selected curve */}
      <div className="curve-visualizer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="curve-visualizer-label">{label || 'Curve'}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: accentColor }}>{value}</span>
        </div>
        <div className="curve-canvas-wrap">
          <CurvePreviewSVG
            curveName={value}
            color={accentColor}
            width={280}
            height={72}
          />
        </div>
      </div>
      {/* Grid of curve options */}
      <div className="curve-grid">
        {options.map((option) => (
          <button
            key={option}
            className={`curve-btn ${value === option ? 'active' : ''}`}
            onClick={() => onChange(option)}
          >
            <CurvePreviewSVG curveName={option} color={value === option ? accentColor : 'rgba(255,255,255,0.2)'} width={56} height={28} />
            <span style={{ fontSize: 9, letterSpacing: '0.02em', lineHeight: 1.2 }}>{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const TABS = [
  { id: 'start',     label: 'Start',     icon: House },
  { id: 'generator', label: 'Generator', icon: Sparkles },
  { id: 'templates', label: 'Templates', icon: LayoutGrid },
  { id: 'layers',    label: 'Layers',    icon: Layers },
  { id: 'motion',    label: 'Motion',    icon: Wand2 },
];

function StartPanel() {
  const { presetLibrary, applyPreset, createBlankHook } = useHookStore();
  const featuredPresets = presetLibrary.slice(0, 6);

  return (
    <div className="tab-panel">
      <div className="ctrl-section">
        <SectionLabel>Start a hook</SectionLabel>
        <div style={{ padding: 14, background: 'var(--bg-overlay)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <strong style={{ fontSize: 15 }}>Choose how you want to begin</strong>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Start blank and add layers manually, or jump into one of the hook systems below.
          </p>
          <button className="btn-primary" onClick={createBlankHook}>
            <Plus size={14} />
            Start blank composer
          </button>
        </div>
      </div>

      <Divider />

      <div className="ctrl-section">
        <SectionLabel>Featured presets</SectionLabel>
        <div className="preset-grid">
          {featuredPresets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              active={false}
              onClick={applyPreset}
              onDelete={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplatesPanel() {
  const {
    hookConfig,
    setHookConfig,
    applyPreset,
    video,
    setVideo,
    presetLibrary,
    activePresetId,
    saveCurrentAsPreset,
    updateCurrentPreset,
    resetActivePreset,
    deletePreset,
  } = useHookStore();

  const groupedPresets = useMemo(() => (
    presetLibrary.reduce((acc, preset) => {
      const key = preset.category || 'Other';
      acc[key] = [...(acc[key] || []), preset];
      return acc;
    }, {})
  ), [presetLibrary]);

  const updatePresetField = (field, value) => {
    setHookConfig((prev) => ({ ...prev, [field]: value }));
  };

  const updateStructureField = (field, value) => {
    setHookConfig((prev) => ({
      ...prev,
      structure: {
        ...prev.structure,
        [field]: value,
      },
    }));
  };

  const updateSlot = (slotId, field, value) => {
    setHookConfig((prev) => ({
      ...prev,
      structure: {
        ...prev.structure,
        slots: (prev.structure?.slots || []).map((slot) => (
          slot.id === slotId ? { ...slot, [field]: value } : slot
        )),
      },
      texts: prev.texts.map((text) => (
        text.id === slotId && field === 'maxChars' ? { ...text, maxChars: value } : text
      )),
    }));
  };

  const snapLayout = () => {
    const alignment = hookConfig.layout?.alignment || 'center';
    const safeZone = hookConfig.layout?.safeZone || 'center-stack';
    const anchorX = alignment === 'left' ? 16 : alignment === 'right' ? 84 : 50;

    const zoneMap = {
      'upper-middle': { startY: 24, step: 19 },
      'center-stack': { startY: 30, step: 20 },
      'lower-third': { startY: 48, step: 16 },
      'top-banner': { startY: 18, step: 14 },
    };

    const zone = zoneMap[safeZone] || zoneMap['center-stack'];

    setHookConfig((prev) => ({
      ...prev,
      texts: prev.texts.map((text, index) => ({
        ...text,
        x: anchorX,
        y: Math.min(84, zone.startY + (zone.step * index)),
      })),
    }));
  };

  return (
    <div className="tab-panel">
      <div className="ctrl-section">
        <SectionLabel>Preset library</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Object.entries(groupedPresets).map(([category, presets]) => (
            <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Label>{category}</Label>
              <div className="preset-grid">
                {presets.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    active={activePresetId === preset.id}
                    onClick={applyPreset}
                    onDelete={deletePreset}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      <div className="ctrl-section">
        <SectionLabel>Preset studio</SectionLabel>
        <div className="row-2">
          <CtrlInput
            label="Preset name"
            value={hookConfig.name}
            onChange={(event) => updatePresetField('name', event.target.value)}
          />
          <CtrlInput
            label="Category"
            value={hookConfig.category}
            onChange={(event) => updatePresetField('category', event.target.value)}
          />
        </div>
        <div>
          <Label>Description</Label>
          <textarea
            className="ctrl-input"
            value={hookConfig.description}
            rows={3}
            onChange={(event) => updatePresetField('description', event.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>
        <CtrlInput
          label="Tags"
          value={(hookConfig.tags || []).join(', ')}
          onChange={(event) => updatePresetField(
            'tags',
            event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean),
          )}
        />
        <CtrlInput
          label="Pattern"
          value={hookConfig.structure?.pattern || ''}
          onChange={(event) => updateStructureField('pattern', event.target.value)}
        />
        <div className="row-2">
          <CtrlSelect
            label="Alignment"
            value={hookConfig.layout?.alignment || 'center'}
            onChange={(event) => setHookConfig((prev) => ({
              ...prev,
              layout: { ...prev.layout, alignment: event.target.value },
            }))}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </CtrlSelect>
          <CtrlSelect
            label="Safe zone"
            value={hookConfig.layout?.safeZone || 'center-stack'}
            onChange={(event) => setHookConfig((prev) => ({
              ...prev,
              layout: { ...prev.layout, safeZone: event.target.value },
            }))}
          >
            <option value="upper-middle">Upper middle</option>
            <option value="center-stack">Center stack</option>
            <option value="lower-third">Lower third</option>
            <option value="top-banner">Top banner</option>
          </CtrlSelect>
        </div>
        <div>
          <Label>Strategy note</Label>
          <textarea
            className="ctrl-input"
            value={hookConfig.structure?.strategy || ''}
            rows={3}
            onChange={(event) => updateStructureField('strategy', event.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>

      <div className="ctrl-section">
        <SectionLabel>Hook slots</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(hookConfig.structure?.slots || []).map((slot) => (
            <div key={slot.id} style={{ padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="row-2">
                <CtrlInput
                  label="Slot label"
                  value={slot.label}
                  onChange={(event) => updateSlot(slot.id, 'label', event.target.value)}
                />
                <CtrlInput
                  label="Max chars"
                  type="number"
                  value={slot.maxChars}
                  min={4}
                  max={80}
                  onChange={(event) => updateSlot(slot.id, 'maxChars', parseInt(event.target.value, 10) || 4)}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Role: {slot.role}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ctrl-section">
        <SectionLabel>Preset actions</SectionLabel>
        <button className="btn-secondary" onClick={snapLayout}>
          <LayoutGrid size={14} />
          Snap layers to layout
        </button>
        <button className="btn-secondary" onClick={() => saveCurrentAsPreset(hookConfig.name)}>
          <BookmarkPlus size={14} />
          Save as new custom preset
        </button>
        {!hookConfig.isBuiltIn && (
          <button className="btn-secondary" onClick={updateCurrentPreset}>
            <BookmarkCheck size={14} />
            Update current custom preset
          </button>
        )}
        <button className="btn-secondary" onClick={resetActivePreset}>
          <RotateCcw size={14} />
          Reset to preset defaults
        </button>
      </div>

      <Divider />

      <div className="ctrl-section">
        <SectionLabel>Canvas</SectionLabel>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={video.showPhoneFrame}
            onChange={(event) => setVideo((prev) => ({ ...prev, showPhoneFrame: event.target.checked }))}
          />
          <span>Show phone frame</span>
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={video.showSafeZones}
            onChange={(event) => setVideo((prev) => ({ ...prev, showSafeZones: event.target.checked }))}
          />
          <span>Show Instagram safe zones</span>
        </label>
      </div>
    </div>
  );
}

function GeneratorPanel() {
  const { hookConfig, setHookConfig } = useHookStore();
  const [inputs, setInputs] = useState({
    topic: '',
    audience: '',
    promise: '',
    pain: '',
    result: '',
    day: '5',
    count: '3',
  });

  const setInput = (field, value) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const fillTexts = (values) => {
    setHookConfig((prev) => ({
      ...prev,
      texts: prev.texts.map((text, index) => ({
        ...text,
        content: values[index] || text.content,
      })),
    }));
  };

  const generateForPreset = () => {
    const topic = inputs.topic || 'YOUR CONTENT';
    const audience = inputs.audience || 'YOUR AUDIENCE';
    const promise = inputs.promise || 'BETTER RESULTS';
    const pain = inputs.pain || 'SLOW GROWTH';
    const result = inputs.result || 'MORE RETENTION';
    const day = inputs.day || '5';
    const count = inputs.count || '3';

    switch (hookConfig.template) {
      case 'ARC_REVEAL':
        fillTexts([
          `DO NOT ${promise.toUpperCase()}`,
          `${topic.toUpperCase()}`,
        ]);
        break;
      case 'TASTE_STACK':
        fillTexts([
          promise.toUpperCase(),
          topic.toUpperCase(),
          result.toUpperCase(),
        ]);
        break;
      case 'SERIF_EDITORIAL':
        fillTexts([
          `${topic} ${result}`.toUpperCase(),
        ]);
        break;
      case 'RUM_STACK':
        fillTexts([
          topic.toUpperCase(),
          pain.toUpperCase(),
          result.toUpperCase(),
        ]);
        break;
      case 'INTERVIEW_SERIF':
        fillTexts([
          `${promise} TO THE ${topic}`.toUpperCase(),
        ]);
        break;
      case 'FOOLED_WORLD':
        fillTexts([
          `${topic.toUpperCase()} FOOLED`,
          `THE ENTIRE ${result.toUpperCase()}`,
        ]);
        break;
      case 'SERIES_DAY':
        fillTexts([
          topic.toUpperCase(),
          `DAY ${day}`,
          `AND I FINALLY GOT ${result.toUpperCase()}`,
        ]);
        break;
      case 'PRICE_SHOCK':
        fillTexts([
          `${topic.toUpperCase()} FOR`,
          promise.toUpperCase(),
          `FOR ${audience.toUpperCase()}`,
        ]);
        break;
      case 'CONTRAST':
        fillTexts([
          `TIRED OF ${pain.toUpperCase()}?`,
          `TRY THIS ${topic.toUpperCase()}`,
          `IF YOU WANT ${result.toUpperCase()}`,
        ]);
        break;
      case 'CURIOSITY':
        fillTexts([
          `NOBODY TELLS ${audience.toUpperCase()}`,
          `THIS ${topic.toUpperCase()}`,
          `UNTIL IT IS TOO LATE`,
        ]);
        break;
      case 'TRANSFORMATION':
        fillTexts([
          `BEFORE ${topic.toUpperCase()}`,
          'VS',
          `AFTER ${result.toUpperCase()}`,
        ]);
        break;
      case 'WARNING':
        fillTexts([
          'WARNING',
          `STOP ${pain.toUpperCase()}`,
          `IT KILLS ${result.toUpperCase()}`,
        ]);
        break;
      case 'LISTICLE':
        fillTexts([
          `${count} THINGS`,
          `TO GET ${result.toUpperCase()}`,
          `FOR ${audience.toUpperCase()}`,
        ]);
        break;
      case 'CONFESSION':
        fillTexts([
          `I ALMOST QUIT ${topic.toUpperCase()}`,
          `BECAUSE OF ${pain.toUpperCase()}`,
          `UNTIL I GOT ${result.toUpperCase()}`,
        ]);
        break;
      default:
        fillTexts([
          topic.toUpperCase(),
          promise.toUpperCase(),
          `FOR ${audience.toUpperCase()}`,
        ]);
        break;
    }
  };

  return (
    <div className="tab-panel">
      {!hookConfig.template && (
        <div className="ctrl-section">
          <SectionLabel>Generator locked</SectionLabel>
          <div style={{ padding: 14, background: 'var(--bg-overlay)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Select a preset first if you want guided hook generation, or switch to Layers and add your own text manually.
          </div>
        </div>
      )}
      <div className="ctrl-section">
        <SectionLabel>Hook generator</SectionLabel>
        <div style={{ padding: 12, background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <strong style={{ fontSize: 13 }}>{hookConfig.name}</strong>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Use a few structured inputs and generate copy straight into the active preset slots.
          </p>
        </div>
      </div>

      <div className="ctrl-section">
        <SectionLabel>Inputs</SectionLabel>
        <CtrlInput label="Topic" value={inputs.topic} onChange={(event) => setInput('topic', event.target.value)} />
        <CtrlInput label="Audience" value={inputs.audience} onChange={(event) => setInput('audience', event.target.value)} />
        <CtrlInput label="Promise" value={inputs.promise} onChange={(event) => setInput('promise', event.target.value)} />
        <CtrlInput label="Pain / objection" value={inputs.pain} onChange={(event) => setInput('pain', event.target.value)} />
        <CtrlInput label="Result / payoff" value={inputs.result} onChange={(event) => setInput('result', event.target.value)} />
        <div className="row-2">
          <CtrlInput label="Day number" value={inputs.day} onChange={(event) => setInput('day', event.target.value)} />
          <CtrlInput label="List count" value={inputs.count} onChange={(event) => setInput('count', event.target.value)} />
        </div>
        <button className="btn-primary" onClick={generateForPreset} disabled={!hookConfig.template}>
          <Sparkles size={14} />
          Generate hook copy
        </button>
      </div>

      <Divider />

      <div className="ctrl-section">
        <SectionLabel>Slot preview</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {hookConfig.texts.map((text) => (
            <div key={text.id} style={{ padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                {text.role}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{text.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LayersPanel() {
  const { hookConfig, setHookConfig, selectedTextId, setSelectedTextId } = useHookStore();
  const [expandedId, setExpandedId] = useState(null);

  // Auto-expand a layer when it becomes selected (e.g. placed via text tool)
  useEffect(() => {
    if (selectedTextId) setExpandedId(selectedTextId);
  }, [selectedTextId]);

  const updateText = (id, field, value) => {
    setHookConfig((prev) => ({
      ...prev,
      texts: prev.texts.map((text) => (text.id === id ? { ...text, [field]: value } : text)),
    }));
  };

  const addTextLine = () => {
    const newId = `layer_${Date.now()}`;
    setHookConfig((prev) => ({
      ...prev,
      texts: [...prev.texts, {
        id: newId,
        content: 'NEW TEXT',
        role: 'support',
        type: 'normal',
        font: 'Inter',
        fill: '#ffffff',
        hasStroke: false,
        stroke: '#000000',
        strokeWidth: 2,
        x: 50,
        y: 50,
        fontSize: 32,
        bgColor: 'transparent',
        maxChars: 24,
        animation: null,
        curve: null,
        entryTime: null,
        duration: null,
        letterSpacing: 0,
        lineHeight: 1,
        fontWeight: null,
        shape: 'line',
        radius: 160,
        arcSpread: 110,
      }],
    }));
    setExpandedId(newId);
  };

  const removeTextLine = (id) => {
    setHookConfig((prev) => ({
      ...prev,
      texts: prev.texts.filter((text) => text.id !== id),
    }));

    if (expandedId === id) setExpandedId(null);
    if (selectedTextId === id) setSelectedTextId(null);
  };

  return (
    <div className="tab-panel">
      <div className="ctrl-section">
        <SectionLabel>Text layers - drag on canvas to reposition</SectionLabel>
        <div className="layer-list">
          {hookConfig.texts.map((text) => (
            <LayerCard
              key={text.id}
              text={text}
              expanded={expandedId === text.id}
              onToggle={() => setExpandedId(expandedId === text.id ? null : text.id)}
              onUpdate={updateText}
              onDelete={removeTextLine}
            />
          ))}
        </div>
        <button className="btn-add-layer" onClick={addTextLine}>
          <Plus size={14} />
          Add text layer
        </button>
      </div>
    </div>
  );
}

function MotionPanel() {
  const { hookConfig, setHookConfig, video } = useHookStore();

  const updateTiming = (key, value) => {
    setHookConfig((prev) => ({
      ...prev,
      timing: { ...prev.timing, [key]: value },
    }));
  };

  const updateCurve = (key, value) => {
    setHookConfig((prev) => ({
      ...prev,
      curves: { ...prev.curves, [key]: value },
    }));
  };

  const updatePhase = (key, value) => {
    setHookConfig((prev) => ({
      ...prev,
      timing: {
        ...prev.timing,
        phases: {
          ...prev.timing.phases,
          [key]: value,
        },
      },
    }));
  };

  return (
    <div className="tab-panel">
      <div className="ctrl-section">
        <SectionLabel>Motion recipe</SectionLabel>
        <div style={{ padding: 12, background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <strong style={{ fontSize: 13 }}>{hookConfig.motionProfile?.style || 'Custom motion'}</strong>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Slot order: {(hookConfig.motionProfile?.slotOrder || []).join(' -> ') || 'Manual'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Stagger: {hookConfig.motionProfile?.stagger ?? 0}s
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Recipe: {Object.entries(hookConfig.motionProfile?.layerAnimations || {}).map(([role, animation]) => `${role}:${animation}`).join(' · ')}
          </p>
        </div>
      </div>

      <Divider />

      <div className="ctrl-section">
        <SectionLabel>Timing</SectionLabel>
        <Slider
          label="Start time"
          value={hookConfig.timing.startTime}
          min={0}
          max={video.duration > 0 ? video.duration : 60}
          step={0.1}
          unit="s"
          onChange={(value) => updateTiming('startTime', value)}
        />
        <Slider
          label="Duration"
          value={hookConfig.timing.duration}
          min={0.5}
          max={10}
          step={0.1}
          unit="s"
          onChange={(value) => updateTiming('duration', value)}
        />
      </div>

      <Divider />

      <div className="ctrl-section">
        <SectionLabel>Phase balance</SectionLabel>
        <Slider
          label="Entry"
          value={hookConfig.timing.phases.entry}
          min={5}
          max={60}
          step={1}
          unit="%"
          onChange={(value) => updatePhase('entry', value)}
        />
        <Slider
          label="Emphasis"
          value={hookConfig.timing.phases.emphasis}
          min={10}
          max={70}
          step={1}
          unit="%"
          onChange={(value) => updatePhase('emphasis', value)}
        />
        <Slider
          label="Hold"
          value={hookConfig.timing.phases.hold}
          min={5}
          max={50}
          step={1}
          unit="%"
          onChange={(value) => updatePhase('hold', value)}
        />
        <Slider
          label="Exit"
          value={hookConfig.timing.phases.exit}
          min={5}
          max={40}
          step={1}
          unit="%"
          onChange={(value) => updatePhase('exit', value)}
        />
      </div>

      <Divider />

      <div className="ctrl-section">
        <SectionLabel>Entry animation</SectionLabel>
        <CurveSelector
          label="Entry curve"
          value={hookConfig.curves.entry}
          options={CURVES.entry}
          onChange={(value) => updateCurve('entry', value)}
          accentColor="#6366f1"
        />
      </div>

      <Divider />

      <div className="ctrl-section">
        <SectionLabel>Punch / emphasis</SectionLabel>
        <CurveSelector
          label="Emphasis curve"
          value={hookConfig.curves.emphasis}
          options={CURVES.emphasis}
          onChange={(value) => updateCurve('emphasis', value)}
          accentColor="#f59e0b"
        />
      </div>
    </div>
  );
}

export default function ControlsPanel() {
  const { sidebarTab, setSidebarTab } = useHookStore();

  return (
    <>
      <nav className="sidebar-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`sidebar-tab ${sidebarTab === tab.id ? 'active' : ''}`}
              onClick={() => setSidebarTab(tab.id)}
            >
              <Icon size={12} strokeWidth={2.5} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {sidebarTab === 'start'     && <StartPanel />}
      {sidebarTab === 'generator' && <GeneratorPanel />}
      {sidebarTab === 'templates' && <TemplatesPanel />}
      {sidebarTab === 'layers'    && <LayersPanel />}
      {sidebarTab === 'motion'    && <MotionPanel />}
    </>
  );
}
