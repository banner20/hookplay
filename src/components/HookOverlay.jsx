import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useHookStore } from '../context/HookContext';
import { getTransition } from '../utils/transitions';

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
            {letter === ' ' ? '\u00a0' : letter}
          </span>
        );
      })}
    </div>
  );
}

// ─── Draggable wrapper — raw pointer events, zero Framer Motion drag conflict ──
function DraggableLayer({ text, containerRef, isSelected, accent, alignment, activeTool, onSelect, onPositionChange, onResizeStart, children }) {
  const divRef = useRef(null);
  const drag = useRef({ active: false, startPtrX: 0, startPtrY: 0, origX: 0, origY: 0, liveX: 0, liveY: 0 });
  const translateX = alignment === 'left' ? '0%' : alignment === 'right' ? '-100%' : '-50%';

  const handlePointerDown = (e) => {
    e.stopPropagation();
    onSelect(text.id);
    if (activeTool === 'text') return;
    drag.current = { active: true, startPtrX: e.clientX, startPtrY: e.clientY, origX: text.x, origY: text.y, liveX: text.x, liveY: text.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!drag.current.active || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const newX = Math.max(0, Math.min(100, drag.current.origX + ((e.clientX - drag.current.startPtrX) / rect.width) * 100));
    const newY = Math.max(0, Math.min(100, drag.current.origY + ((e.clientY - drag.current.startPtrY) / rect.height) * 100));
    drag.current.liveX = newX;
    drag.current.liveY = newY;
    if (divRef.current) {
      divRef.current.style.left = `${newX}%`;
      divRef.current.style.top  = `${newY}%`;
    }
  };

  const handlePointerUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    onPositionChange(text.id, drag.current.liveX, drag.current.liveY);
  };

  return (
    <div
      ref={divRef}
      style={{
        position:    'absolute',
        left:        `${text.x}%`,
        top:         `${text.y}%`,
        transform:   `translate(${translateX}, -50%)`,
        zIndex:      isSelected ? 30 : 20,
        cursor:      activeTool === 'text' ? 'crosshair' : (isSelected ? 'grab' : 'pointer'),
        border:      isSelected ? `2px dashed ${accent || 'var(--accent-primary)'}` : '2px dashed transparent',
        padding:     '4px',
        boxSizing:   'content-box',
        maxWidth:    alignment === 'center' ? '78%' : '62%',
        touchAction: 'none',
        userSelect:  'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {children}
      {isSelected && (
        <div
          onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, text.id, text.fontSize); }}
          style={{ position: 'absolute', right: -8, bottom: -8, width: 14, height: 14, background: accent || 'var(--accent-primary)', borderRadius: '50%', cursor: 'se-resize', zIndex: 40, boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }}
        />
      )}
    </div>
  );
}

// ─── Main overlay ──────────────────────────────────────────────────────────
export default function HookOverlay() {
  const {
    appMode, video, hookConfig, setHookConfig,
    selectedTextId, setSelectedTextId,
    activeTool, addTextAtPosition,
  } = useHookStore();

  const { timing, texts, curves, motionProfile, layout, accent } = hookConfig;
  const isDesignMode = appMode === 'design';

  // Only active during hook window in play mode
  const isActive = video.currentTime >= timing.startTime &&
                   video.currentTime <= (timing.startTime + timing.duration);
  const showTexts = isDesignMode || isActive;

  const [animKey, setAnimKey] = useState(0);
  const prevMode = useRef(appMode);

  useEffect(() => {
    if (prevMode.current === 'design' && appMode === 'play') {
      setAnimKey((k) => k + 1);
    }
    prevMode.current = appMode;
  }, [appMode]);

  useEffect(() => {
    if (Math.abs(video.currentTime - timing.startTime) < 0.1 && video.playing) {
      setAnimKey((k) => k + 1);
    }
  }, [video.currentTime, timing.startTime, video.playing]);

  const containerRef = useRef(null);

  const handlePositionChange = (id, newX, newY) => {
    setHookConfig((prev) => ({
      ...prev,
      texts: prev.texts.map((t) => t.id === id ? { ...t, x: newX, y: newY } : t),
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
    }
  };

  const alignment = layout?.alignment || 'center';

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
      <AnimatePresence>
        {showTexts && texts.map((text, originalIdx) => {
          // 1. Calculate timing variables using original index
          const stagger = motionProfile?.stagger ?? 0.15;
          const entryOffset = text.entryTime ?? (originalIdx * stagger + 0.1);
          const layerDur = text.duration ?? (timing.duration - entryOffset);
          const textStart = timing.startTime + entryOffset;
          const textEnd   = textStart + layerDur;
          
          // 2. Visibility check (with small buffer)
          const isVisible = isDesignMode || (video.currentTime >= textStart - 0.02 && video.currentTime <= textEnd + 0.02);
          
          if (!isVisible) return null;

          const recipe     = text.animation || motionProfile?.layerAnimations?.[text.role];
          const isCharLevel = ['typewriter', 'wave', 'scramble', 'glitch'].includes(recipe);
          const isPunch    = text.type === 'punch';
          const baseState  = getLayerAnimation(recipe, isPunch);
          const playing    = !isDesignMode;

          const activeCurve = text.curve ?? (isPunch ? curves.emphasis : curves.entry);
          const transition  = getTransition(activeCurve);

          const baseFontFamily = text.font === 'Cormorant Garamond'
            ? 'var(--font-serif)'
            : text.font?.toLowerCase() === 'outfit' ? 'var(--font-display)' : 'var(--font-sans)';

          const textStyle = {
            fontFamily:       baseFontFamily,
            fontSize:         `${text.fontSize}px`,
            color:            text.fill,
            WebkitTextStroke: text.hasStroke ? `${text.strokeWidth}px ${text.stroke}` : '0px transparent',
            textShadow:       isPunch ? '0 4px 20px rgba(0,0,0,0.6)' : '0 2px 10px rgba(0,0,0,0.5)',
            fontWeight:       text.fontWeight ?? (isPunch ? 900 : 700),
            textTransform:    text.font === 'Cormorant Garamond' ? 'none' : 'uppercase',
            lineHeight:       text.lineHeight ?? 1,
            textAlign:        alignment,
            background:       text.bgColor !== 'transparent' ? text.bgColor : 'transparent',
            padding:          text.bgColor !== 'transparent' ? '8px 24px' : '0',
            borderRadius:     text.bgColor !== 'transparent' ? 'var(--radius-xl)' : '0',
            boxShadow:        text.bgColor !== 'transparent' ? 'var(--shadow-lg)' : 'none',
            whiteSpace:       'normal',
            pointerEvents:    'none',
            letterSpacing:    `${text.letterSpacing ?? 0}px`,
          };

          return (
            <DraggableLayer
              key={text.id}
              text={text}
              containerRef={containerRef}
              isSelected={selectedTextId === text.id}
              accent={accent}
              alignment={alignment}
              activeTool={activeTool}
              onSelect={setSelectedTextId}
              onPositionChange={handlePositionChange}
              onResizeStart={handleResizeStart}
            >
              <div key={animKey} style={{ display: 'contents' }}>
                {recipe === 'typewriter' && <TypewriterText text={text} style={textStyle} playing={playing} animKey={animKey} />}
                {recipe === 'wave'       && <WaveText       text={text} style={textStyle} playing={playing} animKey={animKey} />}
                {recipe === 'scramble'   && <ScrambleText   text={text} style={textStyle} playing={playing} animKey={animKey} />}
                {recipe === 'glitch'     && <GlitchText     text={text} style={textStyle} playing={playing} animKey={animKey} />}

                {!isCharLevel && (
                  <motion.div
                    initial={playing ? baseState.initial : false}
                    animate={baseState.animate}
                    exit={baseState.exit}
                    transition={transition}
                    style={textStyle}
                  >
                    {text.shape === 'arc' ? <ArcText text={text} style={textStyle} /> : text.content}
                  </motion.div>
                )}
              </div>
            </DraggableLayer>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
