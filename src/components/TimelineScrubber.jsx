import React, { useRef } from 'react';
import { Pause, Play, Hash } from 'lucide-react';
import { useHookStore } from '../context/HookContext';

function formatTime(t) {
  if (Number.isNaN(t) || t < 0) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TimelineScrubber() {
  const { video, setVideo, hookConfig, setHookConfig } = useHookStore();
  const trackAreaRef = useRef(null);

  // ── Utilities ────────────────────────────────────
  const pointerToTime = (clientX) => {
    if (!video.duration || !trackAreaRef.current) return 0;
    const rect = trackAreaRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (x / rect.width) * video.duration;
  };

  const clamp = (val, lo, hi) => Math.max(lo, Math.min(hi, val));

  // ── Pointer drag factory ─────────────────────────
  const startDrag = (e, onMove) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const handleMove = (mv) => onMove(mv.clientX);
    const handleUp   = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup',   handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup',   handleUp);
  };

  // ── Playhead / Track Seek ────────────────────────
  const handleTrackSeek = (e) => {
    if (e.target.closest('.timeline-handle') || e.target.closest('.timeline-layer-block')) return;
    const newTime = pointerToTime(e.clientX);
    setVideo((prev) => ({ ...prev, currentTime: newTime, playing: false }));
    startDrag(e, (clientX) => {
      setVideo((prev) => ({ ...prev, currentTime: clamp(pointerToTime(clientX), 0, prev.duration), playing: false }));
    });
  };

  // ── Hook region handle drag ──────────────────────
  const startHookHandleDrag = (e, type) => {
    const snapStart    = hookConfig.timing.startTime;
    const snapDuration = hookConfig.timing.duration;
    const snapEnd      = snapStart + snapDuration;

    startDrag(e, (clientX) => {
      const t = pointerToTime(clientX);
      if (type === 'start') {
        const safeStart = clamp(t, 0, snapEnd - 0.2);
        setHookConfig((prev) => ({
          ...prev,
          timing: { ...prev.timing, startTime: safeStart, duration: snapEnd - safeStart },
        }));
      } else {
        const safeEnd = clamp(t, snapStart + 0.2, video.duration || 9999);
        setHookConfig((prev) => ({
          ...prev,
          timing: { ...prev.timing, startTime: snapStart, duration: safeEnd - snapStart },
        }));
      }
    });
  };

  // ── Per-layer timing drag ────────────────────────
  const startLayerDrag = (e, textId, type) => {
    const text = hookConfig.texts.find(t => t.id === textId);
    if (!text) return;

    const hookStart = hookConfig.timing.startTime;
    const hookDur   = hookConfig.timing.duration;
    const stagger   = hookConfig.motionProfile?.stagger ?? 0.15;
    
    // Initial values
    const currentEntry = text.entryTime ?? (hookConfig.texts.indexOf(text) * stagger + 0.1);
    const currentDur   = text.duration ?? (hookDur - currentEntry);

    startDrag(e, (clientX) => {
      const videoTime = pointerToTime(clientX);
      const offset    = videoTime - hookStart;

      setHookConfig((prev) => ({
        ...prev,
        texts: prev.texts.map((t) => {
          if (t.id !== textId) return t;
          
          if (type === 'start') {
            const newEntry = clamp(offset, 0, (t.duration ?? (hookDur - currentEntry)) + currentEntry - 0.1);
            const newDur   = (t.duration ?? (hookDur - currentEntry)) + (currentEntry - newEntry);
            return { ...t, entryTime: parseFloat(newEntry.toFixed(2)), duration: parseFloat(newDur.toFixed(2)) };
          } else if (type === 'end') {
            const newDur = clamp(offset - currentEntry, 0.1, hookDur - currentEntry);
            return { ...t, duration: parseFloat(newDur.toFixed(2)) };
          } else {
            // Move entire block
            const newEntry = clamp(offset, 0, hookDur - currentDur);
            return { ...t, entryTime: parseFloat(newEntry.toFixed(2)), duration: currentDur };
          }
        }),
      }));
    });
  };

  const dur          = video.duration || 1;
  const progressPct  = (video.currentTime / dur) * 100;
  const hookStartPct = (hookConfig.timing.startTime / dur) * 100;
  const hookEndPct   = ((hookConfig.timing.startTime + hookConfig.timing.duration) / dur) * 100;

  return (
    <div className="timeline-bar">
      <button
        className="play-btn"
        onClick={() => setVideo(v => ({ ...v, playing: !v.playing }))}
        disabled={!video.url}
        style={{ marginTop: 24 }}
      >
        {video.playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
      </button>

      <div className="timeline-track-area">
        {/* Timecodes */}
        <div className="timeline-timecodes">
          <span>{formatTime(video.currentTime)}</span>
          <div className="timeline-hook-badge">
            <Hash size={10} />
            <span>HOOK: {formatTime(hookConfig.timing.startTime)} – {formatTime(hookConfig.timing.startTime + hookConfig.timing.duration)}</span>
          </div>
          <span>{formatTime(video.duration)}</span>
        </div>

        {/* Multi-track Container */}
        <div 
          ref={trackAreaRef}
          className="timeline-tracks-container"
          onPointerDown={video.url ? handleTrackSeek : undefined}
        >
          {/* 1. Global Hook Track */}
          <div className="timeline-row global-track">
            <div className="timeline-track-base" />
            
            {video.duration > 0 && (
              <div 
                className="hook-range-bar"
                style={{ left: `${hookStartPct}%`, width: `${hookEndPct - hookStartPct}%` }}
              >
                <div className="hook-label">HOOK REGION</div>
                <div className="timeline-handle start" onPointerDown={(e) => startHookHandleDrag(e, 'start')} />
                <div className="timeline-handle end" onPointerDown={(e) => startHookHandleDrag(e, 'end')} />
              </div>
            )}
          </div>

          {/* 2. Individual Layer Tracks */}
          <div className="timeline-layers-scroll">
            {hookConfig.texts.map((text, idx) => {
              const stagger = hookConfig.motionProfile?.stagger ?? 0.15;
              const entry = text.entryTime ?? (idx * stagger + 0.1);
              const duration = text.duration ?? (hookConfig.timing.duration - entry);
              
              const startPct = ((hookConfig.timing.startTime + entry) / dur) * 100;
              const widthPct = (duration / dur) * 100;
              const color = text.fill || 'var(--accent-primary)';

              return (
                <div key={text.id} className="timeline-row layer-track">
                  <div className="timeline-track-base" />
                  <div 
                    className="layer-block"
                    style={{ 
                      left: `${startPct}%`, 
                      width: `${widthPct}%`,
                      '--layer-color': color 
                    }}
                    onPointerDown={(e) => startLayerDrag(e, text.id, 'move')}
                  >
                    <div className="layer-block-label">{text.content || `Layer ${idx + 1}`}</div>
                    <div className="layer-handle start" onPointerDown={(e) => startLayerDrag(e, text.id, 'start')} />
                    <div className="layer-handle end" onPointerDown={(e) => startLayerDrag(e, text.id, 'end')} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Playhead (Overlay) */}
          <div className="timeline-playhead" style={{ left: `${progressPct}%` }}>
            <div className="playhead-tip" />
          </div>
        </div>
      </div>
    </div>
  );
}
