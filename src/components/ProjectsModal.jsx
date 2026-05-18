import React, { useCallback, useEffect, useState } from 'react';
import { X, FolderOpen, Plus, Trash2, Upload, Loader2, FolderX, Calendar, Film, Edit3, Check } from 'lucide-react';
import { listProjects, deleteProject as dbDeleteProject, updateProject } from '../lib/db';
import { useHookStore } from '../context/HookContext';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function ProjectCard({ project, onLoad, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const commitRename = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === project.name) {
      setName(project.name);
      setEditing(false);
      return;
    }
    await onRename(project.id, trimmed);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') { setName(project.name); setEditing(false); }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      transition: 'border-color 0.15s, background 0.15s',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      {/* Icon */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: 'rgba(99,102,241,0.12)',
        border: '1px solid rgba(99,102,241,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Film size={16} color="#818cf8" strokeWidth={1.8} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleKeyDown}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(99,102,241,0.5)',
                borderRadius: 6,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                padding: '3px 8px',
                outline: 'none',
                width: '100%',
              }}
            />
            <button onClick={commitRename} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4ade80', padding: 2 }}>
              <Check size={14} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <div
            style={{ fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            onDoubleClick={() => setEditing(true)}
            title="Double-click to rename"
          >
            {project.name}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={10} strokeWidth={2} />
            {formatDate(project.updated_at)}
          </span>
          {project.video_name && (
            <span style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.3)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 140,
            }}>
              {project.video_name}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => setEditing(true)}
          title="Rename"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.25)',
            padding: 6,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
        >
          <Edit3 size={13} strokeWidth={2} />
        </button>

        {deleteConfirm ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#fca5a5' }}>Delete?</span>
            <button
              onClick={() => onDelete(project.id)}
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 6,
                color: '#f87171',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '3px 8px',
              }}
            >
              Yes
            </button>
            <button
              onClick={() => setDeleteConfirm(false)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                cursor: 'pointer',
                padding: '3px 8px',
              }}
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirm(true)}
            title="Delete project"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.25)',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
          >
            <Trash2 size={13} strokeWidth={2} />
          </button>
        )}

        <button
          onClick={() => onLoad(project.id)}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <FolderOpen size={12} strokeWidth={2.5} />
          Load
        </button>
      </div>
    </div>
  );
}

export default function ProjectsModal({ onClose }) {
  const { createBlankHook, loadProjectById, video } = useHookStore();

  const [projects, setProjects] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setFetchLoading(true);
    setFetchError(null);
    try {
      const data = await listProjects();
      setProjects(data);
    } catch (err) {
      setFetchError(err.message || 'Failed to load projects.');
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleLoad = async (id) => {
    setActionLoading(true);
    try {
      await loadProjectById(id);
      onClose();
    } catch (err) {
      console.error('[ProjectsModal] Load failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await dbDeleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('[ProjectsModal] Delete failed:', err);
    }
  };

  const handleRename = async (id, newName) => {
    try {
      await updateProject(id, { name: newName });
      setProjects((prev) => prev.map((p) => p.id === id ? { ...p, name: newName } : p));
    } catch (err) {
      console.error('[ProjectsModal] Rename failed:', err);
    }
  };

  const handleNewProject = () => {
    createBlankHook();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9000,
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%',
        maxWidth: 640,
        maxHeight: '80vh',
        background: '#0f0f18',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderOpen size={18} color="#818cf8" strokeWidth={2} />
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>Your Projects</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleNewProject}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                border: 'none',
                borderRadius: 9,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '7px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Plus size={14} strokeWidth={2.5} />
              New project
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                padding: 6,
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Video upload status notice */}
        {video?.localFile && !video?.storagePath && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 24px',
            background: 'rgba(251,191,36,0.06)',
            borderBottom: '1px solid rgba(251,191,36,0.12)',
            fontSize: 12,
            color: '#fcd34d',
          }}>
            <Upload size={13} strokeWidth={2} />
            Video will be uploaded when you save a new project.
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px' }}>
          {(actionLoading) && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              borderRadius: 20,
            }}>
              <Loader2 size={28} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {fetchLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 0', color: 'rgba(255,255,255,0.3)' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 14 }}>Loading projects…</span>
            </div>
          ) : fetchError ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '48px 0', color: '#fca5a5' }}>
              <p style={{ margin: 0, fontSize: 14 }}>{fetchError}</p>
              <button
                onClick={fetchProjects}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                  cursor: 'pointer',
                  padding: '6px 14px',
                }}
              >
                Retry
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '48px 0', color: 'rgba(255,255,255,0.3)' }}>
              <FolderX size={32} strokeWidth={1.5} />
              <p style={{ margin: 0, fontSize: 14 }}>No saved projects yet.</p>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Create your first project to save your work.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onLoad={handleLoad}
                  onDelete={handleDelete}
                  onRename={handleRename}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
