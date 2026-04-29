import React, { useMemo, useState } from 'react';
import { PRESET_META, useHookStore } from '../context/HookContext';
import {
  BookmarkCheck,
  BookmarkPlus,
  ChevronRight,
  LayoutGrid,
  Layers,
  Plus,
  RotateCcw,
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

function LayerCard({ text, expanded, onToggle, onUpdate, onDelete }) {
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
  entry: ['Ease Out Smooth', 'Ease Out Expo', 'Pop', 'Soft Float'],
  emphasis: ['Pop', 'Elastic', 'Bounce Light', 'No Overshoot'],
};

function CurveSelector({ value, options, onChange }) {
  return (
    <div className="curve-grid">
      {options.map((option) => (
        <button
          key={option}
          className={`curve-btn ${value === option ? 'active' : ''}`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

const TABS = [
  { id: 'templates', label: 'Templates', icon: LayoutGrid },
  { id: 'layers', label: 'Layers', icon: Layers },
  { id: 'motion', label: 'Motion', icon: Wand2 },
];

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
            checked={video.showSafeZones}
            onChange={(event) => setVideo((prev) => ({ ...prev, showSafeZones: event.target.checked }))}
          />
          <span>Show Instagram safe zones</span>
        </label>
      </div>
    </div>
  );
}

function LayersPanel() {
  const { hookConfig, setHookConfig, selectedTextId, setSelectedTextId } = useHookStore();
  const [expandedId, setExpandedId] = useState(null);

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
          value={hookConfig.curves.entry}
          options={CURVES.entry}
          onChange={(value) => updateCurve('entry', value)}
        />
      </div>

      <Divider />

      <div className="ctrl-section">
        <SectionLabel>Punch / emphasis</SectionLabel>
        <CurveSelector
          value={hookConfig.curves.emphasis}
          options={CURVES.emphasis}
          onChange={(value) => updateCurve('emphasis', value)}
        />
      </div>
    </div>
  );
}

export default function ControlsPanel() {
  const [activeTab, setActiveTab] = useState('templates');

  return (
    <>
      <nav className="sidebar-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={12} strokeWidth={2.5} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === 'templates' && <TemplatesPanel />}
      {activeTab === 'layers' && <LayersPanel />}
      {activeTab === 'motion' && <MotionPanel />}
    </>
  );
}
