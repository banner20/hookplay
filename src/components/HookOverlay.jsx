import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useHookStore } from '../context/HookContext';

const getTransition = (preset) => {
  switch (preset) {
    case 'Ease Out Smooth':
      return { type: 'tween', ease: [0.25, 0.1, 0.25, 1], duration: 0.6 };
    case 'Ease Out Expo':
      return { type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.8 };
    case 'Pop':
      return { type: 'spring', stiffness: 400, damping: 15 };
    case 'Elastic':
      return { type: 'spring', stiffness: 500, damping: 10, mass: 1 };
    case 'Bounce Light':
      return { type: 'spring', stiffness: 300, damping: 12 };
    case 'Soft Float':
      return { type: 'tween', ease: 'easeInOut', duration: 1.2 };
    case 'Ease In':
      return { type: 'tween', ease: [0.42, 0, 1, 1], duration: 0.4 };
    case 'No Overshoot':
      return { type: 'tween', ease: 'easeOut', duration: 0.4 };
    default:
      return { type: 'spring', stiffness: 400, damping: 15 };
  }
};

const getLayerAnimation = (text, motionProfile) => {
  const recipe = text.animation || motionProfile?.layerAnimations?.[text.role];

  switch (recipe) {
    case 'drift-up':
      return {
        initial: { opacity: 0, y: 28, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -16 },
      };
    case 'counter-slam':
      return {
        initial: { opacity: 0, y: 16, scale: 0.65, rotate: -6 },
        animate: { opacity: 1, y: 0, scale: 1, rotate: 0 },
        exit: { opacity: 0, y: -10, scale: 0.92 },
      };
    case 'pill-pop':
      return {
        initial: { opacity: 0, y: 18, scale: 0.85 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 8, scale: 0.9 },
      };
    case 'fade-up':
      return {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
      };
    case 'zoom-spin':
      return {
        initial: { opacity: 0, scale: 0.5, rotate: -10 },
        animate: { opacity: 1, scale: 1, rotate: 0 },
        exit: { opacity: 0, scale: 0.88 },
      };
    case 'rise':
      return {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
      };
    case 'slam':
    default:
      return text.type === 'punch'
        ? {
            initial: { scale: 0.5, opacity: 0, rotate: -5 },
            animate: { scale: 1, opacity: 1, rotate: 0 },
            exit: { opacity: 0, scale: 0.9 },
          }
        : {
            initial: { y: -20, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            exit: { opacity: 0, scale: 0.96 },
          };
  }
};

const getPhaseFractions = (timing) => {
  const phases = timing?.phases || { entry: 20, emphasis: 50, hold: 20, exit: 10 };
  const total = Object.values(phases).reduce((sum, value) => sum + value, 0) || 100;
  const entry = phases.entry / total;
  const emphasis = phases.emphasis / total;
  const hold = phases.hold / total;
  const exit = phases.exit / total;

  return {
    entryEnd: entry,
    emphasisEnd: entry + emphasis,
    holdEnd: entry + emphasis + hold,
    exitEnd: entry + emphasis + hold + exit,
  };
};

const getRecipeKeyframes = ({ style, text, idx, baseState, phaseFractions }) => {
  const isPunch = text.type === 'punch';
  const baseScale = baseState.animate?.scale ?? 1;
  const baseY = baseState.animate?.y ?? 0;
  const baseRotate = baseState.animate?.rotate ?? 0;
  const punchBoost = isPunch ? 0.12 : 0.05;
  const subtleLift = text.role === 'eyebrow' ? -4 : -2;

  const defaultKeyframes = {
    scale: [baseScale, baseScale + punchBoost, baseScale],
    y: [baseY, baseY + subtleLift, baseY],
    rotate: [baseRotate, baseRotate, baseRotate],
    opacity: [1, 1, 1],
    times: [0, Math.min(0.55, phaseFractions.emphasisEnd), Math.min(0.86, phaseFractions.holdEnd)],
  };

  switch (style) {
    case 'counter-pulse':
      return {
        scale: [baseScale, baseScale + 0.18, baseScale + 0.05, baseScale],
        y: [baseY, baseY - 8, baseY - 3, baseY],
        rotate: [baseRotate, 0, 0, baseRotate],
        opacity: [1, 1, 1, 1],
        times: [0, phaseFractions.entryEnd, Math.min(0.68, phaseFractions.emphasisEnd), Math.min(0.9, phaseFractions.holdEnd)],
      };
    case 'breaking-alert':
      return {
        scale: [baseScale, baseScale + 0.1, baseScale, baseScale + 0.04, baseScale],
        y: [baseY, baseY - 4, baseY, baseY - 1, baseY],
        rotate: [baseRotate, -1.5, 1.5, 0, baseRotate],
        opacity: [1, 0.92, 1, 0.95, 1],
        times: [0, 0.18, phaseFractions.emphasisEnd, Math.min(0.82, phaseFractions.holdEnd), Math.min(0.94, phaseFractions.holdEnd)],
      };
    case 'tease-reveal':
      return {
        scale: [baseScale, baseScale + 0.04, baseScale + 0.09, baseScale],
        y: [baseY, baseY, baseY - 5, baseY],
        rotate: [baseRotate, baseRotate, 0, baseRotate],
        opacity: [1, 1, 1, 1],
        times: [0, phaseFractions.entryEnd, phaseFractions.emphasisEnd, Math.min(0.9, phaseFractions.holdEnd)],
      };
    case 'story-journal':
      return {
        scale: [baseScale, baseScale + 0.025, baseScale],
        y: [baseY, baseY - 6, baseY - 2],
        rotate: [baseRotate, -0.8, 0],
        opacity: [1, 1, 0.98],
        times: [0, Math.min(0.62, phaseFractions.emphasisEnd), Math.min(0.94, phaseFractions.holdEnd)],
      };
    case 'number-stack':
      return {
        scale: [baseScale, baseScale + 0.1, baseScale + 0.03, baseScale],
        y: [baseY, baseY - 10, baseY - 2, baseY],
        rotate: [baseRotate, 0, 0, baseRotate],
        opacity: [1, 1, 1, 1],
        times: [0, phaseFractions.entryEnd, Math.min(0.72, phaseFractions.emphasisEnd), Math.min(0.9, phaseFractions.holdEnd)],
      };
    case 'versus-stack':
      return {
        scale: [baseScale, baseScale + 0.08, baseScale],
        y: [baseY, baseY - 4, baseY],
        rotate: [baseRotate, idx === 1 ? 0 : idx % 2 === 0 ? -1.2 : 1.2, baseRotate],
        opacity: [1, 1, 1],
        times: [0, phaseFractions.emphasisEnd, Math.min(0.92, phaseFractions.holdEnd)],
      };
    case 'slam-offer':
    case 'flip-reveal':
    default:
      return defaultKeyframes;
  }
};

export default function HookOverlay() {
  const { video, hookConfig, setHookConfig, selectedTextId, setSelectedTextId } = useHookStore();
  const { timing, texts, curves, motionProfile, layout, accent } = hookConfig;

  const isActive = video.currentTime >= timing.startTime && video.currentTime <= (timing.startTime + timing.duration);
  const [key, setKey] = useState(0);
  const containerRef = useRef(null);
  const phaseFractions = getPhaseFractions(timing);

  useEffect(() => {
    if (Math.abs(video.currentTime - timing.startTime) < 0.1 && video.playing) {
      setKey((prev) => prev + 1);
    }
  }, [video.currentTime, timing.startTime, video.playing]);

  const handleDragEnd = (event, info, id) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    let newX = ((info.point.x - rect.left) / rect.width) * 100;
    let newY = ((info.point.y - rect.top) / rect.height) * 100;

    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    setHookConfig((prev) => ({
      ...prev,
      texts: prev.texts.map((text) => (text.id === id ? { ...text, x: newX, y: newY } : text)),
    }));
  };

  const handleResizeStart = (event, textId, currentSize) => {
    event.stopPropagation();
    const startY = event.clientY;

    const onMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newSize = Math.max(10, currentSize + (deltaY * 0.5));

      setHookConfig((prev) => ({
        ...prev,
        texts: prev.texts.map((text) => (
          text.id === textId ? { ...text, fontSize: Math.round(newSize) } : text
        )),
      }));
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleContainerClick = (event) => {
    if (event.target.id === 'hook-export-container') {
      setSelectedTextId(null);
    }
  };

  if (!isActive) return null;

  return (
    <div
      id="hook-export-container"
      ref={containerRef}
      onPointerDown={handleContainerClick}
      style={{ position: 'absolute', inset: 0, zIndex: 10, overflow: 'hidden' }}
    >
      <AnimatePresence mode="wait">
        <React.Fragment key={key}>
          {texts.map((text, idx) => {
            const baseFontFamily = text.font.toLowerCase() === 'outfit'
              ? 'var(--font-display)'
              : 'var(--font-sans)';
            const baseState = getLayerAnimation(text, motionProfile);
            const keyframes = getRecipeKeyframes({
              style: motionProfile?.style,
              text,
              idx,
              baseState,
              phaseFractions,
            });
            const transition = {
              ...(text.type === 'punch'
                ? getTransition(curves.emphasis)
                : getTransition(curves.entry)),
              delay: 0.1 + ((motionProfile?.stagger ?? 0.15) * idx),
            };
            const isSelected = selectedTextId === text.id;
            const alignment = layout?.alignment || 'center';
            const translateX = alignment === 'left' ? '0%' : alignment === 'right' ? '-100%' : '-50%';
            const textAlign = alignment;
            const maxWidth = alignment === 'center' ? '78%' : '62%';
            const sequenceDuration = Math.max(0.8, (timing?.duration ?? 3) - (0.18 * idx));

            return (
              <motion.div
                key={`container-${text.id}`}
                drag
                dragMomentum={false}
                onDragEnd={(event, info) => handleDragEnd(event, info, text.id)}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  setSelectedTextId(text.id);
                }}
                style={{
                  position: 'absolute',
                  left: `${text.x}%`,
                  top: `${text.y}%`,
                  transform: `translate(${translateX}, -50%)`,
                  zIndex: isSelected ? 30 : 20,
                  cursor: isSelected ? 'grab' : 'pointer',
                  border: isSelected ? `2px dashed ${accent || 'var(--accent-primary)'}` : '2px dashed transparent',
                  padding: '4px',
                  boxSizing: 'content-box',
                  width: maxWidth,
                }}
              >
                <motion.div
                  key={text.id}
                  initial={baseState.initial}
                  animate={{
                    ...baseState.animate,
                    scale: keyframes.scale,
                    y: keyframes.y,
                    rotate: keyframes.rotate,
                    opacity: keyframes.opacity,
                  }}
                  exit={baseState.exit}
                  transition={{
                    ...transition,
                    duration: sequenceDuration,
                    times: keyframes.times,
                  }}
                  style={{
                    fontFamily: baseFontFamily,
                    fontSize: `${text.fontSize}px`,
                    color: text.fill,
                    WebkitTextStroke: text.hasStroke ? `${text.strokeWidth}px ${text.stroke}` : '0px transparent',
                    textShadow: text.type === 'punch'
                      ? '0 4px 20px rgba(0,0,0,0.6)'
                      : '0 2px 10px rgba(0,0,0,0.5)',
                    fontWeight: text.type === 'punch' ? 900 : 700,
                    textTransform: 'uppercase',
                    lineHeight: 1,
                    textAlign,
                    background: text.bgColor !== 'transparent' ? text.bgColor : 'transparent',
                    padding: text.bgColor !== 'transparent' ? '8px 24px' : '0',
                    borderRadius: text.bgColor !== 'transparent' ? 'var(--radius-xl)' : '0',
                    boxShadow: text.bgColor !== 'transparent' ? 'var(--shadow-lg)' : 'none',
                    whiteSpace: 'normal',
                    pointerEvents: 'none',
                  }}
                >
                  {text.content}
                </motion.div>

                {isSelected && (
                  <div
                    onPointerDown={(event) => handleResizeStart(event, text.id, text.fontSize)}
                    style={{
                      position: 'absolute',
                      right: '-8px',
                      bottom: '-8px',
                      width: '16px',
                      height: '16px',
                      background: 'var(--accent-primary)',
                      borderRadius: '50%',
                      cursor: 'se-resize',
                      zIndex: 40,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </React.Fragment>
      </AnimatePresence>
    </div>
  );
}
