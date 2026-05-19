import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PRESET_META, useHookStore } from '../context/HookContext';
import {
  BookmarkCheck, BookmarkPlus, ChevronDown, ChevronRight,
  Download, Plus, RotateCcw, Sparkles, Trash2,
  Undo2, Eye, EyeOff, Copy, ArrowUp, ArrowDown, AlignLeft, AlignCenter, AlignRight,
  LayoutGrid, PenLine, Palette, Gauge, Mic, Layers,
} from 'lucide-react';
import TranscribePanel from './TranscribePanel';
import LayerPanel from './LayerPanel';

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function Label({ children }) {
  return <span className="ctrl-label">{children}</span>;
}

function SectionLabel({ children }) {
  return <p className="ctrl-section-label">{children}</p>;
}

function Divider() {
  return <div className="ctrl-divider" />;
}

function GroupHeader({ children }) {
  return <div className="ctrl-group-header">{children}</div>;
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
  const display = typeof value === 'number'
    ? (step < 1 ? value.toFixed(step < 0.1 ? 2 : 1) : Math.round(value))
    : value;
  return (
    <div className="slider-wrapper">
      <div className="slider-header">
        <Label>{label}</Label>
        <span className="slider-value">{display}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
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

function PillToggle({ checked, onChange, label }) {
  return (
    <label className={`pill-toggle ${checked ? 'on' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
      />
      <span className="pill-toggle-track">
        <span className="pill-toggle-thumb" />
      </span>
      {label && <span className="pill-toggle-label">{label}</span>}
    </label>
  );
}

// ─── Slot label resolver ──────────────────────────────────────────────────────
// Maps text layer id → human-readable slot label from preset structure.
// Falls back to role humanisation for custom layers.
const ROLE_LABELS = {
  eyebrow:  'Context',
  headline: 'Main',
  support:  'Body',
  cta:      'CTA',
};

function getLayerLabel(text, hookConfig) {
  const slot = hookConfig?.structure?.slots?.find((s) => s.id === text.id);
  if (slot?.label) return slot.label;
  return ROLE_LABELS[text.role] || (text.role
    ? text.role.charAt(0).toUpperCase() + text.role.slice(1)
    : 'Layer');
}

// ─── Brand kit ────────────────────────────────────────────────────────────────
const BRAND_KIT_KEY = 'hookforge.brand-kit.v1';

const defaultBrandKit = () => ({ colors: [], fonts: [] });

function loadBrandKit() {
  try { return JSON.parse(localStorage.getItem(BRAND_KIT_KEY)) || defaultBrandKit(); }
  catch { return defaultBrandKit(); }
}

function saveBrandKit(kit) {
  localStorage.setItem(BRAND_KIT_KEY, JSON.stringify(kit));
}

// ─── Step nav ─────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'transcribe', label: 'Auto',    Icon: Mic        },
  { id: 'preset',     label: 'Presets', Icon: LayoutGrid },
  { id: 'copy',       label: 'Copy',    Icon: PenLine    },
  { id: 'style',      label: 'Style',   Icon: Palette    },
  { id: 'motion',     label: 'Motion',  Icon: Gauge      },
  { id: 'layers',     label: 'Layers',  Icon: Layers     },
];

function StepNav({ step, setStep }) {
  return (
    <div className="sidebar-step-nav">
      {STEPS.map((s) => (
        <button
          key={s.id}
          className={`step-btn ${step === s.id ? 'active' : ''}`}
          onClick={() => setStep(s.id)}
        >
          <s.Icon size={14} strokeWidth={2} />
          <span className="step-label">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Preset card ──────────────────────────────────────────────────────────────

function PresetCard({ preset, active, onClick, onDelete }) {
  const meta = PRESET_META[preset.id] ?? {
    label: preset.name, desc: preset.description, accent: preset.accent,
  };

  // Build a compact styled text preview from the preset's actual text layers
  const previewLayers = (preset.texts || []).slice(0, 3);

  return (
    <button
      className={`preset-card ${active ? 'active' : ''}`}
      style={{ '--card-accent': meta.accent }}
      onClick={() => onClick(preset.id)}
    >
      {/* Live text preview */}
      <div className="preset-card-preview">
        {previewLayers.map((t) => {
          const isGrad = t.fillType === 'gradient';
          const gradStyle = isGrad ? {
            background: `linear-gradient(${t.gradientAngle ?? 135}deg, ${t.gradientFrom || t.fill}, ${t.gradientTo || '#fff'})`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          } : {};
          const scaledSize = Math.max(7, Math.min(13, (t.fontSize || 32) * 0.14));
          return (
            <span
              key={t.id}
              style={{
                display: 'block',
                fontFamily: t.font || 'Inter',
                fontSize: scaledSize,
                fontWeight: t.fontWeight ?? (t.type === 'punch' ? 900 : 700),
                letterSpacing: '-0.01em',
                lineHeight: 1.15,
                color: isGrad ? 'transparent' : t.fill,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 70,
                textShadow: t.hasStroke ? `0 0 3px #000` : undefined,
                ...gradStyle,
              }}
            >
              {(t.content || '').slice(0, 14)}
            </span>
          );
        })}
      </div>

      {!preset.isBuiltIn && (
        <span
          onClick={(e) => { e.stopPropagation(); onDelete(preset.id); }}
          style={{ position: 'absolute', top: 10, left: 10, width: 22, height: 22, borderRadius: 999, border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
        >
          <Trash2 size={11} />
        </span>
      )}
      <span className="preset-card-name">{meta.label}</span>
      <span className="preset-card-desc">{preset.category}</span>
    </button>
  );
}

// ─── Animation combos (simple named presets for normal users) ────────────────

const ANIMATION_COMBOS = [
  // ── Pure motion ──────────────────────────────────────────────────────────
  { id: 'slam',         label: 'Slam',        desc: 'Hard cut in',              animation: 'slam',           textEffect: null },
  { id: 'drift',        label: 'Drift',        desc: 'Float up gently',          animation: 'drift-up',       textEffect: null },
  { id: 'blur',         label: 'Blur',         desc: 'Focus in from soft',        animation: 'blur-in',        textEffect: null },
  { id: 'rise',         label: 'Rise',         desc: 'Drop from top',             animation: 'rise',           textEffect: null },
  { id: 'counter',      label: 'Counter',      desc: 'Slam with spin',            animation: 'counter-slam',   textEffect: null },
  { id: 'pop',          label: 'Pop',          desc: 'Pill bounce in',            animation: 'pill-pop',       textEffect: null },
  { id: 'wipe',         label: 'Wipe',         desc: 'Reveal left→right',         animation: 'wipe-right',     textEffect: null },
  { id: 'stamp',        label: 'Stamp',        desc: 'Scale-stamp in',            animation: 'stamp',          textEffect: null },
  { id: 'spin',         label: 'Spin',         desc: 'Zoom + rotate in',          animation: 'zoom-spin',      textEffect: null },
  { id: 'flip',         label: 'Flip',         desc: 'Flip in on X axis',         animation: 'flip-x',         textEffect: null },
  { id: 'slide',        label: 'Slide',        desc: 'Slide in from left',        animation: 'slide-left',     textEffect: null },
  { id: 'bounce',       label: 'Bounce',       desc: 'Drop + bounce settle',      animation: 'bounce-in',      textEffect: null },
  { id: 'shake',        label: 'Shake',        desc: 'Shake on entry',            animation: 'shake',          textEffect: null },
  { id: 'skew',         label: 'Skew',         desc: 'Skew slide in',             animation: 'skew-in',        textEffect: null },
  { id: 'expand',       label: 'Expand',       desc: 'Stretch open from center',  animation: 'expand',         textEffect: null },
  // ── Char-level effects ────────────────────────────────────────────────────
  { id: 'type',         label: 'Typewriter',   desc: 'Letter by letter',          animation: 'fade-up',        textEffect: 'typewriter' },
  { id: 'wave',         label: 'Wave',         desc: 'Letters ripple in',         animation: 'drift-up',       textEffect: 'wave' },
  { id: 'ghost',        label: 'Ghost',        desc: 'Blur in + scramble',        animation: 'blur-in',        textEffect: 'scramble' },
  { id: 'hacker',       label: 'Hacker',       desc: 'Slam + scramble',           animation: 'slam',           textEffect: 'scramble' },
  { id: 'glitch',       label: 'Glitch',       desc: 'Glitch slice in',           animation: 'slam',           textEffect: 'glitch' },
  { id: 'neon',         label: 'Neon',         desc: 'Neon tubes flickering on',  animation: 'neon-pulse',     textEffect: 'flicker' },
  { id: 'flicker-slam', label: 'Flash',        desc: 'Slam in + flicker letters', animation: 'slam',           textEffect: 'flicker' },
  { id: 'spring',       label: 'Spring',       desc: 'Letters spring-bounce in',  animation: 'pill-pop',       textEffect: 'char-bounce' },
  { id: 'drop-in',      label: 'Drop In',      desc: 'Each letter drops & lands', animation: 'bounce-in',      textEffect: 'char-bounce' },
  { id: 'cinema',       label: 'Cinema',       desc: 'Expand reveal + fade chars',animation: 'expand',         textEffect: 'fade-chars' },
  { id: 'fade-chars',   label: 'Fade Chars',   desc: 'Each letter floats in soft',animation: 'drift-up',       textEffect: 'fade-chars' },
  { id: 'blur-fade',    label: 'Blur Fade',    desc: 'Blur in + fade each char',  animation: 'blur-in',        textEffect: 'fade-chars' },
  // ── Combos ────────────────────────────────────────────────────────────────
  { id: 'rise-type',    label: 'Rise+Type',    desc: 'Rise + typewriter',         animation: 'rise',           textEffect: 'typewriter' },
  { id: 'blur-wave',    label: 'Blur+Wave',    desc: 'Blur in + wave letters',    animation: 'blur-in',        textEffect: 'wave' },
  { id: 'skew-wave',    label: 'Skew+Wave',    desc: 'Skew in + wave letters',    animation: 'skew-in',        textEffect: 'wave' },
  { id: 'glitch-shake', label: 'Glitch+Shake', desc: 'Shake entry + glitch text', animation: 'shake',          textEffect: 'glitch' },
  { id: 'spin-type',    label: 'Spin+Type',    desc: 'Zoom spin + typewriter',    animation: 'zoom-spin',      textEffect: 'typewriter' },
  { id: 'skew-scramble',label: 'Skew+Hack',    desc: 'Skew in + scramble',        animation: 'skew-in',        textEffect: 'scramble' },
  // ── New effects ────────────────────────────────────────────────────────────
  { id: 'rise-chars',   label: 'Rise Chars',   desc: 'Each letter rises from below', animation: 'fade-up',    textEffect: 'rise-chars' },
  { id: 'drop-chars',   label: 'Drop Chars',   desc: 'Letters rain in from above',   animation: 'rise',       textEffect: 'drop-chars' },
  { id: 'blur-chars',   label: 'Blur Chars',   desc: 'Each letter sharpens in',      animation: 'blur-in',    textEffect: 'blur-chars' },
  { id: 'pop-chars',    label: 'Pop Chars',    desc: 'Letters pop in with overshoot',animation: 'drift-up',   textEffect: 'pop-chars' },
  { id: 'stamp-chars',  label: 'Stamp Chars',  desc: 'Letters shrink-stamp per char',animation: 'slam',       textEffect: 'stamp-chars' },
  { id: 'slide-chars',  label: 'Slide Chars',  desc: 'Letters slide in from right',  animation: 'slide-right',textEffect: 'slide-chars' },
  { id: 'pendulum',     label: 'Pendulum',     desc: 'Letters swing in on a pivot',  animation: 'counter-slam',textEffect: 'swing' },
  { id: 'count-up',     label: 'Count Up',     desc: 'Numbers count up from zero',   animation: 'slam',       textEffect: 'count-up' },
];

// Resolve which combo best matches a layer's current animation + textEffect
function resolveComboId(animation, textEffect) {
  const match = ANIMATION_COMBOS.find(
    c => c.animation === animation && c.textEffect === (textEffect ?? null)
  );
  return match?.id ?? null;
}

function ComboPicker({ animation, textEffect, onChange }) {
  const activeId = resolveComboId(animation, textEffect);
  return (
    <div className="combo-grid">
      {ANIMATION_COMBOS.map((c) => (
        <button
          key={c.id}
          className={`combo-btn ${activeId === c.id ? 'active' : ''}`}
          onClick={() => onChange(c.animation, c.textEffect)}
          title={c.desc}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

// ─── Text effect picker (advanced section) ────────────────────────────────────

const TEXT_EFFECTS = [
  { id: null,           label: 'None'        },
  { id: 'typewriter',   label: 'Typewriter'  },
  { id: 'scramble',     label: 'Scramble'    },
  { id: 'wave',         label: 'Wave'        },
  { id: 'glitch',       label: 'Glitch'      },
  { id: 'flicker',      label: 'Flicker'     },
  { id: 'char-bounce',  label: 'Bounce'      },
  { id: 'fade-chars',   label: 'Fade Chars'  },
  { id: 'rise-chars',   label: 'Rise Chars'  },
  { id: 'drop-chars',   label: 'Drop Chars'  },
  { id: 'blur-chars',   label: 'Blur Chars'  },
  { id: 'pop-chars',    label: 'Pop Chars'   },
  { id: 'stamp-chars',  label: 'Stamp Chars' },
  { id: 'slide-chars',  label: 'Slide Chars' },
  { id: 'swing',        label: 'Swing'       },
  { id: 'count-up',     label: 'Count Up'    },
];

function TextEffectPicker({ value, onChange }) {
  return (
    <div className="anim-grid" style={{ marginTop: 4 }}>
      {TEXT_EFFECTS.map((e) => (
        <button
          key={String(e.id)}
          className={`anim-btn ${(value ?? null) === e.id ? 'active' : ''}`}
          onClick={() => onChange(e.id)}
        >
          {e.label}
        </button>
      ))}
    </div>
  );
}

// ─── Animation picker (raw motion — shown in Advanced section) ────────────────

const LAYER_ANIMS = [
  { id: null,                label: 'Auto'     },
  { id: 'slam',              label: 'Slam'     },
  { id: 'drift-up',          label: 'Drift'    },
  { id: 'fade-up',           label: 'Fade Up'  },
  { id: 'blur-in',           label: 'Blur In'  },
  { id: 'rise',              label: 'Rise'     },
  { id: 'rise-down',         label: 'Drop'     },
  { id: 'counter-slam',      label: 'Counter'  },
  { id: 'pill-pop',          label: 'Pop'      },
  { id: 'zoom-spin',         label: 'Zoom'     },
  { id: 'slide-left',        label: 'Slide ←'  },
  { id: 'slide-right',       label: 'Slide →'  },
  { id: 'flip-x',            label: 'Flip X'   },
  { id: 'flip-y',            label: 'Flip Y'   },
  { id: 'expand',            label: 'Expand'   },
  { id: 'typewriter',        label: 'Type'     },
  { id: 'wave',              label: 'Wave'     },
  { id: 'scramble',          label: 'Scramble' },
  { id: 'glitch',            label: 'Glitch'   },
  { id: 'shake',             label: 'Shake'    },
  { id: 'bounce-in',         label: 'Bounce'   },
  { id: 'perspective-slam',  label: 'Persp.'   },
  { id: 'stamp',             label: 'Stamp'    },
  { id: 'wipe-right',        label: 'Wipe'     },
  { id: 'skew-in',           label: 'Skew In'  },
  { id: 'neon-pulse',        label: 'Neon'     },
];

function AnimPicker({ value, onChange }) {
  return (
    <div className="anim-grid">
      {LAYER_ANIMS.map((anim) => (
        <button
          key={String(anim.id)}
          className={`anim-btn ${(value ?? null) === anim.id ? 'active' : ''}`}
          onClick={() => onChange(anim.id)}
        >
          {anim.label}
        </button>
      ))}
    </div>
  );
}

// ─── Curve visualizer ─────────────────────────────────────────────────────────

const CURVE_BEZIER = {
  'Ease Out Smooth': [[0,0],[0.25,0.1],[0.25,1],[1,1]],
  'Ease Out Expo':   [[0,0],[0.16,1],[0.3,1],[1,1]],
  'Pop':             [[0,0],[0.2,1.4],[0.6,1.1],[1,1]],
  'Elastic':         [[0,0],[0.1,1.8],[0.5,0.9],[1,1]],
  'Bounce Light':    [[0,0],[0.2,1.6],[0.7,0.95],[1,1]],
  'Soft Float':      [[0,0],[0.4,0],[0.6,1],[1,1]],
  'Ease In':         [[0,0],[0.42,0],[1,1],[1,1]],
  'No Overshoot':    [[0,0],[0,0.5],[0.5,1],[1,1]],
  'Spring Stiff':    [[0,0],[0.1,1.3],[0.4,1.05],[1,1]],
  'Spring Soft':     [[0,0],[0.3,0.8],[0.7,1],[1,1]],
  'Overshoot':       [[0,0],[0.15,1.6],[0.5,0.85],[1,1]],
  'Linear':          [[0,0],[0.33,0.33],[0.66,0.66],[1,1]],
};

function CurvePreviewSVG({ curveName, color = '#6366f1', width = 56, height = 32 }) {
  const pts = CURVE_BEZIER[curveName];
  if (!pts) return null;
  const pad = 4, w = width - pad * 2, h = height - pad * 2;
  const toX = (v) => pad + v * w;
  const toY = (v) => pad + (1 - Math.max(0, Math.min(1.8, v))) / 1.8 * h;
  const [p0, p1, p2, p3] = pts;
  const samples = Array.from({ length: 40 }, (_, i) => {
    const t = i / 39, mt = 1 - t;
    const x = mt**3*p0[0] + 3*mt**2*t*p1[0] + 3*mt*t**2*p2[0] + t**3*p3[0];
    const y = mt**3*p0[1] + 3*mt**2*t*p1[1] + 3*mt*t**2*p2[1] + t**3*p3[1];
    return `${toX(x)},${toY(y)}`;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
      <line x1={pad} y1={pad} x2={pad} y2={height-pad} stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
      <polyline points={samples.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <circle cx={toX(1)} cy={toY(1)} r="2.5" fill={color} />
    </svg>
  );
}

const ENTRY_CURVES    = ['Ease Out Smooth','Ease Out Expo','Pop','Soft Float','Spring Stiff','Spring Soft','Overshoot','Linear'];
const EMPHASIS_CURVES = ['Pop','Elastic','Bounce Light','No Overshoot','Spring Stiff','Overshoot','Ease Out Expo','Linear'];

function CurveSelector({ label, value, options, onChange, accentColor = '#6366f1' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="curve-visualizer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="curve-visualizer-label">{label}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: accentColor }}>{value}</span>
        </div>
        <div className="curve-canvas-wrap">
          <CurvePreviewSVG curveName={value} color={accentColor} width={280} height={72} />
        </div>
      </div>
      <div className="curve-grid">
        {options.map((option) => (
          <button key={option} className={`curve-btn ${value === option ? 'active' : ''}`} onClick={() => onChange(option)}>
            <CurvePreviewSVG curveName={option} color={value === option ? accentColor : 'rgba(255,255,255,0.2)'} width={56} height={28} />
            <span style={{ fontSize: 9, letterSpacing: '0.02em', lineHeight: 1.2 }}>{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Brand Kit ────────────────────────────────────────────────────────────────

function BrandKitSection() {
  const { hookConfig, setHookConfig, selectedTextId } = useHookStore();
  const [open, setOpen] = useState(false);
  const [kit, setKit] = React.useState(loadBrandKit);

  const persistKit = (next) => { setKit(next); saveBrandKit(next); };

  const activeText = hookConfig.texts.find((t) => t.id === selectedTextId) || hookConfig.texts[0];
  const currentColor = activeText?.fill || '#ffffff';
  const currentFont  = activeText?.font  || 'Inter';

  const addColor = (color) => {
    if (kit.colors.includes(color)) return;
    persistKit({ ...kit, colors: [...kit.colors.slice(-8), color] });
  };

  const applyColor = (color) => {
    if (!activeText) return;
    setHookConfig((p) => ({ ...p, texts: p.texts.map((t) => t.id === activeText.id ? { ...t, fill: color } : t) }));
  };

  const addFont = (font) => {
    if (kit.fonts.includes(font)) return;
    persistKit({ ...kit, fonts: [...kit.fonts.slice(-5), font] });
  };

  const applyFont = (font) => {
    if (!activeText) return;
    setHookConfig((p) => ({ ...p, texts: p.texts.map((t) => t.id === activeText.id ? { ...t, font } : t) }));
  };

  const ALL_FONTS = [
    'Inter','DM Sans','Plus Jakarta Sans','Outfit','Poppins','Montserrat','Raleway','Rubik','Space Grotesk',
    'Anton','Bebas Neue','Oswald','Barlow Condensed','League Spartan','Unbounded','Syne',
    'Playfair Display','Cormorant Garamond',
  ];

  return (
    <div className="brand-kit-section">
      <button className="brand-kit-toggle" onClick={() => setOpen((v) => !v)}>
        <span style={{ flex: 1 }}>Brand Kit</span>
        {(kit.colors.length > 0 || kit.fonts.length > 0) && (
          <span className="fx-presets-count">{kit.colors.length + kit.fonts.length}</span>
        )}
        <ChevronRight size={11} className={`layer-anim-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>

          {/* Saved colors */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <Label>Saved Colors</Label>
              {kit.colors.length > 0 && (
                <button
                  onClick={() => persistKit({ ...kit, colors: [] })}
                  style={{ fontSize: 9, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >Clear</button>
              )}
            </div>
            <div className="brand-palette">
              {kit.colors.map((c, i) => (
                <button
                  key={i}
                  className="brand-color-chip"
                  style={{ background: c, border: c === '#ffffff' ? '1px solid #444' : 'none' }}
                  onClick={() => applyColor(c)}
                  title={`Apply ${c} to active layer`}
                />
              ))}
              {/* Add current color */}
              <label className="brand-color-chip brand-color-add" title="Save current layer color to brand kit">
                <input
                  type="color"
                  value={currentColor}
                  onChange={() => {}}
                  onBlur={(e) => addColor(e.target.value)}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                />
                <span style={{ fontSize: 15, lineHeight: 1, color: 'var(--text-muted)', pointerEvents: 'none' }}>+</span>
              </label>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5 }}>Click a color to apply to active layer. + to save current.</p>
          </div>

          {/* Saved fonts */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <Label>Saved Fonts</Label>
              {kit.fonts.length > 0 && (
                <button
                  onClick={() => persistKit({ ...kit, fonts: [] })}
                  style={{ fontSize: 9, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >Clear</button>
              )}
            </div>
            {kit.fonts.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 7 }}>
                {kit.fonts.map((f) => (
                  <button
                    key={f}
                    onClick={() => applyFont(f)}
                    style={{
                      padding: '4px 10px', borderRadius: 99,
                      background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)',
                      fontSize: 11, fontFamily: f, color: 'var(--text-primary)', cursor: 'pointer',
                    }}
                    title={`Apply ${f}`}
                  >{f}</button>
                ))}
              </div>
            )}
            <select
              className="ctrl-select"
              style={{ fontSize: 11 }}
              value=""
              onChange={(e) => { if (e.target.value) addFont(e.target.value); }}
            >
              <option value="">+ Save a font…</option>
              {ALL_FONTS.filter((f) => !kit.fonts.includes(f)).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Visual font picker ───────────────────────────────────────────────────────

const FONT_GROUPS = [
  { label: 'Clean Sans-Serif', fonts: ['Inter','DM Sans','Plus Jakarta Sans','Outfit','Poppins','Montserrat','Raleway','Rubik','Space Grotesk'] },
  { label: 'Impact / Display',  fonts: ['Anton','Bebas Neue','Oswald','Barlow Condensed','League Spartan','Unbounded','Syne'] },
  { label: 'Serif / Editorial', fonts: ['Playfair Display','Cormorant Garamond'] },
];

function FontSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1 }}>
      <Label>Font</Label>
      <button
        className="font-select-trigger"
        onClick={() => setOpen((v) => !v)}
        style={{ fontFamily: `'${value}', sans-serif` }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{value}</span>
        <ChevronDown size={11} style={{ flexShrink: 0 }} />
      </button>

      {open && (
        <div className="font-select-dropdown">
          {FONT_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="font-select-group-label">{group.label}</div>
              {group.fonts.map((font) => (
                <button
                  key={font}
                  className={`font-select-option ${value === font ? 'active' : ''}`}
                  onClick={() => { onChange(font); setOpen(false); }}
                  style={{ fontFamily: `'${font}', sans-serif` }}
                >
                  {font}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 1: PICK ─────────────────────────────────────────────────────────────

function PickStep() {
  const {
    presetLibrary, activePresetId, applyPreset, createBlankHook,
    deletePreset, hookConfig, saveCurrentAsPreset, resetActivePreset, setSidebarTab,
  } = useHookStore();

  const grouped = useMemo(() => presetLibrary.reduce((acc, p) => {
    const cat = p.category || 'Other';
    (acc[cat] = acc[cat] || []).push(p);
    return acc;
  }, {}), [presetLibrary]);

  return (
    <div className="tab-panel">
      {activePresetId ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'var(--accent-primary-dim)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.3)', marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: hookConfig.accent, boxShadow: `0 0 8px ${hookConfig.accent}88`, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hookConfig.name}</span>
          <button onClick={resetActivePreset} title="Reset to preset defaults" style={{ color: 'var(--text-muted)', padding: 3 }}><RotateCcw size={12} /></button>
          {!hookConfig.isBuiltIn && (
            <button onClick={() => saveCurrentAsPreset(hookConfig.name)} title="Save changes" style={{ color: 'var(--text-muted)', padding: 3 }}><BookmarkCheck size={12} /></button>
          )}
        </div>
      ) : (
        <button className="btn-primary" onClick={() => { createBlankHook(); setSidebarTab('copy'); }}>
          <Plus size={14} /> Start blank hook
        </button>
      )}

      <Divider />

      {Object.entries(grouped).map(([category, presets]) => (
        <div key={category} className="ctrl-section">
          <SectionLabel>{category}</SectionLabel>
          <div className="preset-grid">
            {presets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                active={activePresetId === preset.id}
                onClick={(id) => { applyPreset(id); setSidebarTab('copy'); }}
                onDelete={deletePreset}
              />
            ))}
          </div>
        </div>
      ))}

      <Divider />
      <button className="btn-secondary" onClick={() => saveCurrentAsPreset(hookConfig.name + ' copy')}>
        <BookmarkPlus size={13} /> Save current as new preset
      </button>

      <Divider />
      <BrandKitSection />
    </div>
  );
}

// ─── Step 2: COPY ─────────────────────────────────────────────────────────────

function CopyStep() {
  const { hookConfig, setHookConfig, setSidebarTab, setSidebarTab: goTo } = useHookStore();
  const [showGen, setShowGen] = useState(false);
  const [genInputs, setGenInputs] = useState({
    topic: '', audience: '', promise: '', pain: '', result: '', day: '5', count: '3',
  });

  const updateContent = (id, val) =>
    setHookConfig((p) => ({ ...p, texts: p.texts.map((t) => t.id === id ? { ...t, content: val } : t) }));

  const addLayer = () => {
    const newId = `layer_${Date.now()}`;
    setHookConfig((p) => ({
      ...p,
      texts: [...p.texts, {
        id: newId, content: 'NEW TEXT', role: 'support', type: 'normal', font: 'Inter',
        fill: '#ffffff', hasStroke: false, stroke: '#000000', strokeWidth: 2,
        x: 50, y: 50, fontSize: 32, bgColor: 'transparent', bgStyle: 'pill',
        maxChars: 24, animation: null, curve: null, entryTime: null, duration: null,
        letterSpacing: 0, lineHeight: 1, fontWeight: null, shape: 'line', radius: 160, arcSpread: 110,
        textCase: 'upper', opacity: 1, shadow: null,
      }],
    }));
  };

  const removeLayer = (id) =>
    setHookConfig((p) => ({ ...p, texts: p.texts.filter((t) => t.id !== id) }));

  const fillTexts = (vals) =>
    setHookConfig((p) => ({ ...p, texts: p.texts.map((t, i) => ({ ...t, content: vals[i] || t.content })) }));

  const generate = () => {
    const { topic = 'CONTENT', audience = 'AUDIENCE', promise = 'RESULTS', pain = 'SLOW GROWTH', result = 'SUCCESS', day = '5', count = '3' } = genInputs;
    const U = (s) => s.toUpperCase();
    switch (hookConfig.template) {
      case 'SERIES_DAY':      return fillTexts([U(topic), `DAY ${day}`, `AND I FINALLY GOT ${U(result)}`]);
      case 'PRICE_SHOCK':     return fillTexts([`${U(topic)} FOR`, U(promise), `FOR ${U(audience)}`]);
      case 'CONTRAST':        return fillTexts([`TIRED OF ${U(pain)}?`, `TRY THIS ${U(topic)}`, `IF YOU WANT ${U(result)}`]);
      case 'CURIOSITY':       return fillTexts([`NOBODY TELLS ${U(audience)}`, `THIS ${U(topic)}`, 'UNTIL IT IS TOO LATE']);
      case 'TRANSFORMATION':  return fillTexts([`BEFORE ${U(topic)}`, 'VS', `AFTER ${U(result)}`]);
      case 'WARNING':         return fillTexts(['WARNING', `STOP ${U(pain)}`, `IT KILLS ${U(result)}`]);
      case 'LISTICLE':        return fillTexts([`${count} THINGS`, `TO GET ${U(result)}`, `FOR ${U(audience)}`]);
      case 'CONFESSION':      return fillTexts([`I ALMOST QUIT ${U(topic)}`, `BECAUSE OF ${U(pain)}`, `UNTIL I GOT ${U(result)}`]);
      case 'ARC_REVEAL':      return fillTexts([`DO NOT ${U(promise)}`, U(topic)]);
      case 'TASTE_STACK':     return fillTexts([U(promise), U(topic), U(result)]);
      case 'FOOLED_WORLD':    return fillTexts([`${U(topic)} FOOLED`, `THE ENTIRE ${U(result)}`]);
      default:                return fillTexts([U(topic), U(promise), `FOR ${U(audience)}`]);
    }
  };

  return (
    <div className="tab-panel">
      {hookConfig.structure?.strategy && (
        <div style={{ padding: '8px 10px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.06em' }}>Strategy </span>
          {hookConfig.structure.strategy}
        </div>
      )}

      {hookConfig.texts.length === 0 && (
        <div style={{ padding: 14, background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          No text layers yet — add one below or choose a preset.
        </div>
      )}

      <div className="copy-layer-list">
        {hookConfig.texts.map((text) => {
          const slot = hookConfig.structure?.slots?.find((s) => s.id === text.id);
          const layerLabel = getLayerLabel(text, hookConfig);
          const hint = slot?.maxChars ? `max ${slot.maxChars} chars` : '';
          return (
          <div key={text.id} className="copy-layer-card">
            <div className="copy-layer-header">
              <span
                className="copy-layer-dot"
                style={{ background: text.fill, border: text.fill === '#ffffff' ? '1px solid #444' : 'none' }}
              />
              <span className="copy-layer-role">{layerLabel}</span>
              {hint && <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto', marginRight: 4, letterSpacing: '0.02em' }}>{hint}</span>}
              <button className="copy-layer-del" onClick={() => removeLayer(text.id)} title="Remove layer">
                <Trash2 size={11} />
              </button>
            </div>
            <textarea
              className="ctrl-input copy-layer-input copy-layer-textarea"
              value={text.content}
              placeholder={slot?.label ? `Enter ${slot.label.toLowerCase()}…` : 'Enter text…'}
              autoFocus={hookConfig.texts.indexOf(text) === 0}
              rows={Math.max(2, (text.content || '').split('\n').length)}
              onChange={(e) => updateContent(text.id, e.target.value)}
            />
            <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
              ↵ Enter = line break on canvas
            </span>
          </div>
          );
        })}
      </div>

      <button className="btn-add-layer" onClick={addLayer}>
        <Plus size={14} /> Add text layer
      </button>

      <Divider />

      <button
        onClick={() => setShowGen((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', width: '100%' }}
      >
        <Sparkles size={12} />
        <span style={{ flex: 1, textAlign: 'left' }}>Fill from template</span>
        {showGen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>

      {showGen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          {[['topic','Topic'],['audience','Audience'],['promise','Promise / Offer'],['pain','Pain / Problem'],['result','Result / Payoff']].map(([field, label]) => (
            <CtrlInput
              key={field}
              label={label}
              value={genInputs[field]}
              placeholder={label}
              onChange={(e) => setGenInputs((g) => ({ ...g, [field]: e.target.value }))}
            />
          ))}
          <div className="row-2">
            <CtrlInput label="Day #" value={genInputs.day} onChange={(e) => setGenInputs((g) => ({ ...g, day: e.target.value }))} />
            <CtrlInput label="Count" value={genInputs.count} onChange={(e) => setGenInputs((g) => ({ ...g, count: e.target.value }))} />
          </div>
          <button className="btn-primary" onClick={generate} disabled={!hookConfig.template}>
            <Sparkles size={13} /> Generate copy
          </button>
        </div>
      )}

      <Divider />
      <button className="btn-primary" onClick={() => setSidebarTab('style')}>
        Style it →
      </button>
    </div>
  );
}

// ─── Warp Panel ─────────────────────────────────────────────────────────────

const WARP_TYPES = [
  { val: 'line',    label: 'None'    },
  { val: 'arc',     label: 'Arc'     },
  { val: 'arch',    label: 'Arch'    },
  { val: 'rise',    label: 'Rise'    },
  { val: 'lean-l',  label: 'Lean L'  },
  { val: 'lean-r',  label: 'Lean R'  },
  { val: 'skew-r',  label: 'Skew R'  },
  { val: 'skew-l',  label: 'Skew L'  },
  { val: 'squeeze', label: 'Squeeze' },
  { val: 'inflate', label: 'Inflate' },
  { val: 'wave',    label: 'Wave'    },
  { val: 'flag',    label: 'Flag'    },
];

function WarpIcon({ type, size = 32 }) {
  const w = size, h = Math.round(size * 0.52);
  const cx = w / 2, cy = h / 2;
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (type) {
    case 'line':
      return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><line {...s} x1="2" y1={cy} x2={w-2} y2={cy}/></svg>;
    case 'arc': {
      const r = h * 0.9, ang = 55;
      const toR = a => a * Math.PI / 180;
      const pts = Array.from({length:11},(_,i)=>{const a=-ang+i*(ang*2/10);return `${(cx+r*Math.sin(toR(a))).toFixed(1)},${(cy+r-r*Math.cos(toR(a))).toFixed(1)}`;});
      return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><polyline {...s} points={pts.join(' ')}/></svg>;
    }
    case 'arch':
      return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polygon {...s} points={`2,${h-2} ${w*0.2},2 ${w*0.8},2 ${w-2},${h-2}`}/>
      </svg>;
    case 'rise':
      return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polygon {...s} points={`2,2 ${w*0.2},${h-2} ${w*0.8},${h-2} ${w-2},2`}/>
      </svg>;
    case 'lean-l':
      return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polygon {...s} points={`${w*0.22},2 2,${h-2} ${w*0.78},${h-2} ${w-2},2`}/>
      </svg>;
    case 'lean-r':
      return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polygon {...s} points={`2,2 ${w*0.22},${h-2} ${w*0.78+0.22*w},${h-2} ${w-2+(0.22*w)},2`} transform={`translate(${-(0.22*w)},0)`}/>
      </svg>;
    case 'skew-r':
      return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polygon {...s} points={`${w*0.25},2 2,${h-2} ${w*0.75},${h-2} ${w-2},2`} transform={`skewX(-10)`} style={{transformOrigin:'50% 50%'}}/>
      </svg>;
    case 'skew-l':
      return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polygon {...s} points={`2,2 ${w*0.25},${h-2} ${w*0.75},${h-2} ${w-2},2`} transform={`skewX(10)`} style={{transformOrigin:'50% 50%'}}/>
      </svg>;
    case 'squeeze':
      return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polygon {...s} points={`${cx-w*0.1},2 ${cx-w*0.18},${h-2} ${cx+w*0.18},${h-2} ${cx+w*0.1},2`}/>
      </svg>;
    case 'inflate':
      return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polygon {...s} points={`2,${cy} ${w*0.1},2 ${w*0.9},2 ${w-2},${cy} ${w*0.9},${h-2} ${w*0.1},${h-2}`}/>
      </svg>;
    case 'wave': {
      const pts = Array.from({length:13},(_,i)=>{const t=i/12;return `${(2+t*(w-4)).toFixed(1)},${(cy+Math.sin(t*Math.PI*2)*(h*0.32)).toFixed(1)}`;});
      return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><polyline {...s} points={pts.join(' ')}/></svg>;
    }
    case 'flag': {
      const pts = Array.from({length:13},(_,i)=>{const t=i/12;return `${(2+t*(w-4)+Math.sin(t*Math.PI*2)*(w*0.08)).toFixed(1)},${(2+t*(h-4)).toFixed(1)}`;});
      return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><polyline {...s} points={pts.join(' ')}/></svg>;
    }
    default: return null;
  }
}

function WarpPanel({ text, update }) {
  return (
    <div>
      <Label>Shape / Warp</Label>
      <div className="warp-grid">
        {WARP_TYPES.map(({ val, label }) => (
          <button
            key={val}
            className={`warp-btn ${(text.shape || 'line') === val ? 'active' : ''}`}
            onClick={() => update('shape', val)}
            title={label}
          >
            <WarpIcon type={val} size={30} />
            <span className="warp-btn-label">{label}</span>
          </button>
        ))}
      </div>
      {text.shape && text.shape !== 'line' && text.shape !== 'arc' && (
        <div style={{ marginTop: 8 }}>
          <Slider label="Warp amount" value={text.warpAmount ?? 50} min={5} max={100} step={1} unit="%" onChange={(v) => update('warpAmount', v)} />
        </div>
      )}
      {text.shape === 'arc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <Slider label="Arc radius" value={text.radius ?? 160} min={60} max={400} step={5} unit="px" onChange={(v) => update('radius', v)} />
          <Slider label="Spread" value={text.arcSpread ?? 110} min={20} max={240} step={5} unit="°" onChange={(v) => update('arcSpread', v)} />
        </div>
      )}
    </div>
  );
}

// ─── WarpSection ─────────────────────────────────────────────────────────────

function WarpSection({ text, update }) {
  const [open, setOpen] = useState(false);
  const hasWarp = (text.skewX || 0) !== 0 || (text.skewY || 0) !== 0 ||
                  (text.rotateX || 0) !== 0 || (text.rotateY || 0) !== 0 ||
                  (text.textRotate || 0) !== 0;
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: hasWarp ? 'var(--accent-primary)' : 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', width: '100%' }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>Warp & Transform {hasWarp ? '●' : ''}</span>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <Slider label="Rotate"  value={text.textRotate ?? 0} min={-180} max={180} step={1} unit="°" onChange={(v) => update('textRotate', v)} />
          <div className="row-2">
            <Slider label="Skew X" value={text.skewX ?? 0} min={-40} max={40} step={1} unit="°" onChange={(v) => update('skewX', v)} />
            <Slider label="Skew Y" value={text.skewY ?? 0} min={-40} max={40} step={1} unit="°" onChange={(v) => update('skewY', v)} />
          </div>
          <div className="row-2">
            <Slider label="Tilt X" value={text.rotateX ?? 0} min={-60} max={60} step={1} unit="°" onChange={(v) => update('rotateX', v)} />
            <Slider label="Tilt Y" value={text.rotateY ?? 0} min={-60} max={60} step={1} unit="°" onChange={(v) => update('rotateY', v)} />
          </div>
          {hasWarp && (
            <button
              className="btn-secondary"
              style={{ padding: '5px 10px', fontSize: 11 }}
              onClick={() => { update('skewX', 0); update('skewY', 0); update('rotateX', 0); update('rotateY', 0); update('textRotate', 0); }}
            >
              Reset transforms
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Effect Preset Cards ──────────────────────────────────────────────────────

const FX_PRESETS = [
  {
    label: 'Plain',
    apply: { fillType:'solid', fill:'#ffffff', hasStroke:false, shadow:null, blendMode:'normal', backdropBlur:0 },
    preview: { color:'#fff', fontWeight:800 },
  },
  {
    label: 'Hard',
    apply: { fillType:'solid', fill:'#ffffff', shadow:'hard', hasStroke:true, stroke:'#000000', strokeWidth:5 },
    preview: { color:'#fff', WebkitTextStroke:'2px #000', paintOrder:'stroke fill', textShadow:'2px 3px 0 #000', fontWeight:800 },
  },
  {
    label: 'Outline',
    apply: { fillType:'solid', fill:'transparent', hasStroke:true, stroke:'#ffffff', strokeWidth:3, shadow:'none' },
    preview: { WebkitTextFillColor:'transparent', WebkitTextStroke:'1.5px #fff', paintOrder:'stroke fill', fontWeight:800 },
  },
  {
    label: 'Chalk',
    apply: { fillType:'solid', fill:'#f5f0e8', shadow:'soft', hasStroke:false, blendMode:'normal' },
    preview: { color:'#f5f0e8', textShadow:'0 1px 8px rgba(245,240,232,0.4)', fontWeight:800, fontStyle:'italic' },
  },
  {
    label: 'Neon',
    apply: { fillType:'gradient', gradientFrom:'#00f5ff', gradientTo:'#bf00ff', gradientAngle:135, shadow:'glow', hasStroke:false },
    preview: { background:'linear-gradient(135deg,#00f5ff,#bf00ff)', WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent', textShadow:'0 0 14px #00f5ffaa', fontWeight:800 },
  },
  {
    label: 'Holo',
    apply: { fillType:'gradient', gradientFrom:'#ff0080', gradientTo:'#00ffcc', gradientAngle:90, shadow:'glow', hasStroke:false, blendMode:'screen' },
    preview: { background:'linear-gradient(90deg,#ff0080,#00ffcc)', WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent', textShadow:'0 0 12px #ff008077', fontWeight:800 },
  },
  {
    label: 'Cosmic',
    apply: { fillType:'gradient', gradientFrom:'#8b00ff', gradientTo:'#ff00ff', gradientAngle:135, shadow:'glow', hasStroke:false },
    preview: { background:'linear-gradient(135deg,#8b00ff,#ff00ff)', WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent', textShadow:'0 0 16px #8b00ffbb', fontWeight:800 },
  },
  {
    label: 'Ice',
    apply: { fillType:'gradient', gradientFrom:'#cff4fc', gradientTo:'#4fc3f7', gradientAngle:135, shadow:'glow', hasStroke:false },
    preview: { background:'linear-gradient(135deg,#cff4fc,#4fc3f7)', WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent', textShadow:'0 0 12px #4fc3f7aa', fontWeight:800 },
  },
  {
    label: 'Retro',
    apply: { fillType:'gradient', gradientFrom:'#ff6b35', gradientTo:'#ffd60a', gradientAngle:135, shadow:'hard', hasStroke:true, stroke:'#1a0a00', strokeWidth:3 },
    preview: { background:'linear-gradient(135deg,#ff6b35,#ffd60a)', WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent', textShadow:'2px 2px 0 #1a0a00', fontWeight:800 },
  },
  {
    label: 'Gold',
    apply: { fillType:'gradient', gradientFrom:'#ffd700', gradientTo:'#c97b00', gradientAngle:135, shadow:'hard', hasStroke:true, stroke:'#5c3a00', strokeWidth:2 },
    preview: { background:'linear-gradient(135deg,#ffd700,#c97b00)', WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent', textShadow:'1px 2px 0 #5c3a00', fontWeight:900 },
  },
  {
    label: 'Fire',
    apply: { fillType:'gradient', gradientFrom:'#ff2400', gradientTo:'#ffd700', gradientAngle:180, shadow:'glow', hasStroke:false },
    preview: { background:'linear-gradient(180deg,#ffd700,#ff2400)', WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent', textShadow:'0 0 16px #ff4400aa', fontWeight:800 },
  },
  {
    label: 'Candy',
    apply: { fillType:'gradient', gradientFrom:'#ff6eb4', gradientTo:'#ff4500', gradientAngle:135, shadow:'soft', hasStroke:false },
    preview: { background:'linear-gradient(135deg,#ff6eb4,#ff4500)', WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent', textShadow:'0 0 10px #ff6eb477', fontWeight:800 },
  },
  {
    label: 'Aurora',
    apply: { fillType:'gradient', gradientFrom:'#00ff87', gradientTo:'#8b5cf6', gradientAngle:135, gradientAnimated:true, gradientAnimType:'shift', gradientAnimSpeed:3, shadow:'glow', hasStroke:false },
    preview: { background:'linear-gradient(135deg,#00ff87,#8b5cf6)', WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent', textShadow:'0 0 14px #00ff8766', fontWeight:800 },
  },
  {
    label: 'HueCycle',
    apply: { fillType:'gradient', gradientFrom:'#ff0080', gradientTo:'#00ffcc', gradientAngle:135, gradientAnimated:true, gradientAnimType:'hue', gradientAnimSpeed:2, shadow:'none', hasStroke:false },
    preview: { background:'linear-gradient(135deg,#ff0080,#00ffcc)', WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:800 },
  },
  {
    label: 'Chrome',
    apply: { fillType:'gradient', gradientFrom:'#d4d4d4', gradientTo:'#737373', gradientMid:'#ffffff', gradientMidPos:50, gradientAngle:90, shadow:'hard', hasStroke:true, stroke:'#404040', strokeWidth:1 },
    preview: { background:'linear-gradient(90deg,#737373,#ffffff,#737373)', WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:900 },
  },
  {
    label: 'Spirit',
    apply: { fillType:'gradient', gradientFrom:'#ff8c00', gradientTo:'#ff2400', gradientAngle:150, shadow:'glow', hasStroke:true, stroke:'#1a0000', strokeWidth:2, glowColor:'#ff4400', glow:true, glowRadius:18, glowIntensity:0.65 },
    preview: { background:'linear-gradient(150deg,#ff8c00,#ff2400)', WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent', textShadow:'0 0 18px #ff440088', fontWeight:800 },
  },
  {
    label: 'Pastel',
    apply: { fillType:'gradient', gradientFrom:'#f9a8d4', gradientTo:'#93c5fd', gradientAngle:135, shadow:'soft', hasStroke:false },
    preview: { background:'linear-gradient(135deg,#f9a8d4,#93c5fd)', WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700 },
  },
  {
    label: 'Matrix',
    apply: { fillType:'solid', fill:'#00ff41', shadow:'glow', glowColor:'#00ff41', glow:true, glowRadius:16, glowIntensity:0.8, hasStroke:false, filterBrightness:1.25 },
    preview: { color:'#00ff41', textShadow:'0 0 14px #00ff41bb', fontWeight:700 },
  },
  {
    label: 'Shimmer',
    apply: { fillType:'solid', fill:'#ffffff', shimmer:true, shimmerColor:'rgba(255,255,255,0.7)', shimmerSpeed:1.8, bgColor:'#1a1a2e', bgStyle:'pill', bgOpacity:0.9 },
    preview: { color:'#ffffff', background:'#1a1a2e', padding:'1px 8px', borderRadius:999, fontWeight:700 },
  },
];

function FxPresetCard({ preset, onClick }) {
  return (
    <button className="fx-preset-card" onClick={onClick} title={preset.label}>
      <div className="fx-preset-swatch">
        <span style={{ fontSize: 14, letterSpacing: '-0.02em', lineHeight: 1, userSelect: 'none', ...preset.preview }}>
          HOOK
        </span>
      </div>
      <span className="fx-preset-name">{preset.label}</span>
    </button>
  );
}

// ─── Step 3: STYLE ────────────────────────────────────────────────────────────

const TEXT_CASE_OPTIONS = [
  { val: 'upper', label: 'AA', title: 'UPPERCASE' },
  { val: 'title', label: 'Aa', title: 'Title Case' },
  { val: 'none',  label: 'aA', title: 'As typed'  },
  { val: 'lower', label: 'aa', title: 'lowercase'  },
];

const SHADOW_OPTIONS = [
  { val: 'none', icon: '—', label: 'None'    },
  { val: null,   icon: '◎', label: 'Auto'    },
  { val: 'soft', icon: '●', label: 'Soft'    },
  { val: 'glow', icon: '✦', label: 'Glow'    },
  { val: 'hard', icon: '■', label: 'Hard'    },
];

const BG_OPTIONS = [
  { val: 'none', icon: '⊘', label: 'None' },
  { val: 'pill', icon: '◉', label: 'Pill' },
  { val: 'bar',  icon: '▬', label: 'Bar'  },
  { val: 'box',  icon: '▢', label: 'Box'  },
];

function StyleStep() {
  const { hookConfig, setHookConfig, selectedTextId, setSelectedTextId, selectedTextIds, setSelectedTextIds, pushHistory, undo, undoCount } = useHookStore();
  const [presetsOpen, setPresetsOpen] = useState(true);
  const [wordColorsOpen, setWordColorsOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const activeId = selectedTextId || hookConfig.texts[0]?.id || null;
  const text = hookConfig.texts.find((t) => t.id === activeId) ?? null;
  const isMultiMode = selectedTextIds.length > 1;

  // When in multi-select mode, apply changes to all selected layers.
  // Falls back to updating just the active layer for single-select.
  const update = (field, val) => {
    const idsToUpdate = isMultiMode ? selectedTextIds : (activeId ? [activeId] : []);
    if (idsToUpdate.length === 0) return;
    setHookConfig((p) => ({ ...p, texts: p.texts.map((t) => idsToUpdate.includes(t.id) ? { ...t, [field]: val } : t) }));
  };

  const bgOn = text && text.bgColor && text.bgColor !== 'transparent';
  const activeBgStyle = bgOn ? (text.bgStyle || 'pill') : 'none';

  if (hookConfig.texts.length === 0) {
    return (
      <div className="tab-panel">
        <div style={{ padding: 14, background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          No text layers yet. Go to Copy to add some first.
        </div>
      </div>
    );
  }

  return (
    <div className="tab-panel">
      {/* Multi-select hint */}
      {isMultiMode && (
        <div style={{ fontSize: 11, color: '#a5b4fc', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, padding: '5px 10px', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span><b>{selectedTextIds.length}</b> layers selected — edits apply to all</span>
          <button onClick={() => { setSelectedTextIds([]); }} style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: 11, padding: '0 2px' }}>Clear</button>
        </div>
      )}

      {/* Layer selector + actions */}
      <div className="layer-selector">
        {hookConfig.texts.map((t, idx) => (
          <button
            key={t.id}
            className={`layer-sel-btn ${activeId === t.id ? 'active' : ''} ${selectedTextIds.includes(t.id) && activeId !== t.id ? 'multi-selected' : ''} ${t.hidden ? 'layer-hidden' : ''}`}
            onClick={(e) => {
              if (e.shiftKey || e.ctrlKey || e.metaKey) {
                setSelectedTextIds((prev) => {
                  const s = new Set(prev);
                  if (s.has(t.id)) { s.delete(t.id); } else { s.add(t.id); }
                  return [...s];
                });
                setSelectedTextId(t.id);
              } else {
                setSelectedTextId(t.id);
                setSelectedTextIds([t.id]);
              }
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.fill, flexShrink: 0, border: t.fill === '#ffffff' ? '1px solid #555' : 'none', opacity: t.hidden ? 0.4 : 1 }} />
            {getLayerLabel(t, hookConfig)}
          </button>
        ))}
      </div>
      {text && (
        <div className="layer-actions-row">
          <button className="layer-act-btn" title={text.hidden ? 'Show layer' : 'Hide layer'}
            onClick={() => { pushHistory(); update('hidden', !text.hidden); }}>
            {text.hidden ? <EyeOff size={12}/> : <Eye size={12}/>}
          </button>
          <button className="layer-act-btn" title="Duplicate layer"
            onClick={() => {
              pushHistory();
              const clone = { ...text, id: `layer_${Date.now()}`, x: text.x + 3, y: text.y + 3 };
              setHookConfig(p => ({ ...p, texts: [...p.texts, clone] }));
            }}>
            <Copy size={12}/>
          </button>
          <button className="layer-act-btn" title="Move layer up"
            disabled={hookConfig.texts.findIndex(t => t.id === activeId) === 0}
            onClick={() => {
              pushHistory();
              const i = hookConfig.texts.findIndex(t => t.id === activeId);
              if (i <= 0) return;
              const arr = [...hookConfig.texts];
              [arr[i-1], arr[i]] = [arr[i], arr[i-1]];
              setHookConfig(p => ({ ...p, texts: arr }));
            }}>
            <ArrowUp size={12}/>
          </button>
          <button className="layer-act-btn" title="Move layer down"
            disabled={hookConfig.texts.findIndex(t => t.id === activeId) === hookConfig.texts.length - 1}
            onClick={() => {
              pushHistory();
              const i = hookConfig.texts.findIndex(t => t.id === activeId);
              if (i >= hookConfig.texts.length - 1) return;
              const arr = [...hookConfig.texts];
              [arr[i], arr[i+1]] = [arr[i+1], arr[i]];
              setHookConfig(p => ({ ...p, texts: arr }));
            }}>
            <ArrowDown size={12}/>
          </button>
          <button className="layer-act-btn layer-act-undo" title="Undo" disabled={undoCount === 0} onClick={undo}>
            <Undo2 size={12}/> {undoCount > 0 && <span className="undo-badge">{undoCount}</span>}
          </button>
        </div>
      )}

      {text && (
        <div className="style-sections">

          {/* ── Text ─────────────────────────────────── */}
          <div className="style-group">
            <GroupHeader>Text</GroupHeader>
            <input
              className="ctrl-input ctrl-input-content"
              value={text.content}
              onChange={(e) => update('content', e.target.value)}
            />
            <div className="row-2" style={{ alignItems: 'flex-end' }}>
              <FontSelect value={text.font || 'Inter'} onChange={(v) => update('font', v)} />
              <CtrlInput label="Size" type="number" value={text.fontSize} min={8} max={180}
                onChange={(e) => update('fontSize', parseInt(e.target.value, 10) || 12)} />
            </div>
            <div className="row-2">
              <Slider label="Weight" value={text.fontWeight ?? (text.type === 'punch' ? 900 : 700)}
                min={100} max={900} step={100} onChange={(v) => update('fontWeight', v)} />
              <Slider label="Tracking" value={text.letterSpacing ?? 0}
                min={-5} max={20} step={0.5} unit="px" onChange={(v) => update('letterSpacing', v)} />
            </div>
            <div className="inline-row">
              <div className="inline-row-item">
                <Label>Case</Label>
                <div className="option-row">
                  {TEXT_CASE_OPTIONS.map(({ val, label, title }) => (
                    <button key={val} className={`option-btn ${(text.textCase || 'upper') === val ? 'active' : ''}`}
                      onClick={() => update('textCase', val)} title={title}>{label}</button>
                  ))}
                </div>
              </div>
              <div className="inline-row-item">
                <Label>Align</Label>
                <div className="option-row">
                  {[
                    { val: 'left',   icon: <AlignLeft   size={12}/> },
                    { val: 'center', icon: <AlignCenter size={12}/> },
                    { val: 'right',  icon: <AlignRight  size={12}/> },
                  ].map(({ val, icon }) => (
                    <button key={val} className={`option-btn ${(text.textAlign ?? 'center') === val ? 'active' : ''}`}
                      onClick={() => update('textAlign', val)} style={{ flex: 1 }}>{icon}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Position ─────────────────────────────── */}
          <div className="style-group">
            <GroupHeader>Position</GroupHeader>
            <div className="row-3">
              <CtrlInput label="X %" type="number" value={Math.round(text.x)} min={0} max={100}
                onChange={(e) => update('x', parseFloat(e.target.value))} />
              <CtrlInput label="Y %" type="number" value={Math.round(text.y)} min={0} max={100}
                onChange={(e) => update('y', parseFloat(e.target.value))} />
              <CtrlInput label="Size" type="number" value={text.fontSize} min={8} max={180}
                onChange={(e) => update('fontSize', parseInt(e.target.value, 10) || 12)} />
            </div>
            <div>
              <Label>Width</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  className="ctrl-input"
                  type="number"
                  min={5} max={100}
                  value={text.width ?? ''}
                  placeholder="Auto (no wrap)"
                  onChange={(e) => update('width', e.target.value === '' ? null : parseFloat(e.target.value))}
                  style={{ flex: 1 }}
                />
                {text.width && (
                  <button
                    onClick={() => update('width', null)}
                    style={{ fontSize: 10, color: 'var(--text-muted)', padding: '4px 8px', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                Set a % width to enable line wrapping. Leave empty for single-line.
              </p>
            </div>
            <Slider label="Line height" value={text.lineHeight ?? 1} min={0.5} max={2.5} step={0.05}
              onChange={(v) => update('lineHeight', v)} />
          </div>

          {/* ── Look ─────────────────────────────────── */}
          <div className="style-group">
            <GroupHeader>Look</GroupHeader>

            {/* Effect presets — collapsible */}
            <div>
              <button className="fx-presets-toggle" onClick={() => setPresetsOpen(v => !v)}>
                <span style={{ flex: 1 }}>Quick styles</span>
                <span className="fx-presets-count">{FX_PRESETS.length}</span>
                <ChevronRight size={12} className={`layer-anim-chevron ${presetsOpen ? 'open' : ''}`} />
              </button>
              {presetsOpen && (
                <div className="fx-preset-row" style={{ marginTop: 8 }}>
                  {FX_PRESETS.map((preset) => (
                    <FxPresetCard
                      key={preset.label}
                      preset={preset}
                      onClick={() => {
                        pushHistory();
                        Object.entries(preset.apply).forEach(([k, v]) => update(k, v));
                        setPresetsOpen(false);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Fill */}
            <div>
              <div className="field-header">
                <Label>Fill</Label>
                <div className="fill-type-toggle">
                  {['solid','gradient'].map((t) => (
                    <button key={t} className={`fill-type-btn ${(text.fillType || 'solid') === t ? 'active' : ''}`}
                      onClick={() => update('fillType', t)}>
                      {t === 'solid' ? 'Solid' : 'Gradient'}
                    </button>
                  ))}
                </div>
              </div>
              {(text.fillType || 'solid') === 'solid' ? (
                <div className="color-field-row">
                  <ColorSwatch value={text.fill} onChange={(v) => update('fill', v)} />
                  <div style={{ flex: 1 }}>
                    <Slider label="Opacity" value={text.opacity ?? 1} min={0.05} max={1} step={0.05} onChange={(v) => update('opacity', v)} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="color-field-row">
                    <ColorSwatch value={text.gradientFrom || text.fill} onChange={(v) => update('gradientFrom', v)} />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>From</span>
                    <ColorSwatch value={text.gradientTo || '#f59e0b'} onChange={(v) => update('gradientTo', v)} />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>To</span>
                    <div style={{ flex: 1 }}>
                      <Slider label="Opacity" value={text.opacity ?? 1} min={0.05} max={1} step={0.05} onChange={(v) => update('opacity', v)} />
                    </div>
                  </div>
                  <Slider label="Angle" value={text.gradientAngle ?? 135} min={0} max={360} step={5} unit="°" onChange={(v) => update('gradientAngle', v)} />
                  {/* Animated gradient */}
                  <div className="field-header">
                    <Label>Animate</Label>
                    <PillToggle
                      checked={!!text.gradientAnimated}
                      onChange={(e) => update('gradientAnimated', e.target.checked)}
                      label="On"
                    />
                  </div>
                  {text.gradientAnimated && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div>
                        <Label>Effect</Label>
                        <div className="option-row">
                          {[
                            { val: 'shift', label: '⇄ Shift' },
                            { val: 'hue',   label: '◑ Hue' },
                            { val: 'pulse', label: '◉ Pulse' },
                          ].map(({ val, label }) => (
                            <button key={val} className={`option-btn ${(text.gradientAnimType ?? 'shift') === val ? 'active' : ''}`}
                              onClick={() => update('gradientAnimType', val)}>{label}</button>
                          ))}
                        </div>
                      </div>
                      <Slider label="Speed" value={text.gradientAnimSpeed ?? 3} min={0.5} max={10} step={0.5} unit="s" onChange={(v) => update('gradientAnimSpeed', v)} />
                    </div>
                  )}
                  {/* Advanced: type & mid stop shown in Advanced section */}
                  {advancedOpen && (<>
                    <div className="field-header">
                      <Label>Type</Label>
                      <div className="fill-type-toggle">
                        {['linear', 'radial'].map((t) => (
                          <button key={t} className={`fill-type-btn ${(text.gradientType || 'linear') === t ? 'active' : ''}`}
                            onClick={() => update('gradientType', t)}>
                            {t === 'linear' ? 'Linear' : 'Radial'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="field-header">
                      <Label>Mid stop</Label>
                      <PillToggle
                        checked={!!text.gradientMid}
                        onChange={(e) => update('gradientMid', e.target.checked ? (text.fill || '#ffffff') : undefined)}
                        label="On"
                      />
                    </div>
                    {text.gradientMid && (
                      <div className="color-field-row">
                        <ColorSwatch value={text.gradientMid} onChange={(v) => update('gradientMid', v)} />
                        <div style={{ flex: 1 }}>
                          <Slider label="Position" value={text.gradientMidPos ?? 50} min={10} max={90} step={1} unit="%" onChange={(v) => update('gradientMidPos', v)} />
                        </div>
                      </div>
                    )}
                  </>)}
                </div>
              )}
            </div>

            {/* Stroke */}
            <div>
              <div className="field-header">
                <Label>Stroke</Label>
                <PillToggle
                  checked={!!text.hasStroke}
                  onChange={(e) => update('hasStroke', e.target.checked)}
                  label="On"
                />
              </div>
              {text.hasStroke && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="color-field-row">
                    <ColorSwatch value={text.stroke || '#000000'} onChange={(v) => update('stroke', v)} />
                    <div style={{ flex: 1 }}>
                      <Slider label="Width" value={text.strokeWidth ?? 2} min={1} max={14} step={1} unit="px"
                        onChange={(v) => update('strokeWidth', v)} />
                    </div>
                  </div>
                  {/* Advanced: stroke position + double stroke */}
                  {advancedOpen && (<>
                    <div>
                      <Label>Position</Label>
                      <div className="option-row">
                        {[
                          { val: 'outer', label: 'Outer' },
                          { val: 'inner', label: 'Inner' },
                        ].map(({ val, label }) => (
                          <button key={val}
                            className={`option-btn ${(text.strokePosition || 'outer') === val ? 'active' : ''}`}
                            onClick={() => update('strokePosition', val)}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="field-header">
                      <Label>Outer ring</Label>
                      <PillToggle
                        checked={!!text.hasStroke2}
                        onChange={(e) => update('hasStroke2', e.target.checked)}
                        label="On"
                      />
                    </div>
                    {text.hasStroke2 && (
                      <div className="color-field-row">
                        <ColorSwatch value={text.stroke2 || '#000000'} onChange={(v) => update('stroke2', v)} />
                        <div style={{ flex: 1 }}>
                          <Slider label="Width" value={text.strokeWidth2 ?? 8} min={2} max={30} step={1} unit="px"
                            onChange={(v) => update('strokeWidth2', v)} />
                        </div>
                      </div>
                    )}
                  </>)}
                </div>
              )}
            </div>

            {/* Shadow (Feature A) */}
            <div>
              <div className="field-header">
                <Label>Shadow</Label>
                {advancedOpen && (
                  <div className="fill-type-toggle">
                    {['preset', 'custom'].map((m) => (
                      <button key={m} className={`fill-type-btn ${(text.shadowMode || 'preset') === m ? 'active' : ''}`}
                        onClick={() => update('shadowMode', m)}>
                        {m === 'preset' ? 'Preset' : 'Custom'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {(text.shadowMode || 'preset') === 'preset' || !advancedOpen ? (
                <div className="option-row">
                  {SHADOW_OPTIONS.map(({ val, icon, label }) => (
                    <button key={String(val)} className={`option-btn ${(text.shadow ?? null) === val ? 'active' : ''}`}
                      onClick={() => update('shadow', val)}>
                      <span style={{ fontSize: 13, lineHeight: 1 }}>{icon}</span>
                      <span style={{ fontSize: 9 }}>{label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="row-2">
                    <Slider label="X" value={text.shadowX ?? 0} min={-20} max={20} step={1} unit="px" onChange={(v) => update('shadowX', v)} />
                    <Slider label="Y" value={text.shadowY ?? 4} min={-20} max={20} step={1} unit="px" onChange={(v) => update('shadowY', v)} />
                  </div>
                  <Slider label="Blur" value={text.shadowBlur ?? 10} min={0} max={40} step={1} unit="px" onChange={(v) => update('shadowBlur', v)} />
                  <div className="color-field-row">
                    <ColorSwatch value={text.shadowColor || '#000000'} onChange={(v) => update('shadowColor', v)} />
                    <div style={{ flex: 1 }}>
                      <Slider label="Opacity" value={text.shadowOpacity ?? 0.6} min={0} max={1} step={0.05} onChange={(v) => update('shadowOpacity', v)} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Advanced toggle ──────────────────── */}
            <button
              className="style-advanced-toggle"
              onClick={() => setAdvancedOpen(v => !v)}
            >
              <span style={{ flex: 1 }}>Advanced</span>
              {(text.glow || text.highlight || text.hasStroke2 || text.gradientMid || text.grain || text.shimmer || text.gradientAnimated || (text.bgBorderWidth > 0) || (text.filterBrightness && text.filterBrightness !== 1) || (text.filterSaturate && text.filterSaturate !== 1) || (text.filterHue && text.filterHue !== 0) || (text.wordColors && Object.keys(text.wordColors).length > 0)) && (
                <span className="style-advanced-dot" />
              )}
              <ChevronRight size={11} className={`layer-anim-chevron ${advancedOpen ? 'open' : ''}`} />
            </button>

            {advancedOpen && (<>

            {/* Glow (Feature B) */}
            <div>
              <div className="field-header">
                <Label>Glow</Label>
                <PillToggle
                  checked={!!text.glow}
                  onChange={(e) => update('glow', e.target.checked)}
                  label="On"
                />
              </div>
              {text.glow && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="color-field-row">
                    <ColorSwatch value={text.glowColor || text.fill || '#ffffff'} onChange={(v) => update('glowColor', v)} />
                    <div style={{ flex: 1 }}>
                      <Slider label="Radius" value={text.glowRadius ?? 20} min={4} max={60} step={1} unit="px" onChange={(v) => update('glowRadius', v)} />
                    </div>
                  </div>
                  <Slider label="Intensity" value={text.glowIntensity ?? 0.7} min={0.1} max={1} step={0.05} onChange={(v) => update('glowIntensity', v)} />
                </div>
              )}
            </div>

            {/* Highlight (Feature C) */}
            <div>
              <div className="field-header">
                <Label>Highlight</Label>
                <PillToggle
                  checked={!!text.highlight}
                  onChange={(e) => update('highlight', e.target.checked)}
                  label="On"
                />
              </div>
              {text.highlight && (
                <Slider label="Opacity" value={text.highlightOpacity ?? 0.5} min={0.05} max={1} step={0.05} onChange={(v) => update('highlightOpacity', v)} />
              )}
            </div>

            </>)}

            {/* Background (Feature F) */}
            <div>
              <Label>Background</Label>
              <div className="option-row" style={{ marginBottom: bgOn ? 8 : 0 }}>
                {BG_OPTIONS.map(({ val, icon, label }) => (
                  <button key={val} className={`option-btn ${activeBgStyle === val ? 'active' : ''}`}
                    onClick={() => {
                      if (val === 'none') { update('bgColor', 'transparent'); }
                      else { if (!bgOn) update('bgColor', '#000000'); update('bgStyle', val); }
                    }}>
                    <span style={{ fontSize: 13, lineHeight: 1 }}>{icon}</span>
                    <span style={{ fontSize: 9 }}>{label}</span>
                  </button>
                ))}
              </div>
              {bgOn && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="color-field-row">
                    <ColorSwatch value={text.bgColor} onChange={(v) => update('bgColor', v)} />
                    <div style={{ flex: 1 }}>
                      <Slider label="Opacity" value={text.bgOpacity ?? 1} min={0.05} max={1} step={0.05} onChange={(v) => update('bgOpacity', v)} />
                    </div>
                  </div>
                  {/* Advanced bg extras */}
                  {advancedOpen && (<>
                    <div className="row-2">
                      <Slider label="Pad H" value={text.bgPaddingH ?? ({ pill: 24, bar: 20, box: 14 }[text.bgStyle ?? 'pill'] ?? 24)} min={0} max={60} step={1} unit="px" onChange={(v) => update('bgPaddingH', v)} />
                      <Slider label="Pad V" value={text.bgPaddingV ?? ({ pill: 8, bar: 6, box: 8 }[text.bgStyle ?? 'pill'] ?? 8)} min={0} max={40} step={1} unit="px" onChange={(v) => update('bgPaddingV', v)} />
                    </div>
                    {(text.bgStyle ?? 'pill') !== 'pill' && (
                      <Slider label="Radius" value={text.bgRadius ?? 0} min={0} max={40} step={1} unit="px" onChange={(v) => update('bgRadius', v)} />
                    )}
                    <div className="field-header">
                      <Label>Gradient to</Label>
                      <PillToggle
                        checked={!!text.bgGradientTo}
                        onChange={(e) => update('bgGradientTo', e.target.checked ? '#000000' : undefined)}
                        label="On"
                      />
                    </div>
                    {text.bgGradientTo && (
                      <div className="color-field-row">
                        <ColorSwatch value={text.bgGradientTo} onChange={(v) => update('bgGradientTo', v)} />
                        <div style={{ flex: 1 }}>
                          <Slider label="Angle" value={text.bgGradientAngle ?? 90} min={0} max={360} step={5} unit="°" onChange={(v) => update('bgGradientAngle', v)} />
                        </div>
                      </div>
                    )}
                    <Slider label="Frosted glass" value={text.backdropBlur ?? 0} min={0} max={24} step={1} unit="px" onChange={(v) => update('backdropBlur', v)} />
                    {/* Bg border */}
                    <div className="field-header">
                      <Label>Border</Label>
                      <PillToggle
                        checked={(text.bgBorderWidth ?? 0) > 0}
                        onChange={(e) => update('bgBorderWidth', e.target.checked ? 1 : 0)}
                        label="On"
                      />
                    </div>
                    {(text.bgBorderWidth ?? 0) > 0 && (
                      <div className="color-field-row">
                        <ColorSwatch value={text.bgBorderColor ?? '#ffffff'} onChange={(v) => update('bgBorderColor', v)} />
                        <div style={{ flex: 1 }}>
                          <Slider label="Width" value={text.bgBorderWidth ?? 1} min={1} max={8} step={1} unit="px" onChange={(v) => update('bgBorderWidth', v)} />
                        </div>
                      </div>
                    )}
                  </>)}
                </div>
              )}
            </div>
          </div>

          {/* ── Shape ────────────────────────────────── */}
          <div className="style-group">
            <GroupHeader>Shape</GroupHeader>
            <WarpPanel text={text} update={update} />
            {advancedOpen && <WarpSection text={text} update={update} />}
          </div>

          {/* ── FX ───────────────────────────────────── */}
          <div className="style-group">
            <GroupHeader>FX</GroupHeader>

            {/* Grain — primary (visual, impactful) */}
            <Slider label="Grain" value={text.grain ?? 0} min={0} max={100} step={5} unit="%" onChange={(v) => update('grain', v)} />

            {/* Advanced: Blend mode, Backdrop blur, Per-word color */}
            {advancedOpen && (<>
            {!bgOn && (
              <Slider label="Backdrop blur" value={text.backdropBlur ?? 0} min={0} max={30} step={1} unit="px"
                onChange={(v) => update('backdropBlur', v)} />
            )}
            <CtrlSelect label="Blend mode" value={text.blendMode || 'normal'}
              onChange={(e) => update('blendMode', e.target.value)}>
              {['normal','multiply','screen','overlay','lighten','darken','color-dodge','hard-light','soft-light','difference','exclusion'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </CtrlSelect>
            {/* Shimmer sweep */}
            <div className="field-header">
              <Label>Shimmer</Label>
              <PillToggle
                checked={!!text.shimmer}
                onChange={(e) => update('shimmer', e.target.checked)}
                label="On"
              />
            </div>
            {text.shimmer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="color-field-row">
                  <ColorSwatch value={text.shimmerColor ?? 'rgba(255,255,255,0.55)'} onChange={(v) => update('shimmerColor', v)} />
                  <div style={{ flex: 1 }}>
                    <Slider label="Speed" value={text.shimmerSpeed ?? 2} min={0.5} max={6} step={0.5} unit="s" onChange={(v) => update('shimmerSpeed', v)} />
                  </div>
                </div>
              </div>
            )}
            {/* Text filters */}
            <div style={{ marginTop: 4 }}>
              <Label>Brightness</Label>
              <Slider label="" value={text.filterBrightness ?? 1} min={0.2} max={2} step={0.05} onChange={(v) => update('filterBrightness', v)} />
            </div>
            <div>
              <Slider label="Saturate" value={text.filterSaturate ?? 1} min={0} max={3} step={0.1} onChange={(v) => update('filterSaturate', v)} />
            </div>
            <div>
              <Slider label="Hue shift" value={text.filterHue ?? 0} min={0} max={360} step={5} unit="°" onChange={(v) => update('filterHue', v)} />
            </div>
            </>)}

            {/* Feature H: Per-word color */}
            <div>
              <button
                onClick={() => setWordColorsOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: (text.wordColors && Object.keys(text.wordColors).length > 0) ? 'var(--accent-primary)' : 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', width: '100%' }}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>Per-word color {(text.wordColors && Object.keys(text.wordColors).length > 0) ? '●' : ''}</span>
                {wordColorsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
              {wordColorsOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {text.content.split(' ').map((word, i) => (
                    <div key={i} className="color-field-row">
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{word || `Word ${i + 1}`}</span>
                      <ColorSwatch
                        value={(text.wordColors?.[i]) ?? (text.fill || '#ffffff')}
                        onChange={(v) => {
                          const wc = { ...(text.wordColors ?? {}), [i]: v };
                          update('wordColors', wc);
                        }}
                      />
                      {text.wordColors?.[i] && (
                        <button
                          onClick={() => {
                            const wc = { ...(text.wordColors ?? {}) };
                            delete wc[i];
                            update('wordColors', Object.keys(wc).length > 0 ? wc : undefined);
                          }}
                          style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
                          title="Clear word color"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Karaoke highlight (only shown when layer has word timestamps) ── */}
          {text.wordTimestamps?.length > 0 && (
            <>
              <Divider />
              <div className="ctrl-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <SectionLabel style={{ margin: 0 }}>Karaoke highlight</SectionLabel>
                  <PillToggle
                    checked={text.karaokeOff !== true}
                    onChange={() => update('karaokeOff', text.karaokeOff ? undefined : true)}
                  />
                </div>
                {text.karaokeOff !== true && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {/* Style chips */}
                    <div>
                      <Label>Highlight style</Label>
                      <div className="karaoke-style-grid">
                        {[
                          { id: 'glow',      label: '✦ Glow' },
                          { id: 'color',     label: 'Color' },
                          { id: 'box',       label: '▐ Box' },
                          { id: 'underline', label: '__ Line' },
                        ].map((s) => (
                          <button
                            key={s.id}
                            className={`karaoke-style-btn ${(text.karaokeStyle ?? 'glow') === s.id ? 'active' : ''}`}
                            onClick={() => update('karaokeStyle', s.id)}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Colour */}
                    <div className="color-field-row">
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Highlight colour</span>
                      <ColorSwatch
                        value={text.karaokeColor ?? '#FFE400'}
                        onChange={(v) => update('karaokeColor', v)}
                      />
                    </div>

                    {/* Scale */}
                    <Slider
                      label="Active word scale"
                      value={text.karaokeScale ?? 1.1}
                      min={1.0} max={1.5} step={0.05}
                      onChange={(v) => update('karaokeScale', v)}
                    />

                    {/* Dim past */}
                    <Slider
                      label="Past word dim"
                      value={text.karaokeDim ?? 0.35}
                      min={0} max={1} step={0.05}
                      onChange={(v) => update('karaokeDim', v)}
                    />

                    {/* Dim future */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Label>Dim upcoming words</Label>
                      <PillToggle
                        checked={!!text.karaokeDimFuture}
                        onChange={() => update('karaokeDimFuture', !text.karaokeDimFuture)}
                      />
                    </div>

                  </div>
                )}
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}

// ─── Collapsible layer animation card ────────────────────────────────────────

function LayerAnimCard({ text, idx, hookConfig, updateAnim, updateLayerT, pushHistory, triggerPreview }) {
  const [open, setOpen]   = useState(idx === 0);
  const [advOpen, setAdvOpen] = useState(false);
  const stagger     = hookConfig.motionProfile?.stagger ?? 0.12;
  const defaultEntry = (idx * stagger + 0.1).toFixed(2);
  const defaultDur   = (hookConfig.timing.duration - (text.entryTime ?? idx * stagger + 0.1)).toFixed(2);
  const dotBorder = text.fill === '#ffffff' ? '1px solid #555' : 'none';

  // Resolve display label: combo name if matched, else raw motion name
  const comboId    = resolveComboId(text.animation, text.textEffect);
  const comboLabel = ANIMATION_COMBOS.find(c => c.id === comboId)?.label
    ?? LAYER_ANIMS.find(a => a.id === (text.animation ?? null))?.label
    ?? 'Auto';

  const applyCombo = (animation, textEffect) => {
    pushHistory();
    updateLayerT(text.id, 'animation',  animation);
    updateLayerT(text.id, 'textEffect', textEffect ?? null);
    triggerPreview();
  };

  return (
    <div className={`layer-anim-card ${open ? 'open' : ''}`}>
      <button className="layer-anim-header" onClick={() => setOpen(v => !v)}>
        <span className="layer-anim-dot" style={{ background: text.fill, border: dotBorder }} />
        <span className="layer-anim-name">
          {getLayerLabel(text, hookConfig)}
          <span className="layer-anim-preview">{text.content?.slice(0, 18)}{text.content?.length > 18 ? '…' : ''}</span>
        </span>
        <span className="layer-anim-chip">{comboLabel}</span>
        <button
          className="layer-anim-preview-btn"
          title="Preview animation"
          onClick={(e) => { e.stopPropagation(); pushHistory(); triggerPreview(); }}
        >▶</button>
        <ChevronRight size={12} className={`layer-anim-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="layer-anim-body">
          {/* ── Primary: named combo picker ── */}
          <ComboPicker
            animation={text.animation}
            textEffect={text.textEffect}
            onChange={applyCombo}
          />

          {/* ── Timing ── */}
          <div className="row-2" style={{ marginTop: 8 }}>
            <div>
              <Label>Entry (s)</Label>
              <input className="ctrl-input" type="number" step={0.05} min={0} max={hookConfig.timing.duration - 0.1}
                value={text.entryTime ?? ''} placeholder={defaultEntry}
                onChange={(e) => updateLayerT(text.id, 'entryTime', e.target.value === '' ? null : parseFloat(e.target.value))}
                style={{ width: '100%' }} />
            </div>
            <div>
              <Label>Duration (s)</Label>
              <input className="ctrl-input" type="number" step={0.05} min={0.1} max={hookConfig.timing.duration}
                value={text.duration ?? ''} placeholder={defaultDur}
                onChange={(e) => updateLayerT(text.id, 'duration', e.target.value === '' ? null : parseFloat(e.target.value))}
                style={{ width: '100%' }} />
            </div>
          </div>

          {/* ── Advanced toggle ── */}
          <button
            className="adv-toggle-btn"
            onClick={() => setAdvOpen(v => !v)}
          >
            {advOpen ? '▲' : '▼'} Advanced
          </button>

          {advOpen && (
            <div className="adv-section">
              <Label>Entry / exit motion</Label>
              <AnimPicker value={text.animation} onChange={(v) => { pushHistory(); updateAnim(text.id, v); triggerPreview(); }} />
              <Label style={{ marginTop: 8 }}>Text effect</Label>
              <TextEffectPicker
                value={text.textEffect}
                onChange={(v) => { pushHistory(); updateLayerT(text.id, 'textEffect', v); triggerPreview(); }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Motion mood presets ──────────────────────────────────────────────────────

const MOTION_MOODS = [
  {
    label: 'Fast Hit',
    emoji: '⚡',
    stagger: 0.06,
    duration: 2.2,
    curves: { entry: 'Ease Out Expo', emphasis: 'Elastic', exit: 'Ease In' },
    defaultAnim: 'slam',
  },
  {
    label: 'Smooth',
    emoji: '🌊',
    stagger: 0.16,
    duration: 3.6,
    curves: { entry: 'Soft Float', emphasis: 'No Overshoot', exit: 'Ease In' },
    defaultAnim: 'drift-up',
  },
  {
    label: 'Punchy',
    emoji: '💥',
    stagger: 0.08,
    duration: 2.6,
    curves: { entry: 'Pop', emphasis: 'Bounce Light', exit: 'Ease In' },
    defaultAnim: 'counter-slam',
  },
  {
    label: 'Elegant',
    emoji: '✨',
    stagger: 0.20,
    duration: 4.0,
    curves: { entry: 'Soft Float', emphasis: 'Spring Soft', exit: 'Ease In' },
    defaultAnim: 'blur-in',
  },
  {
    label: 'Bounce',
    emoji: '🎯',
    stagger: 0.10,
    duration: 3.0,
    curves: { entry: 'Spring Stiff', emphasis: 'Overshoot', exit: 'Ease In' },
    defaultAnim: 'bounce-in',
  },
];

// ─── Step 4: MOTION ──────────────────────────────────────────────────────────

function MotionStep() {
  const { hookConfig, setHookConfig, video, triggerPreview, pushHistory } = useHookStore();

  const updateTiming  = (k, v) => setHookConfig((p) => ({ ...p, timing:       { ...p.timing,       [k]: v } }));
  const updateCurve   = (k, v) => setHookConfig((p) => ({ ...p, curves:       { ...p.curves,       [k]: v } }));
  const updateMotion  = (k, v) => setHookConfig((p) => ({ ...p, motionProfile:{ ...p.motionProfile,[k]: v } }));
  const updatePhase   = (k, v) => setHookConfig((p) => ({ ...p, timing: { ...p.timing, phases: { ...p.timing.phases, [k]: v } } }));
  const updateAnim    = (id, v) => setHookConfig((p) => ({ ...p, texts: p.texts.map((t) => t.id === id ? { ...t, animation: v } : t) }));
  const updateLayerT  = (id, f, v) => setHookConfig((p) => ({ ...p, texts: p.texts.map((t) => t.id === id ? { ...t, [f]: v } : t) }));

  const applyMood = (mood) => {
    pushHistory();
    setHookConfig((p) => ({
      ...p,
      timing: { ...p.timing, duration: mood.duration },
      curves: { ...p.curves, ...mood.curves },
      motionProfile: { ...p.motionProfile, stagger: mood.stagger },
      texts: p.texts.map((t) => ({ ...t, animation: t.animation ?? mood.defaultAnim })),
    }));
    triggerPreview();
  };

  return (
    <div className="tab-panel">

      {/* Mood presets */}
      <div className="ctrl-section">
        <SectionLabel>Mood</SectionLabel>
        <div className="motion-mood-row">
          {MOTION_MOODS.map((mood) => (
            <button key={mood.label} className="motion-mood-btn" onClick={() => applyMood(mood)}>
              <span className="motion-mood-emoji">{mood.emoji}</span>
              <span className="motion-mood-label">{mood.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Divider />

      <div className="ctrl-section">
        <SectionLabel>Timing</SectionLabel>
        <Slider label="Start time" value={hookConfig.timing.startTime} min={0} max={video.duration > 0 ? video.duration : 60} step={0.1} unit="s" onChange={(v) => updateTiming('startTime', v)} />
        <Slider label="Duration"   value={hookConfig.timing.duration}  min={0.5} max={12} step={0.1} unit="s" onChange={(v) => updateTiming('duration', v)} />
        <Slider label="Stagger"    value={hookConfig.motionProfile?.stagger ?? 0.12} min={0} max={0.5} step={0.01} unit="s" onChange={(v) => updateMotion('stagger', v)} />
      </div>

      {hookConfig.texts.length > 0 && (
        <>
          <Divider />
          <div className="ctrl-section">
            <SectionLabel>Layer animations</SectionLabel>
            <div className="layer-anim-list">
              {hookConfig.texts.map((text, idx) => (
                <LayerAnimCard key={text.id} text={text} idx={idx} hookConfig={hookConfig}
                  updateAnim={updateAnim} updateLayerT={updateLayerT}
                  pushHistory={pushHistory} triggerPreview={triggerPreview} />
              ))}
            </div>
          </div>
        </>
      )}

      <Divider />

      <div className="ctrl-section">
        <SectionLabel>Entry curve</SectionLabel>
        <CurveSelector label="Entry" value={hookConfig.curves.entry} options={ENTRY_CURVES} onChange={(v) => updateCurve('entry', v)} accentColor="#6366f1" />
      </div>

      <Divider />

      <div className="ctrl-section">
        <SectionLabel>Emphasis / punch curve</SectionLabel>
        <CurveSelector label="Emphasis" value={hookConfig.curves.emphasis} options={EMPHASIS_CURVES} onChange={(v) => updateCurve('emphasis', v)} accentColor="#f59e0b" />
      </div>

      <Divider />

      <div className="ctrl-section">
        <SectionLabel>Phase balance</SectionLabel>
        {[['entry','Entry'],['emphasis','Emphasis'],['hold','Hold'],['exit','Exit']].map(([k, label]) => (
          <Slider key={k} label={label} value={hookConfig.timing.phases[k]} min={5} max={70} step={1} unit="%" onChange={(v) => updatePhase(k, v)} />
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar footer ──────────────────────────────────────────────────────────

function SidebarFooter({ onExport }) {
  const { video } = useHookStore();
  return (
    <div className="sidebar-footer">
      <button className="btn-export-full" onClick={onExport} disabled={!video.url}>
        <Download size={14} strokeWidth={2.5} />
        Export hook
      </button>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ControlsPanel({ onExport }) {
  const { sidebarTab, setSidebarTab } = useHookStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <StepNav step={sidebarTab} setStep={setSidebarTab} />
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {sidebarTab === 'preset'     && <PickStep />}
        {sidebarTab === 'copy'       && <CopyStep />}
        {sidebarTab === 'style'      && <StyleStep />}
        {sidebarTab === 'motion'     && <MotionStep />}
        {sidebarTab === 'transcribe' && <TranscribePanel />}
        {sidebarTab === 'layers'     && <LayerPanel />}
      </div>
      <SidebarFooter onExport={onExport} />
    </div>
  );
}
