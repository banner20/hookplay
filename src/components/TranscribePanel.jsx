import React, { useState, useCallback, useEffect } from 'react';
import { Mic, Loader2, CheckCircle2, AlertCircle, Wand2, Key, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useHookStore } from '../context/HookContext';
import { transcriptToLayers } from '../utils/transcriptToLayers';

// ─── Constants ─────────────────────────────────────────────────────────────────
const GROQ_API_KEY_LS = 'hookforge.groq-api-key';
const GROQ_ENDPOINT   = 'https://api.groq.com/openai/v1/audio/transcriptions';
const WHISPER_MODEL   = 'whisper-large-v3-turbo';

// ─── Grouping modes ────────────────────────────────────────────────────────────
const GROUPING_MODES = [
  { id: 'segment', label: 'Sentence',  desc: 'One block per sentence',   maxWords: 999, pause: 0 },
  { id: '4-word',  label: '4 Words',   desc: 'Groups of up to 4 words',  maxWords: 4,   pause: 0.35 },
  { id: '2-word',  label: '2 Words',   desc: 'Groups of up to 2 words',  maxWords: 2,   pause: 0.25 },
  { id: 'word',    label: 'Word',      desc: 'One layer per word',        maxWords: 1,   pause: 0 },
];

// ─── Caption style presets ─────────────────────────────────────────────────────
const CAPTION_STYLES = [
  {
    id: 'subtitle',
    label: 'Subtitle',
    desc: 'Bottom, readable',
    opts: { fontSize: 26, captionY: 80, hasStroke: true, strokeWidth: 2, bgColor: 'transparent', animation: 'drift-up' },
  },
  {
    id: 'impact',
    label: 'Impact',
    desc: 'Center, bold',
    opts: { fontSize: 42, captionY: 50, hasStroke: false, bgColor: 'transparent', animation: 'slam' },
  },
  {
    id: 'boxed',
    label: 'Boxed',
    desc: 'Black pill BG',
    opts: { fontSize: 24, captionY: 80, hasStroke: false, bgColor: 'rgba(0,0,0,0.75)', bgStyle: 'pill', animation: 'fade-up' },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    desc: 'Clean, no stroke',
    opts: { fontSize: 22, captionY: 82, hasStroke: false, bgColor: 'transparent', animation: 'fade-up' },
  },
];

// ─── Float32Array → 16-bit WAV Blob ───────────────────────────────────────────
function float32ToWav(samples, sampleRate) {
  const numChannels  = 1;
  const bitsPerSample = 16;
  const byteRate     = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign   = numChannels * (bitsPerSample / 8);
  const dataSize     = samples.length * 2;
  const buf          = new ArrayBuffer(44 + dataSize);
  const view         = new DataView(buf);

  const writeStr = (off, s) => [...s].forEach((c, i) => view.setUint8(off + i, c.charCodeAt(0)));
  writeStr(0,  'RIFF');
  view.setUint32(4,  36 + dataSize, true);
  writeStr(8,  'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16,           true); // PCM subchunk size
  view.setUint16(20, 1,            true); // PCM = 1
  view.setUint16(22, numChannels,  true);
  view.setUint32(24, sampleRate,   true);
  view.setUint32(28, byteRate,     true);
  view.setUint16(32, blockAlign,   true);
  view.setUint16(34, bitsPerSample,true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize,     true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buf], { type: 'audio/wav' });
}

// ─── Audio extraction helper ───────────────────────────────────────────────────
// Returns { samples: Float32Array, sampleRate: 16000 }
// durSec ≤ 0  →  extract to end of file
async function extractAudioForGroq(blobUrl, startSec, durSec, onStatus) {
  onStatus?.('fetching');
  const res = await fetch(blobUrl);
  if (!res.ok) throw new Error(`Could not fetch video (${res.status})`);
  const arrayBuffer = await res.arrayBuffer();

  onStatus?.('decoding');
  const decodeCtx  = new AudioContext();
  const fullBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
  await decodeCtx.close();

  const TARGET_SR  = 16_000;
  const clampStart = Math.max(0, Math.min(startSec, fullBuffer.duration));
  const clampDur   = durSec > 0
    ? Math.min(durSec,  fullBuffer.duration - clampStart)
    : (fullBuffer.duration - clampStart);

  onStatus?.('resampling');
  const offCtx = new OfflineAudioContext(1, Math.ceil(clampDur * TARGET_SR), TARGET_SR);
  const source = offCtx.createBufferSource();
  source.buffer = fullBuffer;
  source.connect(offCtx.destination);
  source.start(0, clampStart, clampDur);

  const rendered = await offCtx.startRendering();
  return { samples: rendered.getChannelData(0), sampleRate: TARGET_SR };
}

// ─── Convert Groq verbose_json → transcriptToLayers chunk format ───────────────
function groqToChunks(result, groupingId) {
  if (groupingId === 'segment') {
    return (result.segments ?? []).map((s) => ({
      text:      s.text,
      timestamp: [s.start, s.end],
    }));
  }
  // word / N-word: use word-level granularity
  return (result.words ?? []).map((w) => ({
    text:      w.word,
    timestamp: [w.start, w.end],
  }));
}

// ─── Status label helper ───────────────────────────────────────────────────────
function statusLabel(status) {
  switch (status) {
    case 'fetching':   return 'Fetching video…';
    case 'decoding':   return 'Decoding audio…';
    case 'resampling': return 'Resampling to 16 kHz…';
    case 'uploading':  return 'Sending to Groq…';
    default:           return 'Processing…';
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function TranscribePanel() {
  const { hookConfig, setHookConfig, video } = useHookStore();
  const { timing } = hookConfig;

  // ── Persistent state ───────────────────────────────────────────────────────
  const [apiKey,   setApiKey]   = useState(() => localStorage.getItem(GROQ_API_KEY_LS) ?? '');
  const [showKey,  setShowKey]  = useState(false);
  const [scope,    setScope]    = useState('full');    // 'full' | 'hook'
  const [grouping, setGrouping] = useState('4-word');
  const [language,     setLanguage]     = useState('');           // '' = auto-detect
  const [prompt,       setPrompt]       = useState('');           // optional context hint
  const [captionStyle, setCaptionStyle] = useState('subtitle');   // caption style preset id
  const [fontSize,     setFontSize]     = useState(26);           // manual font size override
  const [captionY,     setCaptionY]     = useState(80);           // vertical position %
  const [textCase,     setTextCase]     = useState('upper');      // 'upper' | 'none'

  // ── Transcription state ────────────────────────────────────────────────────
  const [txStatus,  setTxStatus]  = useState('idle'); // idle | fetching | decoding | resampling | uploading | done | error
  const [txError,   setTxError]   = useState('');
  const [rawResult, setRawResult] = useState(null);   // Groq verbose_json response
  const [phrases,   setPhrases]   = useState([]);
  const [applied,   setApplied]   = useState(false);

  // ── Save API key to localStorage ───────────────────────────────────────────
  const saveKey = (val) => {
    setApiKey(val);
    if (val.trim()) localStorage.setItem(GROQ_API_KEY_LS, val.trim());
    else            localStorage.removeItem(GROQ_API_KEY_LS);
  };

  // ── Re-derive phrases when grouping / style / raw result changes ───────────
  useEffect(() => {
    if (!rawResult) { setPhrases([]); return; }

    const mode      = GROUPING_MODES.find((m) => m.id === grouping) ?? GROUPING_MODES[1];
    const stylePreset = CAPTION_STYLES.find((s) => s.id === captionStyle) ?? CAPTION_STYLES[0];
    const chunks    = groqToChunks(rawResult, grouping);
    const synth     = { chunks };
    const hookDur   = scope === 'full' ? 999_999 : timing.duration;

    const layers = transcriptToLayers(synth, timing.startTime, hookDur, {
      maxWords:       mode.maxWords,
      pauseThreshold: mode.pause,
      // Caption appearance from style preset + manual overrides
      ...stylePreset.opts,
      fontSize,
      captionY,
      textCase,
    });

    setPhrases(layers);
    setApplied(false);
  }, [rawResult, grouping, scope, captionStyle, fontSize, captionY, textCase, timing.startTime, timing.duration]);

  // ── Main transcription call ────────────────────────────────────────────────
  const runTranscribe = useCallback(async () => {
    if (!video.url || !apiKey.trim()) return;

    setTxStatus('fetching');
    setTxError('');
    setRawResult(null);
    setPhrases([]);
    setApplied(false);

    try {
      // Determine audio window
      const startSec = scope === 'hook' ? timing.startTime : 0;
      const durSec   = scope === 'hook' ? timing.duration  : 0; // 0 = full

      const { samples, sampleRate } = await extractAudioForGroq(
        video.url,
        startSec,
        durSec,
        (s) => setTxStatus(s),
      );

      const wavBlob = float32ToWav(samples, sampleRate);

      setTxStatus('uploading');

      const form = new FormData();
      form.append('file',    new File([wavBlob], 'audio.wav', { type: 'audio/wav' }));
      form.append('model',   WHISPER_MODEL);
      form.append('response_format', 'verbose_json');
      form.append('timestamp_granularities[]', 'word');
      form.append('timestamp_granularities[]', 'segment');
      if (language) form.append('language', language);
      if (prompt.trim()) form.append('prompt', prompt.trim());

      const res = await fetch(GROQ_ENDPOINT, {
        method:  'POST',
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
        body:    form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Groq API error ${res.status}`);
      }

      const data = await res.json();

      // For hook-window scope: timestamps from Groq are 0-relative to startSec.
      // entryTime in HookOverlay = timing.startTime + entryTime, so they are correct as-is.
      //
      // For full-video scope: timestamps are absolute (0 = video start).
      // We'll set timing.startTime = 0 when applying, so entryTime = absolute timestamp is correct.

      setRawResult(data);
      setTxStatus('done');
    } catch (err) {
      setTxStatus('error');
      setTxError(err.message);
    }
  }, [video.url, apiKey, scope, timing.startTime, timing.duration]);

  // ── Apply layers to timeline ───────────────────────────────────────────────
  const doApply = useCallback((replace) => {
    if (!phrases.length) return;

    const maxEnd = phrases.reduce((m, p) => Math.max(m, p.entryTime + p.duration), 0);

    setHookConfig((prev) => {
      // For full-video scope: anchor hook to video start and extend duration.
      // For hook-window scope: only extend duration if needed.
      const newStartTime = scope === 'full' ? 0 : prev.timing.startTime;
      const minDuration  = maxEnd + 0.5;
      const newDuration  = Math.max(prev.timing.duration, minDuration);

      return {
        ...prev,
        texts:  replace ? phrases : [...prev.texts, ...phrases],
        timing: { ...prev.timing, startTime: newStartTime, duration: newDuration },
      };
    });

    setApplied(true);
  }, [phrases, scope, setHookConfig]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const isBusy      = ['fetching','decoding','resampling','uploading'].includes(txStatus);
  const canRun      = !!video.url && !!apiKey.trim() && !isBusy;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="tab-panel">

      {/* ── API Key ─────────────────────────────────────────────────────── */}
      <div className="tx-section">
        <p className="ctrl-section-label">
          <Key size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: '-2px' }} />
          Groq API key
        </p>
        <div className="tx-key-row">
          <input
            type={showKey ? 'text' : 'password'}
            className="tx-key-input"
            placeholder="gsk_…"
            value={apiKey}
            onChange={(e) => saveKey(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            className="tx-key-toggle"
            onClick={() => setShowKey((v) => !v)}
            title={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        <p className="tx-hint">
          Free tier · get one at{' '}
          <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="tx-link">
            console.groq.com
          </a>
          . Stored in your browser only.
        </p>
      </div>

      <div className="ctrl-divider" />

      {/* ── Scope ───────────────────────────────────────────────────────── */}
      <div className="tx-section">
        <p className="ctrl-section-label">What to transcribe</p>
        <div className="tx-scope-row">
          <button
            className={`tx-scope-btn ${scope === 'full' ? 'active' : ''}`}
            onClick={() => setScope('full')}
          >
            Full video
          </button>
          <button
            className={`tx-scope-btn ${scope === 'hook' ? 'active' : ''}`}
            onClick={() => setScope('hook')}
          >
            Hook window only
          </button>
        </div>
        {scope === 'hook' && (
          <div className="tx-window-row" style={{ marginTop: 8 }}>
            <div className="tx-window-chip">
              <span className="tx-chip-label">Start</span>
              <span className="tx-chip-val">{timing.startTime.toFixed(1)}s</span>
            </div>
            <div className="tx-window-chip">
              <span className="tx-chip-label">Duration</span>
              <span className="tx-chip-val">{timing.duration.toFixed(1)}s</span>
            </div>
            <div className="tx-window-chip">
              <span className="tx-chip-label">End</span>
              <span className="tx-chip-val">{(timing.startTime + timing.duration).toFixed(1)}s</span>
            </div>
          </div>
        )}
      </div>

      <div className="ctrl-divider" />

      {/* ── Grouping ─────────────────────────────────────────────────────── */}
      <div className="tx-section">
        <p className="ctrl-section-label">Caption grouping</p>
        <div className="tx-grouping-grid">
          {GROUPING_MODES.map((m) => (
            <button
              key={m.id}
              className={`tx-group-btn ${grouping === m.id ? 'active' : ''}`}
              onClick={() => setGrouping(m.id)}
            >
              <span className="tx-group-label">{m.label}</span>
              <span className="tx-group-desc">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ctrl-divider" />

      {/* ── Caption style ────────────────────────────────────────────────── */}
      <div className="tx-section">
        <p className="ctrl-section-label">Caption style</p>
        <div className="tx-grouping-grid" style={{ marginBottom: 10 }}>
          {CAPTION_STYLES.map((s) => (
            <button
              key={s.id}
              className={`tx-group-btn ${captionStyle === s.id ? 'active' : ''}`}
              onClick={() => {
                setCaptionStyle(s.id);
                setFontSize(s.opts.fontSize);
                setCaptionY(s.opts.captionY ?? 78);
              }}
            >
              <span className="tx-group-label">{s.label}</span>
              <span className="tx-group-desc">{s.desc}</span>
            </button>
          ))}
        </div>

        {/* Font size */}
        <div className="slider-wrapper">
          <div className="slider-header">
            <span className="ctrl-label">Font size</span>
            <span className="slider-value">{fontSize}px</span>
          </div>
          <input type="range" min={14} max={64} step={1} value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value, 10))} />
        </div>

        {/* Vertical position */}
        <div className="slider-wrapper" style={{ marginTop: 8 }}>
          <div className="slider-header">
            <span className="ctrl-label">Vertical position</span>
            <span className="slider-value">{captionY}%</span>
          </div>
          <input type="range" min={5} max={95} step={1} value={captionY}
            onChange={(e) => setCaptionY(parseInt(e.target.value, 10))} />
        </div>

        {/* Text case */}
        <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
          {[['upper', 'ALL CAPS'], ['none', 'Normal'], ['title', 'Title Case']].map(([val, label]) => (
            <button
              key={val}
              className={`tx-scope-btn ${textCase === val ? 'active' : ''}`}
              style={{ flex: 1, fontSize: 10 }}
              onClick={() => setTextCase(val)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="ctrl-divider" />

      {/* ── Language + prompt ────────────────────────────────────────────── */}
      <div className="tx-section">
        <p className="ctrl-section-label">Language</p>
        <select
          className="ctrl-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{ marginBottom: 10 }}
        >
          <option value="">Auto-detect</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="pt">Portuguese</option>
          <option value="it">Italian</option>
          <option value="nl">Dutch</option>
          <option value="pl">Polish</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="zh">Chinese</option>
          <option value="ru">Russian</option>
          <option value="ar">Arabic</option>
          <option value="hi">Hindi</option>
          <option value="tr">Turkish</option>
        </select>

        <p className="ctrl-section-label">Context hint (optional)</p>
        <input
          type="text"
          className="ctrl-input"
          placeholder="e.g. product names, technical jargon…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={{ marginBottom: 2 }}
        />
        <p className="tx-hint">Helps Whisper spell proper nouns correctly.</p>
      </div>

      <div className="ctrl-divider" />

      {/* ── Transcribe ───────────────────────────────────────────────────── */}
      <div className="tx-section">
        {!video.url && (
          <p className="tx-hint tx-hint-warn" style={{ marginBottom: 6 }}>
            Load a video first.
          </p>
        )}
        {!apiKey.trim() && (
          <p className="tx-hint tx-hint-warn" style={{ marginBottom: 6 }}>
            Enter your Groq API key above.
          </p>
        )}

        <button className="btn-primary tx-run-btn" onClick={runTranscribe} disabled={!canRun}>
          {isBusy
            ? <><Loader2 size={13} className="tx-spin" /> {statusLabel(txStatus)}</>
            : <><Mic size={13} /> Transcribe with Groq</>
          }
        </button>

        {txStatus === 'error' && (
          <div className="tx-status-row tx-status-err" style={{ marginTop: 8 }}>
            <AlertCircle size={13} />
            <span style={{ flex: 1 }}>{txError}</span>
          </div>
        )}
      </div>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {txStatus === 'done' && phrases.length > 0 && (
        <>
          <div className="ctrl-divider" />
          <div className="tx-section">
            <p className="ctrl-section-label">
              {phrases.length} caption block{phrases.length !== 1 ? 's' : ''} detected
            </p>

            <div className="tx-phrase-list">
              {phrases.map((p, i) => (
                <div key={p.id} className="tx-phrase-row">
                  <span className="tx-phrase-idx">{i + 1}</span>
                  <span className="tx-phrase-text">{p.content}</span>
                  <span className="tx-phrase-time">
                    {p.entryTime.toFixed(2)}s–{(p.entryTime + p.duration).toFixed(2)}s
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => doApply(false)}
                disabled={applied}
              >
                {applied
                  ? <><CheckCircle2 size={13} /> Applied!</>
                  : <><Wand2 size={13} /> Add to timeline</>
                }
              </button>
              <button
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => doApply(true)}
                title="Replace all existing layers with these captions"
              >
                <Trash2 size={13} /> Replace all
              </button>
            </div>

            {applied && (
              <p className="tx-hint" style={{ marginTop: 6 }}>
                Captions added — go to Style or Motion to refine the look.
              </p>
            )}
          </div>
        </>
      )}

      {txStatus === 'done' && phrases.length === 0 && (
        <>
          <div className="ctrl-divider" />
          <div className="tx-section">
            <div className="tx-status-row tx-status-err">
              <AlertCircle size={13} />
              <span>No speech detected in this clip.</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
