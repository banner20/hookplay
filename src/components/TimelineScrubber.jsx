import React, { useRef, useState, useCallback } from 'react';
import { Minus, Pause, Play, Hash, Plus, Eye, EyeOff, Lock, Unlock, GripVertical } from 'lucide-react';
import { useHookStore } from '../context/HookContext';

function formatTime(t) {
  if (Number.isNaN(t) || t < 0) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const VIEW_MODES = [
  { id: 'compact',  label: 'S', title: 'Compact'  },
  { id: 'standard', label: 'M', title: 'Standard' },
  { id: 'expanded', label: 'L', title: 'Expanded' },
];

const ROW_H    = { compact: 18, standard: 26, expanded: 38 };
const GLOBAL_H = { compact: 22, standard: 32, expanded: 48 };
const HDR_W    = 130; // px — left layer-name column

export default function TimelineScrubber() {
  const {
    video, setVideo,
    hookConfig, setHookConfig,
    timelineH, setTimelineH,
    selectedTextId, setSelectedTextId,
  } = useHookStore();

  const trackAreaRef = useRef(null);
  const scrollRef    = useRef(null);
  const headerRef    = useRef(null); // synced vertical scroll
  const [zoom,     setZoom]     = useState(1);
  const [viewMode, setViewMode] = useState('standard');
  const dragRow    = useRef(null); // for layer reorder

  // ── Timeline resize handle ───────────────────────────────────────────────
  const resizeRef = useRef({ active: false, startY: 0, startH: 0 });
  const handleResizeDown = (e) => {
    e.preventDefault();
    resizeRef.current = { active: true, startY: e.clientY, startH: timelineH };
    const onMove = (mv) => {
      if (!resizeRef.current.active) return;
      const delta = resizeRef.current.startY - mv.clientY;
      setTimelineH(Math.max(100, Math.min(500, resizeRef.current.startH + delta)));
    };
    const onUp = () => {
      resizeRef.current.active = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // ── Time math ────────────────────────────────────────────────────────────
  const pointerToTime = (clientX) => {
    if (!video.duration || !scrollRef.current) return 0;
    const rect  = scrollRef.current.getBoundingClientRect();
    const inner = scrollRef.current.scrollWidth;
    const x     = Math.max(0, Math.min(clientX - rect.left + scrollRef.current.scrollLeft, inner));
    return (x / inner) * video.duration;
  };
  const clamp = (val, lo, hi) => Math.max(lo, Math.min(hi, val));

  // ── Generic drag helper ──────────────────────────────────────────────────
  const startDrag = (e, onMove) => {
    e.stopPropagation(); e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const handleMove = (mv) => onMove(mv.clientX);
    const handleUp   = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup',   handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup',   handleUp);
  };

  // ── Playhead seek ────────────────────────────────────────────────────────
  const handleTrackSeek = (e) => {
    if (e.target.closest('.timeline-handle,.layer-block,.layer-handle')) return;
    const t = pointerToTime(e.clientX);
    setVideo(p => ({ ...p, currentTime: t, playing: false }));
    startDrag(e, (cx) => setVideo(p => ({ ...p, currentTime: clamp(pointerToTime(cx), 0, p.duration), playing: false })));
  };

  // ── Hook region drag ─────────────────────────────────────────────────────
  const startHookHandleDrag = (e, type) => {
    const s = hookConfig.timing.startTime;
    const d = hookConfig.timing.duration;
    const end = s + d;
    startDrag(e, (cx) => {
      const t = pointerToTime(cx);
      if (type === 'start') {
        const ns = clamp(t, 0, end - 0.2);
        setHookConfig(p => ({ ...p, timing: { ...p.timing, startTime: ns, duration: end - ns } }));
      } else {
        const ne = clamp(t, s + 0.2, video.duration || 9999);
        setHookConfig(p => ({ ...p, timing: { ...p.timing, duration: ne - s } }));
      }
    });
  };

  // ── Per-layer timing drag ────────────────────────────────────────────────
  const startLayerDrag = (e, textId, type) => {
    const text = hookConfig.texts.find(t => t.id === textId);
    if (!text || text.locked) return;
    const hS  = hookConfig.timing.startTime;
    const hD  = hookConfig.timing.duration;
    const stg = hookConfig.motionProfile?.stagger ?? 0.15;
    const idx = hookConfig.texts.indexOf(text);
    const ce  = text.entryTime ?? (idx * stg + 0.1);
    const cd  = text.duration  ?? (hD - ce);
    startDrag(e, (cx) => {
      const vt = pointerToTime(cx);
      const off = vt - hS;
      setHookConfig(p => ({
        ...p,
        texts: p.texts.map(t => {
          if (t.id !== textId) return t;
          if (type === 'start') {
            const ne = clamp(off, 0, ce + cd - 0.1);
            return { ...t, entryTime: +ne.toFixed(2), duration: +(cd + ce - ne).toFixed(2) };
          }
          if (type === 'end') {
            return { ...t, duration: +clamp(off - ce, 0.1, hD - ce).toFixed(2) };
          }
          return { ...t, entryTime: +clamp(off, 0, hD - cd).toFixed(2), duration: cd };
        }),
      }));
    });
  };

  // ── Layer reorder (drag in header column) ────────────────────────────────
  const handleLayerReorderDown = (e, fromIdx) => {
    e.stopPropagation();
    dragRow.current = { fromIdx, lastIdx: fromIdx };
    const rH = ROW_H[viewMode];

    const onMove = (mv) => {
      if (!headerRef.current) return;
      const rect   = headerRef.current.getBoundingClientRect();
      // Offset from top of first layer row (after the global hook row)
      const gH     = GLOBAL_H[viewMode];
      const relY   = mv.clientY - rect.top - gH;
      const toIdx  = Math.max(0, Math.min(hookConfig.texts.length - 1, Math.floor(relY / rH)));
      if (toIdx !== dragRow.current.lastIdx) {
        dragRow.current.lastIdx = toIdx;
        setHookConfig(p => {
          const arr = [...p.texts];
          const [moved] = arr.splice(dragRow.current.fromIdx, 1);
          arr.splice(toIdx, 0, moved);
          dragRow.current.fromIdx = toIdx;
          return { ...p, texts: arr };
        });
      }
    };
    const onUp = () => {
      dragRow.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // ── Toggle helpers ───────────────────────────────────────────────────────
  const toggleHidden = useCallback((id) => {
    setHookConfig(p => ({
      ...p,
      texts: p.texts.map(t => t.id === id ? { ...t, hidden: !t.hidden } : t),
    }));
  }, [setHookConfig]);

  const toggleLocked = useCallback((id) => {
    setHookConfig(p => ({
      ...p,
      texts: p.texts.map(t => t.id === id ? { ...t, locked: !t.locked } : t),
    }));
  }, [setHookConfig]);

  // ── Derived values ───────────────────────────────────────────────────────
  const dur          = video.duration || 1;
  const progressPct  = (video.currentTime / dur) * 100;
  const hookStartPct = (hookConfig.timing.startTime / dur) * 100;
  const hookEndPct   = ((hookConfig.timing.startTime + hookConfig.timing.duration) / dur) * 100;

  const tickInterval = zoom >= 6 ? 0.25 : zoom >= 3 ? 0.5 : 1;
  const ticks = [];
  if (video.duration > 0) {
    for (let t = 0; t <= video.duration; t += tickInterval) ticks.push(+(t.toFixed(2)));
  }

  const gH = GLOBAL_H[viewMode];
  const rH = ROW_H[viewMode];

  return (
    <div className="timeline-bar" style={{ position: 'relative' }}>

      {/* Resize handle */}
      <div className="timeline-resize-handle" onPointerDown={handleResizeDown} title="Drag to resize timeline" />

      {/* Play button */}
      <button
        className="play-btn"
        onClick={() => setVideo(v => ({ ...v, playing: !v.playing }))}
        disabled={!video.url}
        style={{ marginTop: gH - 10 }}
      >
        {video.playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
      </button>

      <div className="timeline-track-area">

        {/* ── Top bar ────────────────────────────────────────────────────── */}
        <div className="timeline-top-bar">
          <span className="timeline-tc">{formatTime(video.currentTime)}</span>
          <div className="timeline-hook-badge">
            <Hash size={10} />
            <span>HOOK: {formatTime(hookConfig.timing.startTime)} – {formatTime(hookConfig.timing.startTime + hookConfig.timing.duration)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <div className="tl-view-toggle">
              {VIEW_MODES.map(vm => (
                <button key={vm.id} className={`tl-view-btn ${viewMode === vm.id ? 'active' : ''}`}
                  onClick={() => setViewMode(vm.id)} title={vm.title}>{vm.label}</button>
              ))}
            </div>
            <div className="tl-zoom-ctrl">
              <button className="tl-zoom-btn" onClick={() => setZoom(z => Math.max(1, +(z / 1.5).toFixed(1)))} title="Zoom out"><Minus size={10} /></button>
              <span className="tl-zoom-val">{zoom}×</span>
              <button className="tl-zoom-btn" onClick={() => setZoom(z => Math.min(8, +(z * 1.5).toFixed(1)))} title="Zoom in"><Plus size={10} /></button>
            </div>
            <span className="timeline-tc" style={{ marginLeft: 4 }}>{formatTime(video.duration)}</span>
          </div>
        </div>

        {/* ── Two-column layout: headers + scrollable tracks ───────────── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* ── Left: layer name column ──────────────────────────────── */}
          <div
            ref={headerRef}
            className="tl-layer-col"
            style={{ width: HDR_W, flexShrink: 0 }}
          >
            {/* Hook row header */}
            <div className="tl-layer-row hook-hdr" style={{ height: gH }}>
              <span className="tl-layer-name" style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: 9, letterSpacing: '0.06em' }}>
                HOOK
              </span>
            </div>

            {/* Layer rows */}
            {hookConfig.texts.map((text, idx) => {
              const isSelected = selectedTextId === text.id;
              const color      = text.fill && text.fill !== 'transparent' ? text.fill : 'var(--accent-primary)';
              return (
                <div
                  key={text.id}
                  className={`tl-layer-row ${isSelected ? 'selected' : ''} ${text.hidden ? 'hidden-layer' : ''}`}
                  style={{ height: rH }}
                  onClick={() => setSelectedTextId(text.id)}
                >
                  {/* Drag grip */}
                  <div
                    className="tl-layer-grip"
                    onPointerDown={(e) => handleLayerReorderDown(e, idx)}
                    title="Drag to reorder"
                  >
                    <GripVertical size={10} />
                  </div>

                  {/* Color dot */}
                  <div className="tl-layer-dot" style={{ background: color }} />

                  {/* Name */}
                  <span className="tl-layer-name">
                    {(text.content || `Layer ${idx + 1}`).slice(0, 18)}
                  </span>

                  {/* Actions */}
                  <div className="tl-layer-actions">
                    <button
                      className="tl-layer-btn"
                      onClick={(e) => { e.stopPropagation(); toggleHidden(text.id); }}
                      title={text.hidden ? 'Show layer' : 'Hide layer'}
                    >
                      {text.hidden ? <EyeOff size={9} /> : <Eye size={9} />}
                    </button>
                    <button
                      className="tl-layer-btn"
                      onClick={(e) => { e.stopPropagation(); toggleLocked(text.id); }}
                      title={text.locked ? 'Unlock layer' : 'Lock layer'}
                      style={{ color: text.locked ? '#f59e0b' : undefined }}
                    >
                      {text.locked ? <Lock size={9} /> : <Unlock size={9} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Right: scrollable track area ─────────────────────────── */}
          <div
            ref={scrollRef}
            className="timeline-tracks-scroll"
            style={{ flex: 1 }}
            onPointerDown={video.url ? handleTrackSeek : undefined}
          >
            <div ref={trackAreaRef} className="timeline-tracks-inner" style={{ width: `${zoom * 100}%` }}>

              {/* Ruler */}
              <div className="timeline-ruler" style={{ height: 16 }}>
                {ticks.map(t => {
                  const pct     = (t / dur) * 100;
                  const isMajor = t % 1 === 0;
                  return (
                    <div key={t} className={`ruler-tick ${isMajor ? 'major' : ''}`} style={{ left: `${pct}%` }}>
                      {isMajor && <span className="ruler-label">{formatTime(t)}</span>}
                    </div>
                  );
                })}
              </div>

              {/* Hook region track */}
              <div className="timeline-row global-track" style={{ height: gH }}>
                <div className="timeline-track-base" />
                {video.duration > 0 && (
                  <div
                    className="hook-range-bar"
                    style={{ left: `${hookStartPct}%`, width: `${hookEndPct - hookStartPct}%` }}
                  >
                    <div className="hook-label">HOOK REGION</div>
                    <div className="timeline-handle start" onPointerDown={e => startHookHandleDrag(e, 'start')} />
                    <div className="timeline-handle end"   onPointerDown={e => startHookHandleDrag(e, 'end')} />
                  </div>
                )}
              </div>

              {/* Layer tracks */}
              <div className="timeline-layers-scroll">
                {hookConfig.texts.map((text, idx) => {
                  const stagger  = hookConfig.motionProfile?.stagger ?? 0.15;
                  const entry    = text.entryTime ?? (idx * stagger + 0.1);
                  const duration = text.duration  ?? (hookConfig.timing.duration - entry);
                  const startPct = ((hookConfig.timing.startTime + entry) / dur) * 100;
                  const widthPct = (duration / dur) * 100;
                  const color    = text.fill && text.fill !== 'transparent' ? text.fill : 'var(--accent-primary)';
                  const isSelected = selectedTextId === text.id;
                  return (
                    <div
                      key={text.id}
                      className={`timeline-row layer-track ${isSelected ? 'selected-track' : ''}`}
                      style={{ height: rH }}
                      onClick={() => setSelectedTextId(text.id)}
                    >
                      <div className="timeline-track-base" />
                      {!text.hidden && (
                        <div
                          className={`layer-block ${text.locked ? 'locked' : ''}`}
                          style={{
                            left: `${startPct}%`,
                            width: `${Math.max(widthPct, 0.5)}%`,
                            '--layer-color': color,
                            outline: isSelected ? `1.5px solid ${color}` : undefined,
                            outlineOffset: 1,
                          }}
                          onPointerDown={e => startLayerDrag(e, text.id, 'move')}
                        >
                          {viewMode !== 'compact' && (
                            <div className="layer-block-label">{text.content || `Layer ${idx + 1}`}</div>
                          )}
                          <div className="layer-handle start" onPointerDown={e => startLayerDrag(e, text.id, 'start')} />
                          <div className="layer-handle end"   onPointerDown={e => startLayerDrag(e, text.id, 'end')} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Playhead */}
              <div className="timeline-playhead" style={{ left: `${progressPct}%` }}>
                <div className="playhead-tip" />
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
