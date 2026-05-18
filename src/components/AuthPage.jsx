import React, { useState } from 'react';
import { Zap, Mail, ArrowRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ onSkip }) {
  const { signInWithEmail, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || emailLoading) return;
    setError(null);
    setEmailLoading(true);
    try {
      await signInWithEmail(email.trim());
      setEmailSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send magic link. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (googleLoading) return;
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // OAuth will redirect the page — no need to reset loading state
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0d18 50%, #0a0a0f 100%)',
      zIndex: 9999,
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        height: 600,
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 400,
        padding: '0 24px',
      }}>
        {/* Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.035)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          padding: '40px 36px 32px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(99,102,241,0.1)',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
            }}>
              <Zap size={22} color="#fff" strokeWidth={2.5} />
            </div>
            <h1 style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}>
              HookForge
            </h1>
            <p style={{
              margin: '6px 0 0',
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.45)',
              textAlign: 'center',
            }}>
              Sign in to save and sync your projects
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              marginBottom: 20,
              fontSize: 13,
              color: '#fca5a5',
            }}>
              <AlertCircle size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Email form */}
          {emailSent ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              padding: '24px 0',
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
              }}>
                <Check size={20} color="#4ade80" strokeWidth={2.5} />
              </div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>Check your email</p>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
                We sent a magic link to <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{email}</strong>
              </p>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} style={{ marginBottom: 0 }}>
              <div style={{ marginBottom: 10 }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.15s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                />
              </div>
              <button
                type="submit"
                disabled={emailLoading || !email.trim()}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: emailLoading || !email.trim()
                    ? 'rgba(99, 102, 241, 0.4)'
                    : 'linear-gradient(135deg, #6366f1, #7c3aed)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: emailLoading || !email.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'opacity 0.15s',
                }}
              >
                {emailLoading ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    Sending…
                  </>
                ) : (
                  <>
                    <Mail size={15} strokeWidth={2} />
                    Send magic link
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Separator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            margin: '20px 0',
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: googleLoading ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { if (!googleLoading) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { if (!googleLoading) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          >
            {googleLoading ? (
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              /* Google "G" SVG icon */
              <svg width="16" height="16" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                <path fill="#EA4335" d="M24 9.5c3.1 0 5.9 1.1 8.1 2.9l6-6C34.5 3.1 29.5 1 24 1 14.8 1 7 6.7 3.7 14.7l7 5.4C12.5 13.6 17.8 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.4 5.5-5 7.2l7.7 6C43.4 37.5 46.5 31.5 46.5 24.5z" />
                <path fill="#FBBC05" d="M10.7 28.8a14.6 14.6 0 0 1 0-9.6l-7-5.4A23 23 0 0 0 1 24c0 3.7.9 7.2 2.6 10.2l7.1-5.4z" />
                <path fill="#34A853" d="M24 47c5.5 0 10.1-1.8 13.5-4.9l-7.7-6c-1.9 1.3-4.3 2-6.8 2-6.2 0-11.5-4.1-13.3-9.8l-7.1 5.4C7 40.3 14.8 47 24 47z" />
              </svg>
            )}
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>
        </div>

        {/* Skip link */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={onSkip}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.3)',
              fontSize: 13,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 6,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
          >
            Continue without signing in
          </button>
        </div>
      </div>

      {/* Keyframe for spinner — injected once */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
