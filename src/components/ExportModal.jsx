import React, { useState } from 'react';
import { useHookStore } from '../context/HookContext';
import { CheckCircle2, Download, Video, X } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function ExportModal({ onClose }) {
  const { setVideo, hookConfig } = useHookStore();
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const startExport = async () => {
    const container = document.getElementById('hook-export-container');
    if (!container) {
      alert('Hook container not found - scrub your video to the hook start time first.');
      return;
    }

    setPhase('exporting');
    setProgress(0);
    setDownloadUrl(null);

    const rect = container.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d');

    let mimeType = 'video/webm; codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setDownloadUrl(URL.createObjectURL(blob));
      setPhase('done');
      setVideo((prev) => ({ ...prev, playing: true }));
    };

    recorder.start();

    setVideo((prev) => ({ ...prev, playing: false, currentTime: hookConfig.timing.startTime - 0.1 }));
    await new Promise((resolve) => setTimeout(resolve, 100));
    setVideo((prev) => ({ ...prev, playing: true, currentTime: hookConfig.timing.startTime }));

    const durationMs = hookConfig.timing.duration * 1000;
    const startTs = performance.now();

    const captureFrame = async () => {
      const elapsed = performance.now() - startTs;
      setProgress(Math.min((elapsed / durationMs) * 100, 100));

      if (elapsed >= durationMs) {
        recorder.stop();
        return;
      }

      try {
        const temp = await html2canvas(container, {
          backgroundColor: null,
          scale: 1,
          logging: false,
        });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(temp, 0, 0);
      } catch {
        // Keep rendering even if a frame capture fails.
      }

      requestAnimationFrame(captureFrame);
    };

    captureFrame();
  };

  return (
    <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal-card">
        <button className="modal-close" onClick={onClose}>
          <X size={16} />
        </button>

        {phase === 'idle' && (
          <>
            <h2 className="modal-title">Export hook overlay</h2>
            <p className="modal-desc">
              Renders the animated text overlay with a transparent background as a
              WebM file. Overlay it on your video in any editor.
            </p>
            <div style={{ marginBottom: 20, padding: '12px 14px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Template</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{hookConfig.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Duration</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{hookConfig.timing.duration}s</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Layers</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{hookConfig.texts.length}</span>
              </div>
            </div>
            <button className="btn-primary" onClick={startExport}>
              <Video size={15} />
              Start render
            </button>
          </>
        )}

        {phase === 'exporting' && (
          <>
            <h2 className="modal-title">Rendering...</h2>
            <p className="modal-desc">Please keep this tab focused during export.</p>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{Math.round(progress)}%</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {(hookConfig.timing.duration * (1 - progress / 100)).toFixed(1)}s remaining
              </span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </>
        )}

        {phase === 'done' && (
          <>
            <div className="success-icon">
              <CheckCircle2 size={22} />
            </div>
            <h2 className="modal-title" style={{ textAlign: 'center', marginBottom: 6 }}>Export complete</h2>
            <p className="modal-desc" style={{ textAlign: 'center', marginBottom: 20 }}>
              Your WebM overlay is ready. Import it as a transparent layer in your video editor.
            </p>
            <a href={downloadUrl} download="hookforge_overlay.webm" className="btn-primary" style={{ marginBottom: 10, textDecoration: 'none' }}>
              <Download size={15} />
              Download WebM
            </a>
            <button className="btn-secondary" onClick={() => setPhase('idle')}>
              Export again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
