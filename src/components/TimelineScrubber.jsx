import React, { useRef } from 'react';
import { useHookStore } from '../context/HookContext';
import { Play, Pause } from 'lucide-react';

function formatTime(t) {
  if (isNaN(t) || t < 0) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TimelineScrubber() {
  const { video, setVideo, hookConfig } = useHookStore();
  const trackRef = useRef(null);

  const togglePlay = () => {
    if (!video.url) return;
    setVideo(prev => ({ ...prev, playing: !prev.playing }));
  };

  const scrubTo = (e) => {
    if (!video.duration || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newTime = (x / rect.width) * video.duration;
    setVideo(prev => ({ ...prev, currentTime: newTime, playing: false }));
  };

  const handleMouseDown = (e) => {
    scrubTo(e);
    const onMove = (e) => scrubTo(e);
    const onUp   = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const progressPct  = video.duration ? (video.currentTime / video.duration) * 100 : 0;
  const hookStartPct = video.duration ? (hookConfig.timing.startTime / video.duration) * 100 : 0;
  const hookEndPct   = video.duration
    ? Math.min(100, ((hookConfig.timing.startTime + hookConfig.timing.duration) / video.duration) * 100)
    : 0;

  return (
    <div className="timeline-bar">
      <button
        className="play-btn"
        onClick={togglePlay}
        disabled={!video.url}
        title={video.playing ? 'Pause' : 'Play'}
      >
        {video.playing
          ? <Pause size={15} strokeWidth={2.5} />
          : <Play  size={15} strokeWidth={2.5} style={{ marginLeft: 1 }} />
        }
      </button>

      <div className="timeline-track-area">
        <div className="timeline-timecodes">
          <span>{formatTime(video.currentTime)}</span>
          {video.duration > 0 && hookStartPct > 0 && (
            <span style={{ color: 'var(--accent-primary)', fontSize: 9 }}>
              Hook @ {formatTime(hookConfig.timing.startTime)}
            </span>
          )}
          <span>{formatTime(video.duration)}</span>
        </div>

        <div
          ref={trackRef}
          className="timeline-track"
          data-disabled={!video.url}
          onMouseDown={video.url ? handleMouseDown : undefined}
        >
          {/* Played region */}
          <div
            className="timeline-progress"
            style={{ width: `${progressPct}%` }}
          />

          {/* Hook region */}
          {video.duration > 0 && (
            <div
              className="timeline-hook-region"
              style={{
                left:  `${hookStartPct}%`,
                width: `${hookEndPct - hookStartPct}%`,
              }}
            />
          )}

          {/* Scrubber head */}
          <div
            className="timeline-scrubber"
            style={{ left: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
