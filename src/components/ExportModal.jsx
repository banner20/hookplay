import React, { useRef, useState } from 'react';
import { useHookStore } from '../context/HookContext';
import { CheckCircle2, Download, Video, X } from 'lucide-react';

// ── Easing ────────────────────────────────────────────────────────────────────
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const easeOutExpo   = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeOutBack   = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const easeInOut     = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOutBounce = (t) => {
  const n1 = 7.5625, d1 = 2.75;
  if (t < 1 / d1)       return n1 * t * t;
  if (t < 2 / d1)       return n1 * (t -= 1.5 / d1)  * t + 0.75;
  if (t < 2.5 / d1)     return n1 * (t -= 2.25 / d1) * t + 0.9375;
                         return n1 * (t -= 2.625 / d1)* t + 0.984375;
};

function getEntryEase(anim) {
  if (['slam', 'counter-slam', 'stamp', 'skew-in'].includes(anim)) return easeOutBack;
  if (anim === 'bounce-in') return easeOutBounce;
  return easeOutExpo;
}

// ── Canvas helpers ────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  const R = Math.min(Math.abs(r), w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + R, y);
  ctx.lineTo(x + w - R, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + R);
  ctx.lineTo(x + w, y + h - R);
  ctx.quadraticCurveTo(x + w, y + h, x + w - R, y + h);
  ctx.lineTo(x + R, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - R);
  ctx.lineTo(x, y + R);
  ctx.quadraticCurveTo(x, y, x + R, y);
  ctx.closePath();
}

function hexToRgba(hex, alpha = 1) {
  if (!hex || hex === 'transparent') return `rgba(0,0,0,0)`;
  const c    = hex.replace('#', '');
  const full = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
  return `rgba(${parseInt(full.slice(0, 2), 16)},${parseInt(full.slice(2, 4), 16)},${parseInt(full.slice(4, 6), 16)},${alpha})`;
}

const FONT_MAP = {
  'Inter': 'Inter', 'Outfit': 'Outfit', 'Space Grotesk': 'Space Grotesk',
  'Bebas Neue': 'Bebas Neue', 'Playfair Display': 'Playfair Display',
  'Cormorant Garamond': 'Cormorant Garamond', 'DM Sans': 'DM Sans',
  'Plus Jakarta Sans': 'Plus Jakarta Sans', 'Syne': 'Syne', 'Anton': 'Anton',
  'Oswald': 'Oswald', 'Barlow Condensed': 'Barlow Condensed', 'Raleway': 'Raleway',
  'Montserrat': 'Montserrat', 'Poppins': 'Poppins', 'Rubik': 'Rubik',
  'League Spartan': 'League Spartan', 'Unbounded': 'Unbounded',
};
function resolveFont(name) { return FONT_MAP[name] ?? name ?? 'Inter'; }

function applyTextCase(str, textCase, font) {
  if (textCase === 'upper') return str.toUpperCase();
  if (textCase === 'lower') return str.toLowerCase();
  if (textCase === 'title') return str.replace(/\b\w/g, c => c.toUpperCase());
  if (!textCase && font !== 'Cormorant Garamond' && font !== 'Playfair Display') return str.toUpperCase();
  return str;
}

// ── Gradient builder ──────────────────────────────────────────────────────────
function buildGradientFill(ctx, text, textW, textH) {
  if (text.gradientType === 'radial') {
    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(textW, textH) / 2);
    grd.addColorStop(0, text.gradientFrom);
    if (text.gradientMid) grd.addColorStop((text.gradientMidPos ?? 50) / 100, text.gradientMid);
    grd.addColorStop(1, text.gradientTo);
    return grd;
  }
  const angle = ((text.gradientAngle ?? 135) * Math.PI) / 180;
  const cos   = Math.cos(angle), sin = Math.sin(angle);
  const len   = Math.abs(textW / 2 * cos) + Math.abs(textH / 2 * sin);
  const grd   = ctx.createLinearGradient(-len * cos, -len * sin, len * cos, len * sin);
  grd.addColorStop(0, text.gradientFrom);
  if (text.gradientMid) grd.addColorStop((text.gradientMidPos ?? 50) / 100, text.gradientMid);
  grd.addColorStop(1, text.gradientTo);
  return grd;
}

// ── Shadow helpers ────────────────────────────────────────────────────────────
function applyShadow(ctx, text, fill) {
  if (text.shadowMode === 'custom') {
    ctx.shadowOffsetX = text.shadowX    ?? 0;
    ctx.shadowOffsetY = text.shadowY    ?? 4;
    ctx.shadowBlur    = text.shadowBlur ?? 10;
    ctx.shadowColor   = hexToRgba(text.shadowColor ?? '#000', text.shadowOpacity ?? 0.6);
  } else {
    switch (text.shadow) {
      case 'none':  break;
      case 'soft':
        ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 2; ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(0,0,0,0.55)'; break;
      case 'hard':
        ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3; ctx.shadowBlur = 0;
        ctx.shadowColor = 'rgba(0,0,0,0.9)'; break;
      case 'glow':
        ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 4; ctx.shadowBlur = 20;
        ctx.shadowColor = hexToRgba(fill, 0.6); break;
      default:
        ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 2; ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
    }
  }
}

function clearShadow(ctx) {
  ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 0;    ctx.shadowColor = 'transparent';
}

// ── Letter-spacing char measurement ──────────────────────────────────────────
function charsWidth(ctx, chars, ls) {
  let w = 0;
  for (let i = 0; i < chars.length; i++) {
    w += ctx.measureText(chars[i]).width + (i < chars.length - 1 ? ls : 0);
  }
  return w;
}

// ── Text-effect constants ─────────────────────────────────────────────────────
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!?%&';

// Linear keyframe sampler (times + values arrays, progress 0→1)
function sampleKeyframes(times, values, progress) {
  if (progress <= 0) return values[0];
  if (progress >= 1) return values[values.length - 1];
  for (let i = 1; i < times.length; i++) {
    if (progress <= times[i]) {
      const t = (progress - times[i - 1]) / (times[i] - times[i - 1]);
      return values[i - 1] + (values[i] - values[i - 1]) * t;
    }
  }
  return values[values.length - 1];
}

const FLICKER_TIMES  = [0, 0.12, 0.28, 0.48, 0.64, 0.82, 1];
const FLICKER_VALUES = [0, 1,    0.15, 1,    0,    0.85, 1];

// ── Core layer renderer ───────────────────────────────────────────────────────
function renderLayer(ctx, text, t, hookConfig, W, H) {
  const idx       = hookConfig.texts.findIndex(tx => tx.id === text.id);
  const stagger   = hookConfig.motionProfile?.stagger ?? 0.12;
  const entryTime = text.entryTime ?? (idx * stagger + 0.1);
  const layerDur  = text.duration  ?? (hookConfig.timing.duration - entryTime);
  const exitTime  = entryTime + layerDur;

  if (t < entryTime - 0.05 || t > exitTime + 0.35) return;

  const ENTRY_DUR = 0.35;
  const EXIT_DUR  = 0.18;
  const relTime   = t - entryTime;
  const entryRaw  = clamp01(relTime / ENTRY_DUR);
  const exitRaw   = clamp01((t - exitTime) / EXIT_DUR);

  const anim      = text.animation ?? 'drift-up';
  const eased     = getEntryEase(anim)(entryRaw);
  const exitEased = easeInOut(exitRaw);
  const layerOpacity = (text.opacity ?? 1) * eased * (1 - exitEased);
  if (layerOpacity <= 0.005) return;

  // ── Content ────────────────────────────────────────────────────────────────
  const textEffect    = text.textEffect;
  const fill          = text.fill ?? '#ffffff';
  const isGradient    = text.fillType === 'gradient' && text.gradientFrom && text.gradientTo;
  const letterSpacing = text.letterSpacing ?? 0;
  const textAlign     = text.textAlign ?? 'center';
  const scaledSize    = Math.round(text.fontSize * (H / 600));
  const fontWeight    = text.fontWeight ?? 700;
  const fontFamily    = resolveFont(text.font);
  const lineHeight    = text.lineHeight ?? 1;

  let displayContent = applyTextCase(text.content ?? '', text.textCase, text.font);

  // ── textEffect transforms content or rendering ─────────────────────────────
  if (textEffect === 'typewriter') {
    const visible = Math.min(displayContent.length, Math.floor(Math.max(0, relTime) / 0.048));
    displayContent = displayContent.slice(0, visible);
    if (!displayContent) return;
  } else if (textEffect === 'scramble') {
    const totalFrames = Math.max(20, displayContent.length * 2);
    const scrambleDur = totalFrames / 30;
    const scrambleT   = clamp01(relTime / scrambleDur);
    const tick        = Math.floor(t * 120);
    displayContent = displayContent.split('').map((ch, i) => {
      if (ch === ' ') return ' ';
      if (scrambleT > i / displayContent.length) return ch;
      return SCRAMBLE_CHARS[Math.abs(tick * 17 + i * 31) % SCRAMBLE_CHARS.length];
    }).join('');
  } else if (textEffect === 'count-up') {
    const raw  = displayContent;
    const num  = parseFloat(raw.replace(/[^0-9.]/g, ''));
    const pre  = raw.match(/^[^0-9]*/)?.[0]  ?? '';
    const suf  = raw.match(/[^0-9]*$/)?.[0]  ?? '';
    const dur  = 1.1;
    const p    = clamp01(relTime / dur);
    const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic
    if (!isNaN(num)) displayContent = `${pre}${Math.round(ease * num)}${suf}`;
  }

  // ── Motion transform ───────────────────────────────────────────────────────
  let motionTy = 0, motionTx = 0, motionScale = 1;
  switch (anim) {
    case 'drift-up':     motionTy = (1 - eased) * 28; break;
    case 'fade-up':      motionTy = (1 - eased) * 20; break;
    case 'rise':         motionTy = -(1 - eased) * 24; break;
    case 'rise-down':    motionTy = -(1 - eased) * 40; motionScale = 1 - (1 - eased) * 0.1; break;
    case 'slam':         motionScale = 0.5 + eased * 0.5; break;
    case 'counter-slam': motionScale = 0.65 + eased * 0.35; motionTy = (1 - eased) * 16; break;
    case 'pill-pop':     motionScale = 0.85 + eased * 0.15; motionTy = (1 - eased) * 18; break;
    case 'zoom-spin':    motionScale = 0.5 + eased * 0.5; break;
    case 'bounce-in':    motionTy = (1 - eased) * 60; motionScale = 0.6 + eased * 0.4; break;
    case 'stamp':        motionScale = 2.4 - eased * 1.4; break;
    case 'slide-left':   motionTx = -(1 - eased) * 80; break;
    case 'slide-right':  motionTx =  (1 - eased) * 80; break;
    case 'skew-in':      motionTx = -(1 - eased) * 50; break;
    default:             motionTy = (1 - eased) * 20; break;
  }

  // ── Canvas coordinate ──────────────────────────────────────────────────────
  const cx = (text.x / 100) * W;
  const cy = (text.y / 100) * H;

  // ── [A] outer save: blend + clip + filter + transform ─────────────────────
  ctx.save();

  // Blend mode
  const blendMode = text.blendMode;
  if (blendMode && blendMode !== 'normal') ctx.globalCompositeOperation = blendMode;

  // Wipe clip must be in canvas-space (before translate)
  if (anim === 'wipe-right') {
    ctx.beginPath();
    ctx.rect(0, 0, W * eased, H);
    ctx.clip();
  }

  // Blur-in filter
  const filterParts = [];
  if (anim === 'blur-in') {
    const blurAmt = (1 - eased) * 18;
    if (blurAmt > 0.5) filterParts.push(`blur(${blurAmt.toFixed(1)}px)`);
  }
  // Text CSS filters (brightness / saturate / hue-rotate)
  if ((text.filterBrightness ?? 1) !== 1) filterParts.push(`brightness(${text.filterBrightness})`);
  if ((text.filterSaturate   ?? 1) !== 1) filterParts.push(`saturate(${text.filterSaturate})`);
  if ((text.filterHue        ?? 0) !== 0) filterParts.push(`hue-rotate(${text.filterHue}deg)`);
  if (filterParts.length > 0) ctx.filter = filterParts.join(' ');

  ctx.globalAlpha = layerOpacity;
  ctx.translate(cx + motionTx, cy + motionTy);
  ctx.scale(motionScale, motionScale);

  // Font (must be set before measureText)
  ctx.font = `${fontWeight} ${scaledSize}px "${fontFamily}"`;
  ctx.textBaseline = 'middle';
  ctx.textAlign    = textAlign;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${letterSpacing}px`;

  const textW = ctx.measureText(displayContent).width;
  const textH = scaledSize * lineHeight;

  // ── Background ─────────────────────────────────────────────────────────────
  const bgOn = text.bgColor && text.bgColor !== 'transparent';
  if (bgOn) {
    const padH = text.bgPaddingH ?? ({ pill: 24, bar: 20, box: 14 }[text.bgStyle ?? 'pill'] ?? 24);
    const padV = text.bgPaddingV ?? ({ pill: 8,  bar: 6,  box: 8  }[text.bgStyle ?? 'pill'] ?? 8);
    const rad  = text.bgRadius   ?? ({ pill: 999, bar: 0, box: 6  }[text.bgStyle ?? 'pill'] ?? 999);
    const bgOp = text.bgOpacity  ?? 1;

    const bx = textAlign === 'left' ? -padH : textAlign === 'right' ? -textW - padH : -textW / 2 - padH;
    const by = -textH / 2 - padV;
    const bw = textW + padH * 2;
    const bh = textH + padV * 2;

    ctx.save(); // [B] bg
    ctx.globalAlpha = layerOpacity * bgOp;
    clearShadow(ctx);
    if (text.bgGradientTo) {
      const grd = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      grd.addColorStop(0, hexToRgba(text.bgColor, bgOp));
      grd.addColorStop(1, hexToRgba(text.bgGradientTo, bgOp));
      ctx.fillStyle = grd;
    } else {
      ctx.fillStyle = hexToRgba(text.bgColor, bgOp);
    }
    roundRect(ctx, bx, by, bw, bh, Math.min(rad, bh / 2));
    ctx.fill();
    // Bg border
    if ((text.bgBorderWidth ?? 0) > 0) {
      ctx.save();
      clearShadow(ctx);
      ctx.globalAlpha   = layerOpacity;
      ctx.strokeStyle   = text.bgBorderColor ?? 'rgba(255,255,255,0.5)';
      ctx.lineWidth     = text.bgBorderWidth;
      roundRect(ctx, bx, by, bw, bh, Math.min(rad, bh / 2));
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore(); // [B]
  }

  // ── Double stroke pass ─────────────────────────────────────────────────────
  if (text.hasStroke2 && (text.strokeWidth2 ?? 0) > 0) {
    ctx.save(); // [C] stroke2
    ctx.globalAlpha = layerOpacity;
    clearShadow(ctx);
    ctx.strokeStyle = text.stroke2 ?? '#000000';
    ctx.lineWidth   = (text.strokeWidth2 ?? 8) * 2;
    ctx.lineJoin    = 'round';
    ctx.strokeText(displayContent, 0, 0);
    ctx.restore(); // [C]
  }

  // ── Main text pass ─────────────────────────────────────────────────────────
  ctx.save(); // [D] main text
  ctx.globalAlpha = layerOpacity;

  // Animated gradient: shift = interpolate angle over time
  let gradText = text;
  if (isGradient && text.gradientAnimated && text.gradientAnimType === 'shift') {
    const speed  = text.gradientAnimSpeed ?? 3;
    const phase  = (t / speed) % 1;                  // 0→1 per cycle
    const eased2 = Math.sin(phase * Math.PI * 2) * 0.5 + 0.5; // 0→1→0
    const baseA  = text.gradientAngle ?? 135;
    const animAngle = (baseA + eased2 * 180) % 360;
    gradText = { ...text, gradientAngle: animAngle };
  }
  const fillStyle = isGradient ? buildGradientFill(ctx, gradText, textW, textH) : fill;
  ctx.fillStyle   = fillStyle;

  applyShadow(ctx, text, fill);

  const hasStroke = text.hasStroke && (text.strokeWidth ?? 0) > 0;
  if (hasStroke) {
    ctx.strokeStyle = text.stroke ?? '#000000';
    ctx.lineWidth   = text.strokeWidth * 2;
    ctx.lineJoin    = 'round';
  }

  // ── Shared char-loop setup ────────────────────────────────────────────────
  const chars       = displayContent.split('');
  const hasNativeLs = 'letterSpacing' in ctx;

  function charLoopStart() {
    ctx.save();
    ctx.textAlign = 'left';
    if (hasNativeLs) ctx.letterSpacing = `${letterSpacing}px`;
    clearShadow(ctx);
    const totalW = hasNativeLs ? textW : charsWidth(ctx, chars, letterSpacing);
    return textAlign === 'center' ? -totalW / 2 : textAlign === 'right' ? -totalW : 0;
  }
  function charLoopEnd() { ctx.restore(); }
  function charAdvance(ch) { return ctx.measureText(ch).width + (hasNativeLs ? 0 : letterSpacing); }

  // ── Wave: per-char with y bounce + fade ───────────────────────────────────
  if (textEffect === 'wave') {
    let charX = charLoopStart();
    for (let i = 0; i < chars.length; i++) {
      const ch       = chars[i];
      const delay    = i * 0.06;
      const localT   = Math.max(0, relTime - delay);
      const progress = Math.min(1, localT / 0.55);
      const charY    = -12 * Math.sin(progress * Math.PI);
      ctx.save();
      ctx.globalAlpha = layerOpacity * Math.min(1, progress * 2);
      if (hasStroke) ctx.strokeText(ch, charX, charY);
      ctx.fillText(ch, charX, charY);
      ctx.restore();
      charX += charAdvance(ch);
    }
    charLoopEnd();
  }

  // ── Flicker: neon lamp per-char ───────────────────────────────────────────
  else if (textEffect === 'flicker') {
    let charX = charLoopStart();
    for (let i = 0; i < chars.length; i++) {
      const ch       = chars[i];
      const localT   = Math.max(0, relTime - i * 0.055);
      const progress = Math.min(1, localT / 0.42);
      const alpha    = sampleKeyframes(FLICKER_TIMES, FLICKER_VALUES, progress);
      ctx.save();
      ctx.globalAlpha = layerOpacity * alpha;
      if (hasStroke) ctx.strokeText(ch, charX, 0);
      ctx.fillText(ch, charX, 0);
      ctx.restore();
      charX += charAdvance(ch);
    }
    charLoopEnd();
  }

  // ── Char-bounce: spring drop per char ─────────────────────────────────────
  else if (textEffect === 'char-bounce') {
    let charX = charLoopStart();
    for (let i = 0; i < chars.length; i++) {
      const ch       = chars[i];
      const localT   = Math.max(0, relTime - i * 0.045);
      const progress = Math.min(1, localT / 0.5);
      const charY    = 36 * (1 - easeOutBack(progress));
      const alpha    = Math.min(1, progress * 3);
      ctx.save();
      ctx.globalAlpha = layerOpacity * alpha;
      if (hasStroke) ctx.strokeText(ch, charX, charY);
      ctx.fillText(ch, charX, charY);
      ctx.restore();
      charX += charAdvance(ch);
    }
    charLoopEnd();
  }

  // ── Fade-chars: gentle per-char fade + drift ──────────────────────────────
  else if (textEffect === 'fade-chars') {
    let charX = charLoopStart();
    for (let i = 0; i < chars.length; i++) {
      const ch       = chars[i];
      const localT   = Math.max(0, relTime - i * 0.038);
      const progress = Math.min(1, localT / 0.28);
      const charY    = 8 * (1 - easeOutExpo(progress));
      const alpha    = easeOutExpo(progress);
      ctx.save();
      ctx.globalAlpha = layerOpacity * alpha;
      if (hasStroke) ctx.strokeText(ch, charX, charY);
      ctx.fillText(ch, charX, charY);
      ctx.restore();
      charX += charAdvance(ch);
    }
    charLoopEnd();
  }

  // ── Rise Chars: each letter rises from below ─────────────────────────────
  else if (textEffect === 'rise-chars') {
    let charX = charLoopStart();
    for (let i = 0; i < chars.length; i++) {
      const localT   = Math.max(0, relTime - i * 0.035);
      const progress = Math.min(1, localT / 0.38);
      const charY    = 40 * (1 - easeOutExpo(progress));
      const alpha    = easeOutExpo(progress);
      ctx.save();
      ctx.globalAlpha = layerOpacity * alpha;
      if (hasStroke) ctx.strokeText(chars[i], charX, charY);
      ctx.fillText(chars[i], charX, charY);
      ctx.restore();
      charX += charAdvance(chars[i]);
    }
    charLoopEnd();
  }

  // ── Drop Chars: letters rain from above ───────────────────────────────────
  else if (textEffect === 'drop-chars') {
    let charX = charLoopStart();
    for (let i = 0; i < chars.length; i++) {
      const localT   = Math.max(0, relTime - i * 0.04);
      const progress = Math.min(1, localT / 0.5);
      const charY    = -42 * (1 - easeOutBack(progress));
      const alpha    = Math.min(1, progress * 3);
      ctx.save();
      ctx.globalAlpha = layerOpacity * alpha;
      if (hasStroke) ctx.strokeText(chars[i], charX, charY);
      ctx.fillText(chars[i], charX, charY);
      ctx.restore();
      charX += charAdvance(chars[i]);
    }
    charLoopEnd();
  }

  // ── Blur Chars: each letter sharpens in ──────────────────────────────────
  else if (textEffect === 'blur-chars') {
    let charX = charLoopStart();
    for (let i = 0; i < chars.length; i++) {
      const localT   = Math.max(0, relTime - i * 0.04);
      const progress = Math.min(1, localT / 0.36);
      const blurAmt  = 9 * (1 - easeOutExpo(progress));
      const alpha    = easeOutExpo(progress);
      ctx.save();
      ctx.globalAlpha = layerOpacity * alpha;
      if (blurAmt > 0.3) ctx.filter = `blur(${blurAmt.toFixed(1)}px)`;
      if (hasStroke) ctx.strokeText(chars[i], charX, 0);
      ctx.fillText(chars[i], charX, 0);
      ctx.filter = 'none';
      ctx.restore();
      charX += charAdvance(chars[i]);
    }
    charLoopEnd();
  }

  // ── Pop Chars: scale 0→1.35→1 per char ───────────────────────────────────
  else if (textEffect === 'pop-chars') {
    let charX = charLoopStart();
    for (let i = 0; i < chars.length; i++) {
      const ch       = chars[i];
      const charW    = ctx.measureText(ch).width;
      const localT   = Math.max(0, relTime - i * 0.04);
      const progress = Math.min(1, localT / 0.42);
      const sc       = sampleKeyframes([0, 0.55, 1], [0, 1.35, 1], progress);
      const alpha    = Math.min(1, progress * 3);
      ctx.save();
      ctx.globalAlpha = layerOpacity * alpha;
      ctx.translate(charX + charW / 2, 0);
      ctx.scale(sc, sc);
      ctx.translate(-(charX + charW / 2), 0);
      if (hasStroke) ctx.strokeText(ch, charX, 0);
      ctx.fillText(ch, charX, 0);
      ctx.restore();
      charX += charAdvance(ch);
    }
    charLoopEnd();
  }

  // ── Stamp Chars: scale 2.6→1 per char ────────────────────────────────────
  else if (textEffect === 'stamp-chars') {
    let charX = charLoopStart();
    for (let i = 0; i < chars.length; i++) {
      const ch       = chars[i];
      const charW    = ctx.measureText(ch).width;
      const localT   = Math.max(0, relTime - i * 0.04);
      const progress = Math.min(1, localT / 0.32);
      const sc       = 1 + 1.6 * (1 - easeOutBack(progress));
      const alpha    = Math.min(1, progress * 4);
      ctx.save();
      ctx.globalAlpha = layerOpacity * alpha;
      ctx.translate(charX + charW / 2, 0);
      ctx.scale(sc, sc);
      ctx.translate(-(charX + charW / 2), 0);
      if (hasStroke) ctx.strokeText(ch, charX, 0);
      ctx.fillText(ch, charX, 0);
      ctx.restore();
      charX += charAdvance(ch);
    }
    charLoopEnd();
  }

  // ── Slide Chars: letters slide from right ─────────────────────────────────
  else if (textEffect === 'slide-chars') {
    let charX = charLoopStart();
    for (let i = 0; i < chars.length; i++) {
      const localT   = Math.max(0, relTime - i * 0.032);
      const progress = Math.min(1, localT / 0.34);
      const charTx   = 32 * (1 - easeOutExpo(progress));
      const alpha    = easeOutExpo(progress);
      ctx.save();
      ctx.globalAlpha = layerOpacity * alpha;
      if (hasStroke) ctx.strokeText(chars[i], charX + charTx, 0);
      ctx.fillText(chars[i], charX + charTx, 0);
      ctx.restore();
      charX += charAdvance(chars[i]);
    }
    charLoopEnd();
  }

  // ── Swing: pendulum rotation per char ────────────────────────────────────
  else if (textEffect === 'swing') {
    let charX = charLoopStart();
    for (let i = 0; i < chars.length; i++) {
      const ch       = chars[i];
      const charW    = ctx.measureText(ch).width;
      const localT   = Math.max(0, relTime - i * 0.05);
      const progress = Math.min(1, localT / 0.55);
      const angle    = -28 * (Math.PI / 180) * (1 - easeOutBack(progress));
      const alpha    = Math.min(1, progress * 3);
      ctx.save();
      ctx.globalAlpha = layerOpacity * alpha;
      ctx.translate(charX + charW / 2, -scaledSize / 2); // pivot at top center
      ctx.rotate(angle);
      ctx.translate(-(charX + charW / 2), scaledSize / 2);
      if (hasStroke) ctx.strokeText(ch, charX, 0);
      ctx.fillText(ch, charX, 0);
      ctx.restore();
      charX += charAdvance(ch);
    }
    charLoopEnd();
  }

  // ── Glitch: base + clipped distorted copies ───────────────────────────────
  else if (textEffect === 'glitch') {
    if (hasStroke) ctx.strokeText(displayContent, 0, 0);
    ctx.fillText(displayContent, 0, 0);

    // Distorted slice overlay during first 0.65 s
    if (relTime > 0.01 && relTime < 0.65) {
      clearShadow(ctx);
      const halfW   = textW / 2 + 20;
      const slices  = [
        { top: -textH * 0.50, h: textH * 0.12, dx: -4, alpha: 0.9 },
        { top: -textH * 0.08, h: textH * 0.22, dx:  4, alpha: 0.85 },
        { top:  textH * 0.30, h: textH * 0.12, dx: -3, alpha: 0.75 },
      ];
      for (const sl of slices) {
        ctx.save(); // [G] slice
        ctx.beginPath();
        ctx.rect(-halfW, sl.top, halfW * 2, sl.h);
        ctx.clip();
        ctx.translate(sl.dx, 0);
        ctx.globalAlpha = layerOpacity * sl.alpha;
        ctx.fillText(displayContent, 0, 0);
        ctx.restore(); // [G]
      }
    }
  }

  // ── Normal / typewriter / scramble ────────────────────────────────────────
  else {
    if (hasStroke) ctx.strokeText(displayContent, 0, 0);
    ctx.fillText(displayContent, 0, 0);
  }

  ctx.restore(); // [D]

  // ── Glow extra pass ───────────────────────────────────────────────────────
  if (text.glow) {
    ctx.save(); // [H] glow
    ctx.font        = `${fontWeight} ${scaledSize}px "${fontFamily}"`;
    ctx.textAlign   = textAlign;
    ctx.textBaseline = 'middle';
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${letterSpacing}px`;
    ctx.fillStyle   = fillStyle;

    const gc = text.glowColor || fill;
    const gr = text.glowRadius    ?? 20;
    const gi = text.glowIntensity ?? 0.7;

    ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    ctx.shadowBlur    = gr;
    ctx.shadowColor   = hexToRgba(gc, gi * 0.65);
    ctx.globalAlpha   = layerOpacity * 0.65;
    ctx.fillText(displayContent, 0, 0);

    ctx.shadowBlur  = gr * 1.8;
    ctx.shadowColor = hexToRgba(gc, gi * 0.3);
    ctx.globalAlpha = layerOpacity * 0.35;
    ctx.fillText(displayContent, 0, 0);
    ctx.restore(); // [H]
  }

  // ── Highlight pass (top-edge shine) ──────────────────────────────────────
  if (text.highlight) {
    ctx.save(); // [I] highlight
    ctx.font        = `${fontWeight} ${scaledSize}px "${fontFamily}"`;
    ctx.textAlign   = textAlign;
    ctx.textBaseline = 'middle';
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${letterSpacing}px`;
    ctx.fillStyle   = fillStyle;
    const op        = text.highlightOpacity ?? 0.5;
    ctx.shadowOffsetX = 0; ctx.shadowOffsetY = -1;
    ctx.shadowBlur    = 0;
    ctx.shadowColor   = `rgba(255,255,255,${op})`;
    ctx.globalAlpha   = layerOpacity * op;
    ctx.fillText(displayContent, 0, 0);
    ctx.restore(); // [I]
  }

  ctx.restore(); // [A]
}

// ── Export resolutions ────────────────────────────────────────────────────────
const RESOLUTIONS = [
  { id: '9x16', label: '9:16',  w: 1080, h: 1920, hint: 'Reels / TikTok / Shorts' },
  { id: '1x1',  label: '1:1',   w: 1080, h: 1080, hint: 'Feed post / Square'      },
  { id: '16x9', label: '16:9',  w: 1920, h: 1080, hint: 'YouTube / Premiere'      },
];

// ── Core render pipeline ──────────────────────────────────────────────────────
async function renderOverlay(hookConfig, res, fps, onProgress, signal) {
  const { w: W, h: H } = res;
  const duration    = hookConfig.timing.duration;
  const totalFrames = Math.ceil(duration * fps);

  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { alpha: true });

  const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
    ? 'video/webm; codecs=vp9'
    : 'video/webm';

  const stream   = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 14_000_000 });
  const chunks   = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  const finished = new Promise((resolve, reject) => {
    recorder.onstop  = () => resolve(new Blob(chunks, { type: 'video/webm' }));
    recorder.onerror = (e) => reject(new Error(e.error?.message ?? 'Recorder error'));
  });

  recorder.start();

  for (let frame = 0; frame <= totalFrames; frame++) {
    if (signal?.aborted) { recorder.stop(); throw new Error('Cancelled'); }

    const t = frame / fps;
    ctx.clearRect(0, 0, W, H);

    for (const text of hookConfig.texts) {
      if (!text.hidden) renderLayer(ctx, text, t, hookConfig, W, H);
    }

    onProgress(Math.round((frame / totalFrames) * 100));
    // Yield so MediaRecorder can sample the canvas
    await new Promise((r) => setTimeout(r, 1000 / fps));
  }

  recorder.stop();
  return finished;
}

// ── Modal UI ──────────────────────────────────────────────────────────────────
export default function ExportModal({ onClose }) {
  const { hookConfig }  = useHookStore();
  const [phase, setPhase]           = useState('idle');
  const [progress, setProgress]     = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError]           = useState(null);
  const [resId, setResId]           = useState('9x16');
  const [fps, setFps]               = useState(30);
  const abortRef = useRef(null);

  const resolution = RESOLUTIONS.find(r => r.id === resId) ?? RESOLUTIONS[0];
  const visibleLayers = hookConfig.texts.filter(t => !t.hidden);
  const hasLayers = visibleLayers.length > 0;

  const startExport = async () => {
    setPhase('exporting');
    setProgress(0);
    setError(null);
    setDownloadUrl(null);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const blob = await renderOverlay(hookConfig, resolution, fps, setProgress, ctrl.signal);
      setDownloadUrl(URL.createObjectURL(blob));
      setPhase('done');
    } catch (err) {
      if (err.message === 'Cancelled') { setPhase('idle'); return; }
      setError(err.message ?? 'Unknown export error');
      setPhase('error');
    }
  };

  const cancel = () => abortRef.current?.abort();
  const estTime = hookConfig.timing.duration.toFixed(1);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-card">
        <button className="modal-close" onClick={onClose}><X size={16} /></button>

        {/* ── IDLE ─────────────────────────────────────────────────── */}
        {phase === 'idle' && (
          <>
            <h2 className="modal-title">Export overlay</h2>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Name',     value: hookConfig.name },
                { label: 'Duration', value: `${estTime}s`  },
                { label: 'Layers',   value: visibleLayers.length },
              ].map(({ label, value }) => (
                <div key={label} style={{ flex: 1, padding: '8px 10px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Effects summary */}
            {hasLayers && (() => {
              const effects = [...new Set(visibleLayers.flatMap(l => [l.textEffect, l.animation].filter(Boolean)))];
              return effects.length > 0 ? (
                <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {effects.map(e => (
                    <span key={e} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--accent-primary)' }}>{e}</span>
                  ))}
                </div>
              ) : null;
            })()}

            {/* Resolution */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Resolution</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {RESOLUTIONS.map(r => (
                  <button key={r.id} onClick={() => setResId(r.id)} style={{
                    padding: '9px 4px', fontSize: 10, fontWeight: 700, borderRadius: 8,
                    cursor: 'pointer', border: '1px solid', textAlign: 'center', lineHeight: 1.4,
                    background:  resId === r.id ? 'var(--accent-primary)' : 'var(--bg-overlay)',
                    color:       resId === r.id ? '#fff' : 'var(--text-secondary)',
                    borderColor: resId === r.id ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  }}>
                    <div style={{ fontSize: 12 }}>{r.label}</div>
                    <div style={{ fontSize: 9, fontWeight: 500, opacity: 0.75, marginTop: 2 }}>{r.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* FPS */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Frame rate</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[24, 30, 60].map(f => (
                  <button key={f} onClick={() => setFps(f)} style={{
                    flex: 1, padding: '6px 4px', fontSize: 11, fontWeight: 700, borderRadius: 7,
                    cursor: 'pointer',
                    background:  fps === f ? 'var(--accent-primary)' : 'var(--bg-overlay)',
                    color:       fps === f ? '#fff' : 'var(--text-secondary)',
                    border: `1px solid ${fps === f ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  }}>{f} fps</button>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div style={{ marginBottom: 18, padding: '12px 14px', background: 'rgba(99,102,241,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>How it works</p>
              {[
                ['1', 'Render',  'Every frame is drawn to canvas — animations, glows, and effects included.'],
                ['2', 'Import',  'Drag the WebM above your footage in CapCut, Premiere, or DaVinci Resolve.'],
                ['3', 'Done',    'Text plays over your video with full alpha transparency.'],
              ].map(([n, title, desc]) => (
                <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{n}</span>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{title} </span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-primary" onClick={startExport} disabled={!hasLayers} style={{ opacity: hasLayers ? 1 : 0.5 }}>
              <Video size={15} />
              Render {resolution.w}×{resolution.h} · {fps}fps · ~{estTime}s
            </button>
            {!hasLayers && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>Add visible text layers first.</p>
            )}
          </>
        )}

        {/* ── EXPORTING ────────────────────────────────────────────── */}
        {phase === 'exporting' && (
          <>
            <h2 className="modal-title">Rendering…</h2>
            <p className="modal-desc" style={{ marginBottom: 6 }}>
              {resolution.w}×{resolution.h} · {fps}fps · {visibleLayers.length} layer{visibleLayers.length !== 1 ? 's' : ''}
            </p>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{progress}%</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                ~{(hookConfig.timing.duration * (1 - progress / 100)).toFixed(1)}s left
              </span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${progress}%`, transition: 'width 0.3s linear' }} />
            </div>
            <button className="btn-secondary" style={{ marginTop: 16 }} onClick={cancel}>Cancel</button>
          </>
        )}

        {/* ── DONE ──────────────────────────────────────────────────── */}
        {phase === 'done' && (
          <>
            <div className="success-icon"><CheckCircle2 size={22} /></div>
            <h2 className="modal-title" style={{ textAlign: 'center', marginBottom: 6 }}>Export complete</h2>
            <p className="modal-desc" style={{ textAlign: 'center', marginBottom: 20 }}>
              Transparent WebM ready. Drop it above your video track in CapCut, Premiere, or DaVinci Resolve.
            </p>
            <a
              href={downloadUrl}
              download={`hookforge_${resId}_${fps}fps.webm`}
              className="btn-primary"
              style={{ marginBottom: 10, textDecoration: 'none' }}
            >
              <Download size={15} />
              Download WebM
            </a>
            <button className="btn-secondary" onClick={() => { setPhase('idle'); setDownloadUrl(null); }}>
              Export again
            </button>
          </>
        )}

        {/* ── ERROR ──────────────────────────────────────────────────── */}
        {phase === 'error' && (
          <>
            <h2 className="modal-title">Export failed</h2>
            <p className="modal-desc" style={{ color: '#f87171', marginBottom: 16 }}>{error}</p>
            <button className="btn-primary" onClick={() => setPhase('idle')}>Try again</button>
          </>
        )}
      </div>
    </div>
  );
}
