import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useHookStore } from '../context/HookContext';
import HookOverlay from './HookOverlay';
import InstagramSafeZones from './InstagramSafeZones';

// Phone frame shell — only wraps when showPhoneFrame is on
function FrameShell({ children, accent, enabled }) {
  if (!enabled) return <>{children}</>;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      padding: '14px',
      borderRadius: 42,
      background: 'linear-gradient(180deg, #18181f 0%, #08080c 100%)',
      boxShadow: `0 26px 90px ${accent}24, inset 0 0 0 1px rgba(255,255,255,0.06)`,
    }}>
      {/* notch */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 24, borderRadius: 999,
        background: '#050507', zIndex: 15,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
      }} />
      {children}
    </div>
  );
}

export default function VideoPreview() {
  const { video, setVideo, hookConfig, activeTool, videoElRef } = useHookStore();
  const videoRef = useRef(null);

  // Keep the store's videoElRef in sync so KaraokeText can read currentTime via rAF
  React.useEffect(() => {
    videoElRef.current = videoRef.current;
  });


  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVideo((prev) => ({ ...prev, url: URL.createObjectURL(file), localFile: file, name: file.name }));
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setVideo((prev) => ({ ...prev, currentTime: videoRef.current.currentTime }));
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideo((prev) => ({ ...prev, duration: videoRef.current.duration }));
    }
  };

  React.useEffect(() => {
    if (!videoRef.current) return;
    if (video.playing && videoRef.current.paused) videoRef.current.play();
    else if (!video.playing && !videoRef.current.paused) videoRef.current.pause();
  }, [video.playing]);

  React.useEffect(() => {
    if (videoRef.current && !video.playing && Math.abs(videoRef.current.currentTime - video.currentTime) > 0.1) {
      videoRef.current.currentTime = video.currentTime;
    }
  }, [video.currentTime, video.playing]);

  const accent = hookConfig.accent || '#6366f1';

  return (
    <div
      className="video-wrapper"
      style={{
        background: `radial-gradient(circle at 50% 18%, ${accent}20 0%, rgba(0,0,0,0) 55%), #000`,
        boxShadow: `0 0 0 1px var(--border-subtle), 0 24px 60px ${accent}18`,
        // Crosshair when text tool active
        cursor: activeTool === 'text' ? 'crosshair' : 'default',
      }}
    >
      <FrameShell accent={accent} enabled={video.showPhoneFrame}>
        {/* This wrapper is always relative so HookOverlay can be absolutely positioned */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: video.showPhoneFrame ? 28 : 0,
          background: '#000',
        }}>
          {/* Video OR upload zone */}
          {!video.url ? (
            <div className="upload-zone">
              <div className="upload-icon-wrap">
                <Upload size={22} strokeWidth={1.5} />
              </div>
              <p className="upload-title">Drop your video here</p>
              <p className="upload-sub">Vertical 9:16 works best<br />MP4, MOV, WebM supported</p>
              <input type="file" accept="video/*" onChange={handleFileUpload} />
            </div>
          ) : (
            <>
              {/* Active hook name badge */}
              <div style={{
                position: 'absolute', top: 12, left: 12, zIndex: 12,
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '6px 10px', borderRadius: 999,
                background: 'rgba(8, 8, 12, 0.68)',
                border: `1px solid ${accent}55`,
                backdropFilter: 'blur(12px)',
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: accent, boxShadow: `0 0 10px ${accent}`,
                }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {hookConfig.name}
                </span>
              </div>

              <video
                ref={videoRef}
                src={video.url}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setVideo((prev) => ({ ...prev, playing: false }))}
              />
            </>
          )}

          {/* HookOverlay is ALWAYS rendered — visible in design mode without a video */}
          <HookOverlay />

          {video.showSafeZones && <InstagramSafeZones />}
        </div>
      </FrameShell>
    </div>
  );
}
