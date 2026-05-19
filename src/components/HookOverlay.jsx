import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useHookStore } from '../context/HookContext';
import { getTransition } from '../utils/transitions';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Layer animation recipes ───────────────────────────────────────────────
const getLayerAnimation = (recipe, isPunch) => {
  switch (recipe) {
    case 'drift-up':     return { initial: { opacity: 0, y: 28, scale: 0.96 },              animate: { opacity: 1, y: 0, scale: 1 },               exit: { opacity: 0, y: -16 } };
    case 'counter-slam': return { initial: { opacity: 0, y: 16, scale: 0.65, rotate: -6 },  animate: { opacity: 1, y: 0, scale: 1, rotate: 0 },    exit: { opacity: 0, y: -10, scale: 0.92 } };
    case 'pill-pop':     return { initial: { opacity: 0, y: 18, scale: 0.85 },              animate: { opacity: 1, y: 0, scale: 1 },               exit: { opacity: 0, y: 8, scale: 0.9 } };
    case 'fade-up':      return { initial: { opacity: 0, y: 20 },                           animate: { opacity: 1, y: 0 },                         exit: { opacity: 0, y: -10 } };
    case 'zoom-spin':    return { initial: { opacity: 0, scale: 0.5, rotate: -10 },         animate: { opacity: 1, scale: 1, rotate: 0 },           exit: { opacity: 0, scale: 0.88 } };
    case 'rise':         return { initial: { opacity: 0, y: -24 },                          animate: { opacity: 1, y: 0 },                         exit: { opacity: 0, y: -12 } };
    case 'rise-down':    return { initial: { opacity: 0, y: -40, scale: 1.1 },              animate: { opacity: 1, y: 0, scale: 1 },               exit: { opacity: 0, y: 30 } };
    case 'blur-in':      return { initial: { opacity: 0, filter: 'blur(18px)', scale: 1.04 }, animate: { opacity: 1, filter: 'blur(0px)', scale: 1 }, exit: { opacity: 0, filter: 'blur(12px)' } };
    case 'slide-left':   return { initial: { opacity: 0, x: -80 },                         animate: { opacity: 1, x: 0 },                         exit: { opacity: 0, x: 40 } };
    case 'slide-right':  return { initial: { opacity: 0, x: 80 },                          animate: { opacity: 1, x: 0 },                         exit: { opacity: 0, x: -40 } };
    case 'flip-x':       return { initial: { opacity: 0, rotateX: 90 },                    animate: { opacity: 1, rotateX: 0 },                   exit: { opacity: 0, rotateX: -60 } };
    case 'flip-y':       return { initial: { opacity: 0, rotateY: 90 },                    animate: { opacity: 1, rotateY: 0 },                   exit: { opacity: 0, rotateY: -60 } };
    case 'expand':       return { initial: { opacity: 0, scaleX: 0.05 },                   animate: { opacity: 1, scaleX: 1 },                    exit: { opacity: 0, scaleX: 0.05 } };
    case 'shake':
      return { initial: { opacity: 0, x: 0 }, animate: { opacity: 1, x: [0, -10, 10, -8, 8, -4, 4, 0] }, exit: { opacity: 0 } };
    case 'bounce-in':
      return { initial: { opacity: 0, y: 60, scale: 0.6 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -15 } };
    case 'perspective-slam':
      return { initial: { opacity: 0, rotateX: 80 }, animate: { opacity: 1, rotateX: 0 }, exit: { opacity: 0, rotateX: -20 } };
    case 'stamp':
      return { initial: { opacity: 0, scale: 2.4, rotate: -12 }, animate: { opacity: 1, scale: 1, rotate: 0 }, exit: { opacity: 0, scale: 0.85 } };
    case 'wipe-right':
      return { initial: { clipPath: 'inset(0 100% 0 0)', opacity: 1 }, animate: { clipPath: 'inset(0 0% 0 0)', opacity: 1 }, exit: { opacity: 0 } };
    case 'skew-in':
      return { initial: { opacity: 0, skewX: -25, x: -50 }, animate: { opacity: 1, skewX: 0, x: 0 }, exit: { opacity: 0, skewX: 10 } };
    case 'neon-pulse':
      return { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0 } };
    case 'slam':
    default:
      return isPunch
        ? { initial: { scale: 0.5, opacity: 0, rotate: -5 }, animate: { scale: 1, opacity: 1, rotate: 0 }, exit: { opacity: 0, scale: 0.9 } }
        : { initial: { y: -20, opacity: 0 },                  animate: { y: 0, opacity: 1 },                exit: { opacity: 0, scale: 0.96 } };
  }
};

// ─── Typewriter ────────────────────────────────────────────────────────────
function TypewriterText({ text, style, playing, animKey, entryDelay }) {
  return (
    <span style={{ ...style, display: 'inline' }}>
      {text.content.split('').map((char, i) => (
        <motion.span
          key={`${animKey}-${i}`}
          initial={playing ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.048, duration: 0 }}
          style={{ display: 'inline', whiteSpace: 'pre' }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Wave ──────────────────────────────────────────────────────────────────
function WaveText({ text, style, playing, animKey, entryDelay }) {
  return (
    <span style={{ ...style, display: 'inline-flex', alignItems: 'baseline', flexWrap: 'wrap' }}>
      {text.content.split('').map((char, i) => (
        <motion.span
          key={`${animKey}-${i}`}
          initial={playing ? { y: 0, opacity: 0 } : false}
          animate={{ y: [0, -12, 0], opacity: 1 }}
          transition={{ delay: i * 0.06, duration: 0.55, ease: 'easeInOut' }}
          style={{ display: 'inline', whiteSpace: 'pre' }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Scramble ──────────────────────────────────────────────────────────────
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!?%&';
function ScrambleText({ text, style, playing, animKey }) {
  const [displayed, setDisplayed] = useState(text.content);
  const frameRef = useRef(null);
  useEffect(() => {
    if (!playing) { setDisplayed(text.content); return; }
    const target = text.content;
    let frame = 0;
    const total = Math.max(20, target.length * 2);
    const tick = () => {
      frame++;
      setDisplayed(target.split('').map((ch, i) => {
        if (ch === ' ') return ' ';
        if (frame > (i / target.length) * total) return ch;
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join(''));
      if (frame < total) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [animKey, text.content, playing]);
  return <span style={style}>{displayed}</span>;
}

// ─── Flicker ───────────────────────────────────────────────────────────────
function FlickerText({ text, style, playing, animKey }) {
  return (
    <span style={{ ...style, display: 'inline' }}>
      {text.content.split('').map((char, i) => (
        <motion.span
          key={`${animKey}-${i}`}
          initial={playing ? { opacity: 0 } : false}
          animate={{ opacity: [0, 1, 0.15, 1, 0, 0.85, 1] }}
          transition={{
            delay: i * 0.055,
            duration: 0.42,
            times: [0, 0.12, 0.28, 0.48, 0.64, 0.82, 1],
            ease: 'linear',
          }}
          style={{ display: 'inline', whiteSpace: 'pre' }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Char Bounce ───────────────────────────────────────────────────────────
function CharBounceText({ text, style, playing, animKey }) {
  return (
    <span style={{ ...style, display: 'inline-flex', alignItems: 'baseline' }}>
      {text.content.split('').map((char, i) => (
        <motion.span
          key={`${animKey}-${i}`}
          initial={playing ? { y: 36, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: i * 0.045,
            type: 'spring',
            stiffness: 420,
            damping: 15,
          }}
          style={{ display: 'inline', whiteSpace: 'pre' }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Fade Chars ────────────────────────────────────────────────────────────
function FadeCharsText({ text, style, playing, animKey }) {
  return (
    <span style={{ ...style, display: 'inline' }}>
      {text.content.split('').map((char, i) => (
        <motion.span
          key={`${animKey}-${i}`}
          initial={playing ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.038, duration: 0.28, ease: 'easeOut' }}
          style={{ display: 'inline', whiteSpace: 'pre' }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Rise Chars ────────────────────────────────────────────────────────────
function RiseCharsText({ text, style, playing, animKey }) {
  return (
    <span style={{ ...style, display: 'inline-flex', alignItems: 'baseline' }}>
      {text.content.split('').map((char, i) => (
        <motion.span key={`${animKey}-${i}`}
          initial={playing ? { y: 40, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.035, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'inline', whiteSpace: 'pre' }}
        >{char}</motion.span>
      ))}
    </span>
  );
}

// ─── Drop Chars ────────────────────────────────────────────────────────────
function DropCharsText({ text, style, playing, animKey }) {
  return (
    <span style={{ ...style, display: 'inline-flex', alignItems: 'baseline' }}>
      {text.content.split('').map((char, i) => (
        <motion.span key={`${animKey}-${i}`}
          initial={playing ? { y: -42, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.04, type: 'spring', stiffness: 380, damping: 18 }}
          style={{ display: 'inline', whiteSpace: 'pre' }}
        >{char}</motion.span>
      ))}
    </span>
  );
}

// ─── Blur Chars ────────────────────────────────────────────────────────────
function BlurCharsText({ text, style, playing, animKey }) {
  return (
    <span style={{ ...style, display: 'inline-flex', alignItems: 'baseline' }}>
      {text.content.split('').map((char, i) => (
        <motion.span key={`${animKey}-${i}`}
          initial={playing ? { filter: 'blur(9px)', opacity: 0 } : false}
          animate={{ filter: 'blur(0px)', opacity: 1 }}
          transition={{ delay: i * 0.04, duration: 0.36, ease: 'easeOut' }}
          style={{ display: 'inline', whiteSpace: 'pre' }}
        >{char}</motion.span>
      ))}
    </span>
  );
}

// ─── Pop Chars ─────────────────────────────────────────────────────────────
function PopCharsText({ text, style, playing, animKey }) {
  return (
    <span style={{ ...style, display: 'inline-flex', alignItems: 'baseline' }}>
      {text.content.split('').map((char, i) => (
        <motion.span key={`${animKey}-${i}`}
          initial={playing ? { scale: 0, opacity: 0 } : false}
          animate={{ scale: [0, 1.35, 1], opacity: 1 }}
          transition={{ delay: i * 0.04, duration: 0.42, times: [0, 0.55, 1], ease: 'easeOut' }}
          style={{ display: 'inline', whiteSpace: 'pre' }}
        >{char}</motion.span>
      ))}
    </span>
  );
}

// ─── Stamp Chars ───────────────────────────────────────────────────────────
function StampCharsText({ text, style, playing, animKey }) {
  return (
    <span style={{ ...style, display: 'inline-flex', alignItems: 'baseline' }}>
      {text.content.split('').map((char, i) => (
        <motion.span key={`${animKey}-${i}`}
          initial={playing ? { scale: 2.6, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.04, duration: 0.32, ease: [0.175, 0.885, 0.32, 1.275] }}
          style={{ display: 'inline', whiteSpace: 'pre' }}
        >{char}</motion.span>
      ))}
    </span>
  );
}

// ─── Slide Chars ───────────────────────────────────────────────────────────
function SlideCharsText({ text, style, playing, animKey }) {
  return (
    <span style={{ ...style, display: 'inline-flex', alignItems: 'baseline' }}>
      {text.content.split('').map((char, i) => (
        <motion.span key={`${animKey}-${i}`}
          initial={playing ? { x: 32, opacity: 0 } : false}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.032, duration: 0.34, ease: 'easeOut' }}
          style={{ display: 'inline', whiteSpace: 'pre' }}
        >{char}</motion.span>
      ))}
    </span>
  );
}

// ─── Swing ─────────────────────────────────────────────────────────────────
function SwingText({ text, style, playing, animKey }) {
  return (
    <span style={{ ...style, display: 'inline-flex', alignItems: 'baseline' }}>
      {text.content.split('').map((char, i) => (
        <motion.span key={`${animKey}-${i}`}
          initial={playing ? { rotate: -28, y: -8, opacity: 0 } : false}
          animate={{ rotate: 0, y: 0, opacity: 1 }}
          transition={{ delay: i * 0.05, type: 'spring', stiffness: 280, damping: 11 }}
          style={{ display: 'inline', whiteSpace: 'pre', transformOrigin: 'top center' }}
        >{char}</motion.span>
      ))}
    </span>
  );
}

// ─── Count Up ──────────────────────────────────────────────────────────────
function CountUpText({ text, style, playing, animKey }) {
  const raw    = text.content ?? '';
  const num    = parseFloat(raw.replace(/[^0-9.]/g, ''));
  const prefix = raw.match(/^[^0-9]*/)?.[0] ?? '';
  const suffix = raw.match(/[^0-9]*$/)?.[0] ?? '';
  const isNum  = !isNaN(num) && raw.replace(/[^0-9]/g, '').length > 0;
  const [val, setVal] = useState(playing ? 0 : num);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!playing || !isNum) { setVal(num || 0); return; }
    setVal(0);
    const dur = 1.1 * 1000;
    const t0  = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setVal(Math.round(e * num));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animKey, playing, num, isNum]);
  return (
    <span style={style}>
      {isNum ? `${prefix}${val}${suffix}` : raw}
    </span>
  );
}

// ─── Glitch ────────────────────────────────────────────────────────────────
function GlitchText({ text, style, playing, animKey, entryDelay }) {
  const [glitching, setGlitching] = useState(false);
  useEffect(() => {
    if (!playing) { setGlitching(false); return; }
    setGlitching(true);
    const t = setTimeout(() => setGlitching(false), 600);
    return () => clearTimeout(t);
  }, [animKey, playing, entryDelay]);
  return (
    <>
      <style>{`@keyframes glitch-kf {
        0%  { clip-path:inset(0 0 95% 0); transform:translate(-4px,0) skewX(-5deg); }
        20% { clip-path:inset(40% 0 40% 0); transform:translate(4px,0) skewX(3deg); }
        40% { clip-path:inset(80% 0 10% 0); transform:translate(-3px,0); }
        60% { clip-path:inset(20% 0 60% 0); transform:translate(3px,0) skewX(2deg); }
        80% { clip-path:inset(60% 0 20% 0); transform:translate(-4px,0); }
        100%{ clip-path:inset(0 0 0 0);     transform:translate(0,0); }
      }`}</style>
      <motion.span
        key={`${animKey}-g`}
        initial={playing ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.05 }}
        style={{ ...style, display: 'inline-block', animation: glitching ? 'glitch-kf 0.6s steps(2,end)' : 'none' }}
      >
        {text.content}
      </motion.span>
    </>
  );
}

// ─── Arc text ──────────────────────────────────────────────────────────────
function ArcText({ text, style }) {
  const letters = text.content.split('');
  const spread = text.arcSpread ?? 100;
  const radius = text.radius ?? 160;
  const startAngle = -spread / 2;
  const step = letters.length > 1 ? spread / (letters.length - 1) : 0;
  return (
    <div style={{ position: 'relative', width: radius * 2, height: radius + text.fontSize, transform: 'translateX(-50%)', left: '50%' }}>
      {letters.map((letter, i) => {
        const angle = startAngle + step * i;
        return (
          <span key={i} style={{ ...style, position: 'absolute', left: '50%', bottom: 0, transform: `rotate(${angle}deg) translateY(-${radius}px) rotate(${90 + angle}deg)`, transformOrigin: 'bottom center', display: 'inline-block', whiteSpace: 'pre' }}>
            {letter === ' ' ? ' ' : letter}
          </span>
        );
      })}
    </div>
  );
}

// ─── Curve text — per-letter Y + tangent rotation ─────────────────────────────
const CURVE_SHAPES = new Set(['arch', 'rise', 'wave', 'flag']);

function CurveText({ text, style }) {
  const letters = text.content.split('');
  const n = letters.length;
  if (n === 0) return null;

  const amt    = Math.max(0, Math.min(100, text.warpAmount ?? 50)) / 100;
  const fs     = text.fontSize ?? 32;
  const amp    = amt * fs * 0.9;
  const charW  = fs * 0.52;

  const safeColor = style.color === 'transparent' ? (text.fill || '#ffffff') : style.color;
  const ls = {
    fontFamily:       style.fontFamily,
    fontSize:         style.fontSize,
    fontWeight:       style.fontWeight,
    color:            safeColor,
    WebkitTextStroke: style.WebkitTextStroke,
    paintOrder:       style.paintOrder,
    textShadow:       style.textShadow,
    textTransform:    style.textTransform,
    letterSpacing:    style.letterSpacing,
    lineHeight:       1,
  };

  const getTransform = (i) => {
    const t   = n > 1 ? i / (n - 1) : 0.5;
    const dx  = (n - 1) * charW || 1;
    let y = 0, dy = 0;

    switch (text.shape) {
      case 'arch':
        y  = -Math.sin(t * Math.PI) * amp;
        dy = (-Math.PI * Math.cos(t * Math.PI) * amp) / dx;
        break;
      case 'rise':
        y  = (0.5 - t) * 2 * amp * 0.8;
        dy = (-2 * amp * 0.8) / dx;
        break;
      case 'wave':
        y  = Math.sin(t * Math.PI * 2) * amp * 0.6;
        dy = (Math.PI * 2 * Math.cos(t * Math.PI * 2) * amp * 0.6) / dx;
        break;
      case 'flag':
        y  = Math.sin(t * Math.PI * 2) * amp * 0.95;
        dy = (Math.PI * 2 * Math.cos(t * Math.PI * 2) * amp * 0.95) / dx;
        break;
      default:
        break;
    }

    const angle = Math.atan(dy) * (180 / Math.PI) * 0.6;
    return `translateY(${y.toFixed(2)}px) rotate(${angle.toFixed(2)}deg)`;
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', paddingTop: amp * 1.15, paddingBottom: amp * 0.1 }}>
      {letters.map((ch, i) => (
        <span key={i} style={{ ...ls, display: 'inline-block', transform: getTransform(i), transformOrigin: 'center bottom', whiteSpace: 'pre' }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}

// ─── Karaoke highlight ─────────────────────────────────────────────────────
// Renders a caption layer word-by-word, highlighting the currently spoken word.
// Uses its own rAF loop reading directly from the DOM <video> element so
// highlighting updates at 60 fps regardless of the store's timeupdate rate.
//
// wordTimestamps coordinate space: same as entryTime (0-relative to audio
// extraction start). Absolute video time = hookStart + w.start.
//
// Configurable per-layer properties (all optional with sensible defaults):
//   karaokeColor     – highlight colour (default #FFE400)
//   karaokeStyle     – 'color' | 'glow' | 'box' | 'underline' (default 'glow')
//   karaokeScale     – scale multiplier for active word, 1 = no scale (default 1.1)
//   karaokeDim       – opacity for already-spoken words 0–1 (default 0.35)
//   karaokeDimFuture – whether upcoming words are also slightly dimmed (default false)
function KaraokeText({ text, style, videoElRef, hookStart, playing }) {
  const [ct, setCt] = React.useState(videoElRef?.current?.currentTime ?? 0);
  const rafRef = React.useRef(null);

  React.useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = () => {
      if (videoElRef?.current) setCt(videoElRef.current.currentTime);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, videoElRef]);

  const wts        = text.wordTimestamps;
  const hlColor    = text.karaokeColor   ?? '#FFE400';
  const hlStyle    = text.karaokeStyle   ?? 'glow';    // 'color' | 'glow' | 'box' | 'underline'
  const hlScale    = text.karaokeScale   ?? 1.1;
  const dimOpacity = text.karaokeDim     ?? 0.35;
  const dimFuture  = text.karaokeDimFuture ?? false;

  // Resolve base colour — handles gradient-fill layers
  const baseColor = (style.WebkitTextFillColor === 'transparent')
    ? (text.fill || '#ffffff')
    : (style.color || '#ffffff');

  // Strip gradient so we can colour each word individually
  const spanStyle = {
    ...style,
    background:           undefined,
    WebkitBackgroundClip: undefined,
    backgroundClip:       undefined,
    WebkitTextFillColor:  undefined,
    color:                baseColor,
  };

  const dimColor = hexToRgba(baseColor, dimOpacity);

  return (
    <span style={spanStyle}>
      {wts.map((w, i) => {
        const absStart = hookStart + w.start;
        const absEnd   = hookStart + w.end;
        const isActive = ct >= absStart - 0.05 && ct < absEnd + 0.06;
        const isPast   = ct >= absEnd + 0.06;

        let wordColor = baseColor;
        if (isActive)                 wordColor = hlStyle === 'box' ? baseColor : hlColor;
        else if (isPast)              wordColor = dimColor;
        else if (dimFuture && !isPast && !isActive) wordColor = hexToRgba(baseColor, 0.65);

        // Build the word's inline style based on hlStyle
        const wordStyle = {
          display:    'inline-block',
          color:      wordColor,
          transition: 'transform 0.05s ease-out, color 0.04s, background 0.04s',
          transform:  isActive && hlScale !== 1 ? `scale(${hlScale}) translateY(-1px)` : 'scale(1)',
          transformOrigin: 'bottom center',
          // Glow
          textShadow: (isActive && hlStyle === 'glow')
            ? `0 0 18px ${hlColor}bb, 0 0 40px ${hlColor}55, 0 2px 6px rgba(0,0,0,0.6)`
            : undefined,
          // Box
          ...(isActive && hlStyle === 'box' ? {
            background:   hlColor,
            color:        '#000',
            padding:      '0 4px',
            borderRadius: '3px',
          } : {}),
          // Underline
          ...(isActive && hlStyle === 'underline' ? {
            borderBottom:  `3px solid ${hlColor}`,
            paddingBottom: '1px',
          } : {}),
        };

        return (
          <React.Fragment key={i}>
            <span style={wordStyle}>{w.word}</span>
            {i < wts.length - 1 && ' '}
          </React.Fragment>
        );
      })}
    </span>
  );
}

// ─── Word-colored text ──────────────────────────────────────────────────────
function WordColoredText({ text, style }) {
  const words = text.content.split(' ');
  const wc = text.wordColors ?? {};
  const baseColor = style.WebkitTextFillColor === 'transparent' ? (text.fill || '#fff') : (style.color || '#fff');
  return (
    <span style={{ display: 'inline', fontFamily: style.fontFamily, fontSize: style.fontSize,
      fontWeight: style.fontWeight, letterSpacing: style.letterSpacing,
      textTransform: style.textTransform, lineHeight: style.lineHeight, textAlign: style.textAlign }}>
      {words.map((word, i) => (
        <React.Fragment key={i}>
          <span style={{ color: wc[i] ?? baseColor, WebkitTextFillColor: wc[i] ?? style.WebkitTextFillColor,
            WebkitTextStroke: style.WebkitTextStroke, paintOrder: style.paintOrder,
            textShadow: style.textShadow }}>
            {word}
          </span>
          {i < words.length - 1 && ' '}
        </React.Fragment>
      ))}
    </span>
  );
}

// ─── Image-level warp wrapper ──────────────────────────────────────────────────

const CSS_WARP_MAP = {
  'lean-l': (a) => `perspective(520px) rotateY(${+40 * a}deg)`,
  'lean-r': (a) => `perspective(520px) rotateY(${-40 * a}deg)`,
  'skew-r': (a) => `skewX(${-28 * a}deg)`,
  'skew-l': (a) => `skewX(${+28 * a}deg)`,
  squeeze:  (a) => `scaleX(${1 - 0.48 * a})`,
  inflate:  (a) => `scaleX(${1 + 0.55 * a}) scaleY(${1 - 0.12 * a})`,
};

function WarpWrapper({ layerId, shape, amount, children }) {
  if (!shape || shape === 'line' || shape === 'arc' || CURVE_SHAPES.has(shape)) return React.createElement(React.Fragment, null, children);
  const amt = Math.max(0, Math.min(100, amount ?? 50)) / 100;

  if (CSS_WARP_MAP[shape]) {
    return (
      <div style={{ display: 'inline-block', transformOrigin: 'center center', transform: CSS_WARP_MAP[shape](amt) }}>
        {children}
      </div>
    );
  }

  const uid = 'wf_' + layerId + '_' + shape;
  const scale = amt * 32;

  let filterDef = null;
  if (shape === 'wave') {
    filterDef = (
      <filter id={uid} x="-5%" y="-50%" width="110%" height="200%">
        <feTurbulence type="fractalNoise" baseFrequency="0.045 0.008" numOctaves="1" seed="5" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="G" yChannelSelector="R"/>
      </filter>
    );
  } else if (shape === 'flag') {
    filterDef = (
      <filter id={uid} x="-30%" y="-10%" width="160%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.045" numOctaves="1" seed="3" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale={scale * 1.3} xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    );
  }

  if (!filterDef) return React.createElement(React.Fragment, null, children);

  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute', overflow: 'visible', pointerEvents: 'none' }}>
        <defs>{filterDef}</defs>
      </svg>
      <div style={{ display: 'inline-block', filter: `url(#${uid})` }}>
        {children}
      </div>
    </>
  );
}

// ─── Floating toolbar helpers ──────────────────────────────────────────────────
function FTBtn({ children, onClick, title, active, style }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? 'rgba(99,102,241,0.3)' : 'transparent',
        border: 'none', borderRadius: 6, cursor: 'pointer',
        color: active ? '#a5b4fc' : 'rgba(255,255,255,0.7)',
        padding: '3px 5px', fontSize: 12, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 22, height: 24, lineHeight: 1,
        transition: 'background 0.1s, color 0.1s',
        ...style,
      }}
    >{children}</button>
  );
}

function FTDivider() {
  return <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 2px', flexShrink: 0 }} />;
}

// ─── Draggable wrapper ──────────────────────────────────────────────────────────
function DraggableLayer({ text, containerRef, isSelected, isMultiSelected, accent, alignment, activeTool, onSelect, onPositionChange, onResizeStart, onWidthChange, onDoubleClick, isEditing, onEditCommit, children }) {
  const divRef  = useRef(null);
  const drag    = useRef({ active: false, startPtrX: 0, startPtrY: 0, origX: 0, origY: 0, liveX: 0, liveY: 0 });
  const translateX = alignment === 'left' ? '0%' : alignment === 'right' ? '-100%' : '-50%';

  // ── Move drag ──────────────────────────────────────────────────────────────
  const handlePointerDown = (e) => {
    e.stopPropagation();
    const additive = e.shiftKey || e.ctrlKey || e.metaKey;
    onSelect(text.id, additive);
    if (activeTool === 'text') return;
    drag.current = { active: true, startPtrX: e.clientX, startPtrY: e.clientY, origX: text.x, origY: text.y, liveX: text.x, liveY: text.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e) => {
    if (!drag.current.active || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const newX = Math.max(0, Math.min(100, drag.current.origX + ((e.clientX - drag.current.startPtrX) / rect.width)  * 100));
    const newY = Math.max(0, Math.min(100, drag.current.origY + ((e.clientY - drag.current.startPtrY) / rect.height) * 100));
    drag.current.liveX = newX; drag.current.liveY = newY;
    if (divRef.current) { divRef.current.style.left = `${newX}%`; divRef.current.style.top = `${newY}%`; }
  };
  const handlePointerUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const dX = drag.current.liveX - drag.current.origX;
    const dY = drag.current.liveY - drag.current.origY;
    onPositionChange(text.id, drag.current.liveX, drag.current.liveY, dX, dY);
  };

  // ── Right-edge width drag ──────────────────────────────────────────────────
  const handleWidthDragStart = (e) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect    = containerRef.current.getBoundingClientRect();
    const startX  = e.clientX;
    const startW  = text.width ?? (divRef.current ? (divRef.current.offsetWidth / rect.width) * 100 : 40);
    e.currentTarget.setPointerCapture(e.pointerId);

    const onMove = (mv) => {
      const delta  = ((mv.clientX - startX) / rect.width) * 100;
      const newW   = Math.max(10, Math.min(100, startW + delta));
      onWidthChange(text.id, newW);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      ref={divRef}
      style={{
        position:      'absolute',
        left:          `${text.x}%`,
        top:           `${text.y}%`,
        transform:     `translate(${translateX}, -50%) skew(${text.skewX ?? 0}deg, ${text.skewY ?? 0}deg) rotate(${text.textRotate ?? 0}deg) rotateX(${text.rotateX ?? 0}deg) rotateY(${text.rotateY ?? 0}deg)`,
        zIndex:        isSelected ? 30 : isMultiSelected ? 25 : 20,
        cursor:        activeTool === 'text' ? 'crosshair' : (isSelected || isMultiSelected ? 'grab' : 'pointer'),
        border:        isSelected
          ? `2px dashed ${accent || 'var(--accent-primary)'}`
          : isMultiSelected
          ? `2px dashed rgba(99,102,241,0.55)`
          : '2px dashed transparent',
        padding:       '4px',
        boxSizing:     'content-box',
        width:         text.width ? `${text.width}%` : undefined,
        touchAction:   'none',
        userSelect:    'none',
        pointerEvents: 'auto',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={(e) => { e.stopPropagation(); if (!text.locked) onDoubleClick?.(text.id); }}
    >
      {/* Inline text editor — shown on double-click */}
      {isEditing && (
        <textarea
          autoFocus
          defaultValue={text.content}
          onBlur={(e) => onEditCommit(text.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onEditCommit(text.id, e.target.value);
          }}
          style={{
            position: 'absolute', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.75)', color: '#fff',
            border: `1px solid ${accent || 'var(--accent-primary)'}`,
            borderRadius: 4, padding: '2px 4px',
            font: 'inherit', fontSize: 'inherit', lineHeight: 'inherit',
            resize: 'none', outline: 'none',
            width: '100%', height: '100%', minWidth: 80, minHeight: 28,
            backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      {children}
      {isSelected && (<>
        {/* Font-size resize handle (bottom-right corner) */}
        <div
          onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, text.id, text.fontSize); }}
          title="Drag to resize font"
          style={{ position: 'absolute', right: -8, bottom: -8, width: 14, height: 14, background: accent || 'var(--accent-primary)', borderRadius: '50%', cursor: 'se-resize', zIndex: 40, boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }}
        />
        {/* Width drag handle (right-middle edge) */}
        <div
          onPointerDown={handleWidthDragStart}
          title="Drag to set wrap width"
          style={{
            position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)',
            width: 8, height: 36, borderRadius: 4,
            background: accent || 'var(--accent-primary)',
            cursor: 'ew-resize', zIndex: 40,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
          }}
        >
          {[0,1,2].map(i => <div key={i} style={{ width: 2, height: 2, borderRadius: '50%', background: 'rgba(255,255,255,0.8)' }} />)}
        </div>
        {/* Width reset — small ✕ above the width handle when width is locked */}
        {text.width && (
          <div
            onPointerDown={(e) => { e.stopPropagation(); onWidthChange(text.id, null); }}
            title="Clear width (free text)"
            style={{
              position: 'absolute', right: -18, top: -18,
              width: 14, height: 14, borderRadius: '50%',
              background: '#ef4444', cursor: 'pointer', zIndex: 41,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: '#fff', fontWeight: 800, lineHeight: 1,
            }}
          >✕</div>
        )}
      </>)}
    </div>
  );
}

// ─── Main overlay ──────────────────────────────────────────────────────────
export default function HookOverlay() {
  const {
    appMode, video, hookConfig, setHookConfig,
    selectedTextId, setSelectedTextId,
    selectedTextIds, setSelectedTextIds,
    activeTool, addTextAtPosition,
    previewKey, videoElRef,
    snapToGrid, GRID_STEP,
    pushHistory, undoCount, undo,
  } = useHookStore();

  const { timing, texts, curves, motionProfile, layout, accent } = hookConfig;
  const isDesignMode = appMode === 'design';

  const isActive = video.currentTime >= timing.startTime &&
                   video.currentTime <= (timing.startTime + timing.duration);
  const showTexts = isDesignMode || isActive;

  const [animKey, setAnimKey]           = useState(0);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const prevMode       = useRef(appMode);
  const prevPlaying    = useRef(video.playing);
  const prevPreviewKey = useRef(previewKey);

  useEffect(() => {
    if (prevMode.current === 'design' && appMode === 'play') {
      setAnimKey((k) => k + 1);
    }
    prevMode.current = appMode;
  }, [appMode]);

  useEffect(() => {
    if (!prevPlaying.current && video.playing) {
      setAnimKey((k) => k + 1);
    }
    prevPlaying.current = video.playing;
  }, [video.playing]);

  useEffect(() => {
    if (previewKey === prevPreviewKey.current) return;
    prevPreviewKey.current = previewKey;
    setAnimKey((k) => k + 1);
    setPreviewPlaying(true);
    const t = setTimeout(() => setPreviewPlaying(false), 2000);
    return () => clearTimeout(t);
  }, [previewKey]);

  const containerRef = useRef(null);
  // Track live container height so caption font sizes stay proportional across screen sizes.
  // 600 px is the "design reference" height at which caption fontSize values were authored.
  const [containerH, setContainerH] = useState(600);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerH(entry.contentRect.height || 600));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Selection handler — supports additive (shift/ctrl) multi-select ──────────
  const handleSelect = (id, additive) => {
    if (additive) {
      setSelectedTextIds((prev) => {
        const s = new Set(prev);
        if (s.has(id)) { s.delete(id); } else { s.add(id); }
        return [...s];
      });
      setSelectedTextId(id);
    } else {
      setSelectedTextIds([id]);
      setSelectedTextId(id);
    }
  };

  // ── Position change — multi-drag applies delta to all selected ────────────
  const snapVal = (v) => snapToGrid ? Math.round(v / GRID_STEP) * GRID_STEP : v;

  const handlePositionChange = (id, newX, newY, dX = 0, dY = 0) => {
    if (selectedTextIds.length > 1 && selectedTextIds.includes(id)) {
      setHookConfig((prev) => ({
        ...prev,
        texts: prev.texts.map((t) =>
          selectedTextIds.includes(t.id)
            ? { ...t, x: snapVal(Math.max(0, Math.min(100, t.x + dX))), y: snapVal(Math.max(0, Math.min(100, t.y + dY))) }
            : t
        ),
      }));
    } else {
      setHookConfig((prev) => ({
        ...prev,
        texts: prev.texts.map((t) => t.id === id ? { ...t, x: snapVal(newX), y: snapVal(newY) } : t),
      }));
    }
  };

  const handleWidthChange = (id, newWidth) => {
    setHookConfig((prev) => ({
      ...prev,
      texts: prev.texts.map((t) => t.id === id ? { ...t, width: newWidth ?? undefined } : t),
    }));
  };

  const handleEditCommit = (id, value) => {
    setEditingId(null);
    setHookConfig((prev) => ({
      ...prev,
      texts: prev.texts.map((t) => t.id === id ? { ...t, content: value } : t),
    }));
  };

  const handleResizeStart = (e, textId, currentSize) => {
    e.stopPropagation();
    const startY = e.clientY;
    const onMove = (mv) => {
      const newSize = Math.max(10, currentSize + (mv.clientY - startY) * 0.5);
      setHookConfig((prev) => ({
        ...prev,
        texts: prev.texts.map((t) => t.id === textId ? { ...t, fontSize: Math.round(newSize) } : t),
      }));
    };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleContainerPointerDown = (e) => {
    if (e.target.id !== 'hook-export-container') return;
    if (activeTool === 'text') {
      const rect = containerRef.current.getBoundingClientRect();
      addTextAtPosition(
        ((e.clientX - rect.left) / rect.width) * 100,
        ((e.clientY - rect.top)  / rect.height) * 100,
      );
    } else {
      setSelectedTextId(null);
      setSelectedTextIds([]);
    }
  };

  const globalAlignment = layout?.alignment || 'center';

  // ── Floating contextual toolbar for selected layer ──────────────────────────
  const isMultiMode = selectedTextIds.length > 1;
  const selectedText = selectedTextId ? texts.find(t => t.id === selectedTextId) : null;

  // Single-layer update OR bulk-update all selected layers
  const updateSelected = (key, value) => {
    if (!selectedTextId) return;
    const idsToUpdate = isMultiMode ? selectedTextIds : [selectedTextId];
    setHookConfig((prev) => ({
      ...prev,
      texts: prev.texts.map((t) => idsToUpdate.includes(t.id) ? { ...t, [key]: value } : t),
    }));
  };

  const deleteSelected = () => {
    const ids = isMultiMode ? selectedTextIds : (selectedTextId ? [selectedTextId] : []);
    if (ids.length === 0) return;
    setHookConfig((prev) => ({ ...prev, texts: prev.texts.filter((t) => !ids.includes(t.id)) }));
    setSelectedTextId(null);
    setSelectedTextIds([]);
  };

  // ── Alignment helper (multi-select) ────────────────────────────────────────
  const alignLayers = (mode) => {
    if (selectedTextIds.length < 2) return;
    const sel  = hookConfig.texts.filter((t) => selectedTextIds.includes(t.id));
    const xs   = sel.map((t) => t.x);
    const ys   = sel.map((t) => t.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const cX   = (minX + maxX) / 2;
    const cY   = (minY + maxY) / 2;
    setHookConfig((prev) => ({
      ...prev,
      texts: prev.texts.map((t) => {
        if (!selectedTextIds.includes(t.id)) return t;
        switch (mode) {
          case 'left':    return { ...t, x: minX };
          case 'centerH': return { ...t, x: cX   };
          case 'right':   return { ...t, x: maxX };
          case 'top':     return { ...t, y: minY };
          case 'centerV': return { ...t, y: cY   };
          case 'bottom':  return { ...t, y: maxY };
          default:        return t;
        }
      }),
    }));
  };

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const selIds = selectedTextIds.length > 0 ? selectedTextIds : (selectedTextId ? [selectedTextId] : []);

      // Delete / Backspace — remove selected layers
      if ((e.key === 'Delete' || e.key === 'Backspace') && selIds.length > 0) {
        e.preventDefault();
        setHookConfig((prev) => ({ ...prev, texts: prev.texts.filter((t) => !selIds.includes(t.id)) }));
        setSelectedTextId(null);
        setSelectedTextIds([]);
        return;
      }

      // Arrow nudge — ±1% or ±5% with Shift
      const isArrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key);
      if (isArrow && selIds.length > 0) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp'   ? -step : e.key === 'ArrowDown'  ? step : 0;
        setHookConfig((prev) => ({
          ...prev,
          texts: prev.texts.map((t) =>
            selIds.includes(t.id)
              ? { ...t, x: Math.max(0, Math.min(100, t.x + dx)), y: Math.max(0, Math.min(100, t.y + dy)) }
              : t
          ),
        }));
        return;
      }

      // Ctrl+D — duplicate selected
      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        if (selIds.length === 0) return;
        setHookConfig((prev) => {
          const duped = prev.texts
            .filter((t) => selIds.includes(t.id))
            .map((t) => ({
              ...t,
              id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              x:  Math.min(100, t.x + 3),
              y:  Math.min(100, t.y + 3),
            }));
          return { ...prev, texts: [...prev.texts, ...duped] };
        });
        return;
      }

      // Ctrl+A — select all visible layers
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        const allIds = hookConfig.texts.filter((t) => !t.hidden).map((t) => t.id);
        if (allIds.length === 0) return;
        setSelectedTextIds(allIds);
        setSelectedTextId(allIds[allIds.length - 1]);
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTextId, selectedTextIds, hookConfig.texts]);

  const cycleCaseSelected = () => {
    if (!selectedText) return;
    const order = ['upper', 'none', 'title'];
    const next  = order[(order.indexOf(selectedText.textCase ?? 'upper') + 1) % order.length];
    updateSelected('textCase', next);
  };

  const caseLabel = { upper: 'AA', none: 'Aa', title: 'Ab' }[selectedText?.textCase ?? 'upper'];

  return (
    <div
      id="hook-export-container"
      ref={containerRef}
      onPointerDown={handleContainerPointerDown}
      style={{
        position: 'absolute', inset: 0, zIndex: 10, overflow: 'hidden',
        cursor: activeTool === 'text' ? 'crosshair' : 'default',
        perspective: '800px',
      }}
    >
      {/* ── Floating text toolbar ──────────────────────────────────────── */}
      {(selectedText || isMultiMode) && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            zIndex: 50, display: 'flex', alignItems: 'center', gap: 2,
            background: 'rgba(14,14,20,0.92)', backdropFilter: 'blur(12px)',
            border: isMultiMode ? '1px solid rgba(99,102,241,0.55)' : `1px solid ${accent}55`,
            borderRadius: 10, padding: '4px 6px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
            whiteSpace: 'nowrap',
          }}
        >
          {/* Multi-select badge + alignment tools */}
          {isMultiMode && (
            <>
              <span style={{
                fontSize: 10, fontWeight: 800, color: '#a5b4fc',
                background: 'rgba(99,102,241,0.18)', borderRadius: 5,
                padding: '2px 7px', letterSpacing: '0.02em',
              }}>
                {selectedTextIds.length} layers
              </span>
              <FTDivider />
              {/* Horizontal alignment */}
              <FTBtn title="Align left edges"    onClick={() => alignLayers('left')}>⇤</FTBtn>
              <FTBtn title="Center horizontally" onClick={() => alignLayers('centerH')}>↔</FTBtn>
              <FTBtn title="Align right edges"   onClick={() => alignLayers('right')}>⇥</FTBtn>
              <FTDivider />
              {/* Vertical alignment */}
              <FTBtn title="Align top edges"     onClick={() => alignLayers('top')}>⇡</FTBtn>
              <FTBtn title="Center vertically"   onClick={() => alignLayers('centerV')}>↕</FTBtn>
              <FTBtn title="Align bottom edges"  onClick={() => alignLayers('bottom')}>⇣</FTBtn>
              <FTDivider />
            </>
          )}

          {/* Case + Alignment — single select only */}
          {!isMultiMode && selectedText && (
            <>
              <FTBtn title="Cycle case" onClick={cycleCaseSelected} style={{ fontWeight: 800, letterSpacing: '-0.03em', minWidth: 26 }}>
                {caseLabel}
              </FTBtn>
              <FTDivider />
              {['left','center','right'].map(a => (
                <FTBtn key={a} title={`Align ${a}`}
                  active={(selectedText.textAlign ?? 'center') === a}
                  onClick={() => updateSelected('textAlign', a)}
                >
                  {a === 'left' ? '⫷' : a === 'center' ? '≡' : '⫸'}
                </FTBtn>
              ))}
              <FTDivider />
            </>
          )}

          {/* Font size */}
          <FTBtn title="Decrease font size" onClick={() => updateSelected('fontSize', Math.max(8, (selectedText?.fontSize ?? 32) - 2))}>−</FTBtn>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', minWidth: 28, textAlign: 'center' }}>
            {selectedText?.fontSize ?? '—'}
          </span>
          <FTBtn title="Increase font size" onClick={() => updateSelected('fontSize', Math.min(200, (selectedText?.fontSize ?? 32) + 2))}>+</FTBtn>

          <FTDivider />

          {/* Bold */}
          <FTBtn title="Toggle bold"
            active={!isMultiMode && (selectedText?.fontWeight ?? 700) >= 800}
            onClick={() => updateSelected('fontWeight', (selectedText?.fontWeight ?? 700) >= 800 ? 700 : 900)}
            style={{ fontWeight: 800 }}
          >B</FTBtn>

          <FTDivider />

          {/* Colour */}
          <div style={{ position: 'relative', width: 20, height: 20 }} title="Text colour">
            <div style={{
              width: 20, height: 20, borderRadius: 4,
              background: selectedText?.fill ?? '#ffffff',
              border: '2px solid rgba(255,255,255,0.2)', cursor: 'pointer',
            }} />
            <input type="color" value={selectedText?.fill ?? '#ffffff'}
              onChange={(e) => updateSelected('fill', e.target.value)}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
            />
          </div>

          <FTDivider />

          {/* Opacity */}
          <FTBtn title="Decrease opacity" onClick={() => updateSelected('opacity', Math.max(0.1, Math.round(((selectedText?.opacity ?? 1) - 0.1) * 10) / 10))}>
            <span style={{ fontSize: 9 }}>◑</span>−
          </FTBtn>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', minWidth: 28, textAlign: 'center' }}>
            {Math.round((selectedText?.opacity ?? 1) * 100)}%
          </span>
          <FTBtn title="Increase opacity" onClick={() => updateSelected('opacity', Math.min(1, Math.round(((selectedText?.opacity ?? 1) + 0.1) * 10) / 10))}>
            +
          </FTBtn>

          {/* Width indicator — single only */}
          {!isMultiMode && selectedText?.width && (
            <>
              <FTDivider />
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>W:{Math.round(selectedText.width)}%</span>
            </>
          )}

          {/* Delete */}
          <FTDivider />
          <FTBtn
            title={isMultiMode ? `Delete ${selectedTextIds.length} layers` : 'Delete layer'}
            onClick={deleteSelected}
            style={{ color: '#f87171' }}
          >✕</FTBtn>
        </div>
      )}
      <AnimatePresence>
        {showTexts && texts.map((text, originalIdx) => {
          const stagger = motionProfile?.stagger ?? 0.15;
          const entryOffset = text.entryTime ?? (originalIdx * stagger + 0.1);
          const layerDur = text.duration ?? (timing.duration - entryOffset);
          const textStart = timing.startTime + entryOffset;
          const textEnd   = textStart + layerDur;

          if (text.hidden && !isDesignMode) return null;
          if (text.hidden) return null; // hide in design mode too
          const isVisible = isDesignMode || (video.currentTime >= textStart - 0.02 && video.currentTime <= textEnd + 0.02);
          if (!isVisible) return null;

          // ── Separate motion from text-effect ──────────────────────────────
          // `animation` drives the framer-motion entry/exit (blur, slam, drift…)
          // `textEffect` drives the character-level renderer (scramble, typewriter…)
          // They're combined freely — Ghost = blur-in motion + scramble text effect.
          const CHAR_EFFECTS = ['typewriter', 'wave', 'scramble', 'glitch', 'flicker', 'char-bounce', 'fade-chars', 'rise-chars', 'drop-chars', 'blur-chars', 'pop-chars', 'stamp-chars', 'slide-chars', 'swing', 'count-up'];
          const rawRecipe = text.animation || motionProfile?.layerAnimations?.[text.role];
          // Legacy compat: if animation is a char-effect AND textEffect not explicitly set,
          // promote it to textEffect and use 'fade-up' as the motion recipe instead.
          const textEffect  = text.textEffect ?? (CHAR_EFFECTS.includes(rawRecipe) ? rawRecipe : null);
          const motionRecipe = (CHAR_EFFECTS.includes(rawRecipe) && text.textEffect == null)
            ? 'fade-up'
            : rawRecipe;

          const isPunch    = text.type === 'punch';
          const baseState  = getLayerAnimation(motionRecipe, isPunch);
          const playing    = !isDesignMode || previewPlaying;

          const activeCurve = text.curve ?? (isPunch ? curves.emphasis : curves.entry);
          const transition  = getTransition(activeCurve);

          const baseFontFamily = (() => {
            const FONT_MAP = {
              'Inter':              'var(--font-sans)',
              'Outfit':             'var(--font-display)',
              'Space Grotesk':      'var(--font-grotesk)',
              'Bebas Neue':         'var(--font-bebas)',
              'Playfair Display':   'var(--font-playfair)',
              'Cormorant Garamond': 'var(--font-serif)',
              // New fonts — use direct names so Google Fonts loads them
              'DM Sans':            "'DM Sans', system-ui, sans-serif",
              'Plus Jakarta Sans':  "'Plus Jakarta Sans', system-ui, sans-serif",
              'Syne':               "'Syne', system-ui, sans-serif",
              'Anton':              "'Anton', system-ui, sans-serif",
              'Oswald':             "'Oswald', system-ui, sans-serif",
              'Barlow Condensed':   "'Barlow Condensed', system-ui, sans-serif",
              'Raleway':            "'Raleway', system-ui, sans-serif",
              'Montserrat':         "'Montserrat', system-ui, sans-serif",
              'Poppins':            "'Poppins', system-ui, sans-serif",
              'Rubik':              "'Rubik', system-ui, sans-serif",
              'League Spartan':     "'League Spartan', system-ui, sans-serif",
              'Unbounded':          "'Unbounded', system-ui, sans-serif",
            };
            return FONT_MAP[text.font] ?? (text.font ? `'${text.font}', system-ui, sans-serif` : 'var(--font-sans)');
          })();

          const TC_MAP = { upper: 'uppercase', lower: 'lowercase', none: 'none', title: 'capitalize' };
          const bgOn = text.bgColor && text.bgColor !== 'transparent';

          // ── Build text shadow (Feature A, B, C) ──────────────────────────
          const buildTextShadow = (t, punch) => {
            // Base shadow
            let parts = [];
            if (t.shadowMode === 'custom') {
              const sx = t.shadowX ?? 0;
              const sy = t.shadowY ?? 4;
              const sb = t.shadowBlur ?? 10;
              const sc = t.shadowColor ?? '#000000';
              const so = t.shadowOpacity ?? 0.6;
              parts.push(`${sx}px ${sy}px ${sb}px ${hexToRgba(sc, so)}`);
            } else {
              switch (t.shadow) {
                case 'none': break;
                case 'soft': parts.push('0 2px 12px rgba(0,0,0,0.55)'); break;
                case 'glow': parts.push(`0 0 20px ${t.fill}99`, '0 4px 20px rgba(0,0,0,0.6)'); break;
                case 'hard': parts.push('2px 3px 0 rgba(0,0,0,0.9)'); break;
                default: parts.push(punch ? '0 4px 20px rgba(0,0,0,0.6)' : '0 2px 10px rgba(0,0,0,0.5)'); break;
              }
            }

            // Glow (Feature B)
            if (t.glow) {
              const gc = t.glowColor || t.fill || '#ffffff';
              const gr = t.glowRadius ?? 20;
              const gi = t.glowIntensity ?? 0.7;
              parts.push(`0 0 ${gr}px ${hexToRgba(gc, gi * 0.65)}`);
              parts.push(`0 0 ${(gr * 1.8).toFixed(1)}px ${hexToRgba(gc, gi * 0.3)}`);
            }

            // Highlight (Feature C)
            if (t.highlight) {
              const op = t.highlightOpacity ?? 0.5;
              parts.push(`0 -1px 0 rgba(255,255,255,${op})`);
              parts.push(`0 -2px 6px rgba(255,255,255,${(op * 0.4).toFixed(3)})`);
            }

            return parts.length > 0 ? parts.join(', ') : 'none';
          };

          const textShadow = buildTextShadow(text, isPunch);

          // ── Gradient fill + animation (Feature D) ────────────────────────
          const isGradient    = text.fillType === 'gradient' && text.gradientFrom && text.gradientTo;
          const gradAnimated  = isGradient && !!text.gradientAnimated;
          const gradAnimType  = text.gradientAnimType  ?? 'shift';   // shift | hue | pulse
          const gradAnimSpeed = text.gradientAnimSpeed ?? 3;

          // Keyframes injected alongside layer
          const gradKfId = `g-${text.id}`;
          const gradKeyframes = gradAnimated ? (
            gradAnimType === 'shift'
              ? `@keyframes ${gradKfId}{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}`
              : gradAnimType === 'hue'
              ? `@keyframes ${gradKfId}{from{filter:hue-rotate(0deg)}to{filter:hue-rotate(360deg)}}`
              : `@keyframes ${gradKfId}{0%,100%{filter:brightness(1)}50%{filter:brightness(1.35)}}`
          ) : null;

          const gradientStyle = isGradient ? (() => {
            const from   = text.gradientFrom;
            const to     = text.gradientTo;
            const mid    = text.gradientMid;
            const midPos = text.gradientMidPos ?? 50;
            const stops  = mid ? `${from}, ${mid} ${midPos}%, ${to}` : `${from}, ${to}`;
            const bg     = text.gradientType === 'radial'
              ? `radial-gradient(circle, ${stops})`
              : `linear-gradient(${text.gradientAngle ?? 135}deg, ${stops})`;
            const shiftAnim = gradAnimated && gradAnimType === 'shift';
            return {
              background:           bg,
              WebkitBackgroundClip: 'text',
              backgroundClip:       'text',
              WebkitTextFillColor:  'transparent',
              color:                'transparent',
              ...(shiftAnim ? {
                backgroundSize: '300% 300%',
                animation: `${gradKfId} ${gradAnimSpeed}s ease infinite`,
              } : {}),
            };
          })() : { color: text.fill };

          // Hue/pulse animation applies to the wrapping span, not the background
          const gradWrapAnim = gradAnimated && gradAnimType !== 'shift'
            ? { animation: `${gradKfId} ${gradAnimSpeed}s ${gradAnimType === 'hue' ? 'linear' : 'ease-in-out'} infinite` }
            : {};

          // ── Shimmer sweep (Feature I) ──────────────────────────────────────
          const shimmerOn        = !!(text.shimmer);
          const shimKfId         = `sh-${text.id}`;
          const shimmerKeyframes = shimmerOn
            ? `@keyframes ${shimKfId}{0%{background-position:-200% center}100%{background-position:200% center}}`
            : null;
          const shimmerColor = text.shimmerColor ?? 'rgba(255,255,255,0.55)';
          const shimmerSpeed = text.shimmerSpeed ?? 2;

          // ── Text filter — brightness / saturate / hue (Feature J) ─────────
          const tfParts = [];
          if ((text.filterBrightness ?? 1) !== 1) tfParts.push(`brightness(${text.filterBrightness})`);
          if ((text.filterSaturate   ?? 1) !== 1) tfParts.push(`saturate(${text.filterSaturate})`);
          if ((text.filterHue        ?? 0) !== 0) tfParts.push(`hue-rotate(${text.filterHue}deg)`);
          const textFilterStr = tfParts.length > 0 ? tfParts.join(' ') : undefined;

          const alignment = text.textAlign ?? globalAlignment;

          // ── paintOrder (Feature E) ────────────────────────────────────────
          const paintOrder = (text.strokePosition === 'inner') ? 'fill stroke' : 'stroke fill';

          // Caption layers scale with the live container height so they look
          // consistent regardless of screen / window size.
          const CAPTION_REF_H = 600; // px — the height at which caption fontSizes were authored
          const scaledFontSize = text.type === 'caption'
            ? Math.round(text.fontSize * (containerH / CAPTION_REF_H))
            : text.fontSize;

          const baseTextStyle = {
            fontFamily:       baseFontFamily,
            fontSize:         `${scaledFontSize}px`,
            ...gradientStyle,
            WebkitTextStroke: (!isGradient && text.hasStroke) ? `${text.strokeWidth}px ${text.stroke}` : '0px transparent',
            paintOrder:       paintOrder,
            textShadow:       isGradient ? 'none' : textShadow,
            fontWeight:       text.fontWeight ?? (isPunch ? 900 : 700),
            textTransform:    text.textCase ? (TC_MAP[text.textCase] || 'none') : (text.font === 'Cormorant Garamond' || text.font === 'Playfair Display' ? 'none' : 'uppercase'),
            lineHeight:       text.lineHeight ?? 1,
            textAlign:        alignment,
            whiteSpace:       text.width ? 'pre-wrap' : 'pre',
            pointerEvents:    'none',
            letterSpacing:    `${text.letterSpacing ?? 0}px`,
          };

          // ── Background style (Feature F) ──────────────────────────────────
          const defPadH   = { pill: 24, bar: 20, box: 14 }[text.bgStyle ?? 'pill'] ?? 24;
          const defPadV   = { pill: 8,  bar: 6,  box: 8  }[text.bgStyle ?? 'pill'] ?? 8;
          const defRadius = { pill: '999px', bar: '0px', box: '6px' }[text.bgStyle ?? 'pill'] ?? '999px';
          const bgPadH  = text.bgPaddingH ?? defPadH;
          const bgPadV  = text.bgPaddingV ?? defPadV;
          const bgRad   = text.bgRadius != null ? `${text.bgRadius}px` : defRadius;
          const bgOp    = text.bgOpacity ?? 1;
          const bgColorVal = (() => {
            if (!bgOn) return 'transparent';
            const base = hexToRgba(text.bgColor, bgOp);
            if (text.bgGradientTo) {
              return `linear-gradient(${text.bgGradientAngle ?? 90}deg, ${base}, ${hexToRgba(text.bgGradientTo, bgOp)})`;
            }
            return base;
          })();

          const bgWrapStyle = bgOn ? {
            background:           bgColorVal,
            padding:              `${bgPadV}px ${bgPadH}px`,
            borderRadius:         bgRad,
            boxShadow:            'var(--shadow-lg)',
            backdropFilter:       (text.backdropBlur ?? 0) > 0 ? `blur(${text.backdropBlur}px)` : undefined,
            WebkitBackdropFilter: (text.backdropBlur ?? 0) > 0 ? `blur(${text.backdropBlur}px)` : undefined,
            ...(text.bgBorderWidth > 0 ? { border: `${text.bgBorderWidth}px solid ${text.bgBorderColor ?? 'rgba(255,255,255,0.5)'}` } : {}),
          } : {};

          // ── textContent selection (includes WordColoredText, Feature H) ───
          const hasWordColors = text.wordColors && Object.keys(text.wordColors).length > 0;
          // Karaoke: only in play/preview mode, when word timestamps exist, and not explicitly disabled
          const hasKaraoke = !isDesignMode && !!(text.wordTimestamps?.length) && !text.karaokeOff;
          const textContent =
            text.shape === 'arc'              ? <ArcText      text={text} style={baseTextStyle} />
            : CURVE_SHAPES.has(text.shape)    ? <CurveText    text={text} style={baseTextStyle} />
            : hasWordColors                   ? <WordColoredText text={text} style={baseTextStyle} />
            : hasKaraoke                      ? <KaraokeText  text={text} style={baseTextStyle} videoElRef={videoElRef} hookStart={timing.startTime} playing={video.playing} />
            : text.content;

          const layerOpacity = text.opacity ?? 1;

          // ── Grain filter (Feature G) ──────────────────────────────────────
          const hasGrain = (text.grain ?? 0) > 0;
          const grainFilter = hasGrain ? `url(#grain-${text.id})` : undefined;

          return (
            <motion.div
              key={text.id}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: text.blendMode || 'normal' }}
              initial={false}
              animate={{ opacity: layerOpacity }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              <DraggableLayer
                text={text}
                containerRef={containerRef}
                isSelected={selectedTextId === text.id}
                isMultiSelected={selectedTextIds.includes(text.id) && selectedTextId !== text.id}
                accent={accent}
                alignment={alignment}
                activeTool={activeTool}
                onSelect={handleSelect}
                onPositionChange={handlePositionChange}
                onResizeStart={handleResizeStart}
                onWidthChange={handleWidthChange}
                onDoubleClick={(id) => { setEditingId(id); setSelectedTextId(id); setSelectedTextIds([id]); }}
                isEditing={editingId === text.id}
                onEditCommit={handleEditCommit}
              >
                <WarpWrapper layerId={text.id} shape={text.shape} amount={text.warpAmount}>
                  <div key={animKey}>
                    {/* All layers — char-level or plain — share the same motion wrapper.
                        textEffect drives the renderer; motionRecipe drives entry/exit. */}
                    {(gradKeyframes || shimmerKeyframes) && (
                      <style>{[gradKeyframes, shimmerKeyframes].filter(Boolean).join('\n')}</style>
                    )}
                    <div style={{ ...bgWrapStyle, position: 'relative' }}>
                      {/* Grain SVG filter (Feature G) */}
                      {hasGrain && (
                        <svg width="0" height="0" style={{ position: 'absolute', overflow: 'visible', pointerEvents: 'none' }}>
                          <defs>
                            <filter id={`grain-${text.id}`} x="-5%" y="-5%" width="110%" height="110%">
                              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise"/>
                              <feColorMatrix type="saturate" values="0" in="noise" result="gn"/>
                              <feComponentTransfer in="gn" result="scaled">
                                <feFuncA type="linear" slope={((text.grain ?? 0) / 100) * 0.5}/>
                              </feComponentTransfer>
                              <feBlend in="SourceGraphic" in2="scaled" mode="overlay"/>
                            </filter>
                          </defs>
                        </svg>
                      )}
                      <motion.div
                        initial={playing ? baseState.initial : false}
                        animate={baseState.animate}
                        exit={baseState.exit}
                        transition={transition}
                        style={{
                          position: 'relative', display: 'inline-block',
                          filter: [grainFilter, textFilterStr].filter(Boolean).join(' ') || undefined,
                          ...gradWrapAnim,
                        }}
                      >
                        {/* Double stroke (Feature E) — behind main text */}
                        {text.hasStroke2 && (
                          <span aria-hidden="true" style={{
                            ...baseTextStyle,
                            position: 'absolute', inset: 0,
                            WebkitTextStroke: `${text.strokeWidth2 ?? 8}px ${text.stroke2 ?? '#000000'}`,
                            WebkitTextFillColor: 'transparent',
                            color: 'transparent',
                            paintOrder: 'stroke fill',
                            textShadow: 'none',
                            userSelect: 'none',
                            pointerEvents: 'none',
                          }}>
                            {textContent}
                          </span>
                        )}

                        {/* Main text — char-level effect OR plain content */}
                        {textEffect === 'typewriter'  && <TypewriterText  text={text} style={baseTextStyle} playing={playing} animKey={animKey} entryDelay={entryOffset} />}
                        {textEffect === 'wave'        && <WaveText        text={text} style={baseTextStyle} playing={playing} animKey={animKey} entryDelay={entryOffset} />}
                        {textEffect === 'scramble'    && <ScrambleText    text={text} style={baseTextStyle} playing={playing} animKey={animKey} />}
                        {textEffect === 'glitch'      && <GlitchText      text={text} style={baseTextStyle} playing={playing} animKey={animKey} entryDelay={entryOffset} />}
                        {textEffect === 'flicker'     && <FlickerText     text={text} style={baseTextStyle} playing={playing} animKey={animKey} />}
                        {textEffect === 'char-bounce' && <CharBounceText  text={text} style={baseTextStyle} playing={playing} animKey={animKey} />}
                        {textEffect === 'fade-chars'  && <FadeCharsText   text={text} style={baseTextStyle} playing={playing} animKey={animKey} />}
                        {textEffect === 'rise-chars'  && <RiseCharsText   text={text} style={baseTextStyle} playing={playing} animKey={animKey} />}
                        {textEffect === 'drop-chars'  && <DropCharsText   text={text} style={baseTextStyle} playing={playing} animKey={animKey} />}
                        {textEffect === 'blur-chars'  && <BlurCharsText   text={text} style={baseTextStyle} playing={playing} animKey={animKey} />}
                        {textEffect === 'pop-chars'   && <PopCharsText    text={text} style={baseTextStyle} playing={playing} animKey={animKey} />}
                        {textEffect === 'stamp-chars' && <StampCharsText  text={text} style={baseTextStyle} playing={playing} animKey={animKey} />}
                        {textEffect === 'slide-chars' && <SlideCharsText  text={text} style={baseTextStyle} playing={playing} animKey={animKey} />}
                        {textEffect === 'swing'       && <SwingText       text={text} style={baseTextStyle} playing={playing} animKey={animKey} />}
                        {textEffect === 'count-up'    && <CountUpText     text={text} style={baseTextStyle} playing={playing} animKey={animKey} />}
                        {!textEffect                  && <span style={baseTextStyle}>{textContent}</span>}
                      </motion.div>
                      {/* Shimmer sweep overlay (Feature I) */}
                      {shimmerOn && (
                        <div aria-hidden="true" style={{
                          position: 'absolute', inset: 0, pointerEvents: 'none',
                          background: `linear-gradient(105deg, transparent 35%, ${shimmerColor} 50%, transparent 65%)`,
                          backgroundSize: '200% 100%',
                          animation: `${shimKfId} ${shimmerSpeed}s linear infinite`,
                          mixBlendMode: 'overlay',
                          borderRadius: 'inherit',
                          zIndex: 1,
                        }} />
                      )}
                    </div>
                  </div>
                </WarpWrapper>
              </DraggableLayer>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
