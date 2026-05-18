import React, { useState } from 'react';
import './App.css';
import VideoPreview from './components/VideoPreview';
import ControlsPanel from './components/ControlsPanel';
import TimelineScrubber from './components/TimelineScrubber';
import CanvasToolbar from './components/CanvasToolbar';
import ExportModal from './components/ExportModal';
import AuthPage from './components/AuthPage';
import ProjectsModal from './components/ProjectsModal';
import { useHookStore } from './context/HookContext';
import { useAuth } from './context/AuthContext';
import { isSupabaseEnabled } from './lib/supabase';
import { Zap, Layers, Clapperboard, FolderOpen, LogOut, Loader2, Save } from 'lucide-react';

// ── Save-status indicator ────────────────────────────────────────────────────
function SaveStatus({ status }) {
  if (!status || status === 'idle') return null;

  const config = {
    saving: { color: '#94a3b8', dotColor: '#94a3b8', label: 'Saving…', spin: true },
    saved:  { color: '#4ade80', dotColor: '#4ade80', label: 'Saved',   spin: false },
    error:  { color: '#f87171', dotColor: '#ef4444', label: 'Save failed', spin: false },
  }[status];

  if (!config) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      color: config.color,
      fontWeight: 500,
      letterSpacing: '0.01em',
    }}>
      {config.spin ? (
        <Loader2 size={12} style={{ animation: 'spin 1s linear infinite', color: config.dotColor }} />
      ) : (
        <span style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: config.dotColor,
          display: 'inline-block',
          boxShadow: status === 'saved' ? `0 0 8px ${config.dotColor}` : undefined,
        }} />
      )}
      {config.label}
    </div>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────
function Header({ onProjectsClick }) {
  const { appMode, setAppMode, projectSaveStatus } = useHookStore();
  const { user, signOut } = useAuth();

  return (
    <header className="header">
      <div className="header-brand">
        <div className="brand-icon">
          <Zap size={14} color="#fff" strokeWidth={2.5} />
        </div>
        <h1>HookForge</h1>
        <span className="badge">ALPHA</span>
      </div>

      <div className="header-center">
        <div className="mode-toggle">
          <button
            className={`mode-toggle-btn ${appMode === 'design' ? 'active' : ''}`}
            onClick={() => setAppMode('design')}
          >
            <Layers size={12} strokeWidth={2.5} />
            Design
          </button>
          <button
            className={`mode-toggle-btn ${appMode === 'play' ? 'active' : ''}`}
            onClick={() => setAppMode('play')}
          >
            <Clapperboard size={12} strokeWidth={2.5} />
            Preview
          </button>
        </div>
      </div>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Save status — only shown when Supabase is active */}
        {isSupabaseEnabled && <SaveStatus status={projectSaveStatus} />}

        {/* Projects button — only when Supabase + user */}
        {isSupabaseEnabled && user && (
          <button
            onClick={onProjectsClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
          >
            <FolderOpen size={13} strokeWidth={2} />
            Projects
          </button>
        )}

        {/* User avatar / sign-out */}
        {isSupabaseEnabled && user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (user.email?.[0] ?? '?').toUpperCase()
              )}
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 7,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.35)',
                cursor: 'pointer',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            >
              <LogOut size={13} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [skippedAuth, setSkippedAuth] = useState(false);
  const { timelineH } = useHookStore();
  const { user, loading } = useAuth();

  // Show full-screen spinner while Supabase resolves the initial session
  if (isSupabaseEnabled && loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        zIndex: 9999,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Zap size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <Loader2 size={20} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Show auth gate if Supabase is enabled, user is not signed in, and hasn't skipped
  if (isSupabaseEnabled && !user && !skippedAuth) {
    return <AuthPage onSkip={() => setSkippedAuth(true)} />;
  }

  return (
    <div className="app-container">
      <Header onProjectsClick={() => setShowProjectsModal(true)} />

      <main className="main-content">
        <section className="preview-section">
          <CanvasToolbar />
          <div className="canvas-container">
            <VideoPreview />
          </div>
          <div className="timeline-section" style={{ height: timelineH, minHeight: timelineH }}>
            <TimelineScrubber />
          </div>
        </section>

        <section className="controls-section">
          <ControlsPanel onExport={() => setShowExportModal(true)} />
        </section>
      </main>

      {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} />}
      {showProjectsModal && <ProjectsModal onClose={() => setShowProjectsModal(false)} />}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default App;
