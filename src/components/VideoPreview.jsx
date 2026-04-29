import React, { useRef } from 'react';
import { useHookStore } from '../context/HookContext';
import { Upload } from 'lucide-react';
import HookOverlay from './HookOverlay';
import InstagramSafeZones from './InstagramSafeZones';

export default function VideoPreview() {
  const { video, setVideo, hookConfig } = useHookStore();
  const videoRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideo(prev => ({ ...prev, url }));
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setVideo(prev => ({ ...prev, currentTime: videoRef.current.currentTime }));
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideo(prev => ({ ...prev, duration: videoRef.current.duration }));
    }
  };

  React.useEffect(() => {
    if (videoRef.current) {
      if (video.playing && videoRef.current.paused) {
        videoRef.current.play();
      } else if (!video.playing && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, [video.playing]);

  React.useEffect(() => {
    if (videoRef.current && !video.playing && Math.abs(videoRef.current.currentTime - video.currentTime) > 0.1) {
      videoRef.current.currentTime = video.currentTime;
    }
  }, [video.currentTime, video.playing]);

  return (
    <div
      className="video-wrapper"
      style={{
        background: `radial-gradient(circle at 50% 18%, ${hookConfig.accent}26 0%, rgba(0,0,0,0) 42%), ${hookConfig.design?.bgColor || '#000'}`,
        boxShadow: `0 0 0 1px var(--border-subtle), 0 24px 60px ${hookConfig.accent}22`,
      }}
    >
      {!video.url ? (
        <div className="upload-zone">
          <div className="upload-icon-wrap">
            <Upload size={22} strokeWidth={1.5} />
          </div>
          <p className="upload-title">Drop your video here</p>
          <p className="upload-sub">Vertical 9:16 works best<br />MP4, MOV, WebM supported</p>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
          />
        </div>
      ) : (
        <>
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 12,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              padding: '8px 10px',
              borderRadius: 999,
              background: 'rgba(8, 8, 12, 0.68)',
              border: `1px solid ${hookConfig.accent}55`,
              backdropFilter: 'blur(12px)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: hookConfig.accent,
                boxShadow: `0 0 16px ${hookConfig.accent}`,
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {hookConfig.name}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {hookConfig.category}
            </span>
          </div>
          <video
            ref={videoRef}
            src={video.url}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setVideo(prev => ({ ...prev, playing: false }))}
          />
          <HookOverlay />
          {video.showSafeZones && <InstagramSafeZones />}
        </>
      )}
    </div>
  );
}
