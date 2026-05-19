import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isSupabaseEnabled, supabase } from '../lib/supabase';
import { createProject, updateProject as dbUpdateProject, loadProject } from '../lib/db';
import { uploadVideo, getVideoSignedUrl } from '../lib/storage';

const HookContext = createContext(null);
const CUSTOM_PRESETS_STORAGE_KEY = 'hookforge.custom-presets.v1';

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const createTextLayer = ({
  id,
  content,
  role,
  type = 'normal',
  font = 'Inter',
  shape = 'line',
  fill = '#ffffff',
  hasStroke = true,
  stroke = '#000000',
  strokeWidth = 2,
  x = 50,
  y = 50,
  fontSize = 32,
  bgColor = 'transparent',
  bgStyle = 'pill',    // 'pill' | 'bar' | 'box'
  maxChars = 24,
  animation = null,
  textEffect = null,   // char-level renderer: null | 'scramble' | 'typewriter' | 'wave' | 'glitch'
  curve = null,        // per-layer easing curve override; null = use global
  entryTime = null,   // seconds offset from hook start; null = use motionProfile stagger
  duration = null,    // seconds duration; null = until hook ends
  letterSpacing = 0,
  lineHeight = 1,
  fontWeight = null,
  radius = 160,
  arcSpread = 110,
  textCase = null,     // null = legacy (uppercase for sans, none for serif) | 'upper' | 'lower' | 'none' | 'title'
  opacity = 1,         // 0.05–1
  shadow = null,       // null = default | 'none' | 'soft' | 'glow' | 'hard'
  warpAmount = 50,     // 0–100 intensity for non-arc warp shapes
  // Warp / 3-D
  skewX = 0,
  skewY = 0,
  rotateX = 0,
  rotateY = 0,
  textRotate = 0,
  // Gradient fill
  fillType = 'solid',     // 'solid' | 'gradient'
  gradientFrom = null,
  gradientTo = null,
  gradientAngle = 135,
  // Layer FX
  backdropBlur = 0,
  blendMode = 'normal',
  hidden = false,
  textAlign = null,          // null = inherit global layout.alignment | 'left' | 'center' | 'right'
}) => ({
  id,
  content,
  role,
  type,
  font,
  shape,
  fill,
  hasStroke,
  stroke,
  strokeWidth,
  x,
  y,
  fontSize,
  bgColor,
  bgStyle,
  maxChars,
  animation,
  textEffect,
  curve,
  entryTime,
  duration,
  letterSpacing,
  lineHeight,
  fontWeight,
  radius,
  arcSpread,
  textCase,
  opacity,
  shadow,
  warpAmount,
  skewX,
  skewY,
  rotateX,
  rotateY,
  textRotate,
  fillType,
  gradientFrom,
  gradientTo,
  gradientAngle,
  backdropBlur,
  blendMode,
  hidden,
  textAlign,
});

const STARTER_PRESETS = [
  {
    id: 'PRICE_SHOCK',
    name: 'Price Shock',
    description: 'Big offer reveal with urgency and a strong CTA.',
    category: 'Offer',
    accent: '#f59e0b',
    tags: ['offer', 'sale', 'urgency', 'cta'],
    isBuiltIn: true,
    structure: {
      pattern: 'label -> offer -> cta',
      strategy: 'Lead with context, hit the discount hard, then drive action.',
      slots: [
        { id: 'context', label: 'Context', role: 'eyebrow', maxChars: 28 },
        { id: 'offer', label: 'Offer', role: 'headline', maxChars: 12 },
        { id: 'cta', label: 'CTA', role: 'cta', maxChars: 28 },
      ],
    },
    layout: { safeZone: 'center-stack', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3, phases: { entry: 20, emphasis: 50, hold: 20, exit: 10 } },
    curves: { entry: 'Pop', emphasis: 'Elastic', exit: 'Ease In' },
    motionProfile: {
      style: 'slam-offer',
      stagger: 0.14,
      slotOrder: ['context', 'offer', 'cta'],
      layerAnimations: { eyebrow: 'rise', headline: 'slam', cta: 'pill-pop' },
    },
    intensity: { scale: 'medium', distance: 'medium', shake: 'off' },
    design: { primaryColor: '#ffffff', punchColor: '#f59e0b', bgColor: 'rgba(0, 0, 0, 0.8)' },
    texts: [
      createTextLayer({ id: 'context', content: 'LIMITED TIME OFFER', role: 'eyebrow', fontSize: 22, x: 50, y: 25 }),
      createTextLayer({ id: 'offer', content: '50% OFF', role: 'headline', type: 'punch', font: 'Outfit', fill: '#f59e0b', strokeWidth: 4, x: 50, y: 50, fontSize: 72, maxChars: 12 }),
      createTextLayer({ id: 'cta', content: 'CLICK THE LINK BELOW', role: 'cta', fill: '#000000', hasStroke: false, x: 50, y: 76, fontSize: 18, bgColor: '#f59e0b' }),
    ],
  },
  {
    id: 'SERIES_DAY',
    name: 'Series Day Counter',
    description: 'Recurring-series opener built for challenge, build in public, and daily progress content.',
    category: 'Series',
    accent: '#38bdf8',
    tags: ['series', 'daily', 'challenge', 'progress'],
    isBuiltIn: true,
    structure: {
      pattern: 'series label -> day counter -> payoff',
      strategy: 'Create repeatable identity first, then deliver the specific episode angle.',
      slots: [
        { id: 'label', label: 'Series Label', role: 'eyebrow', maxChars: 24 },
        { id: 'counter', label: 'Day Counter', role: 'headline', maxChars: 18 },
        { id: 'payoff', label: 'Payoff', role: 'support', maxChars: 32 },
      ],
    },
    layout: { safeZone: 'upper-middle', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3.6, phases: { entry: 22, emphasis: 46, hold: 22, exit: 10 } },
    curves: { entry: 'Ease Out Expo', emphasis: 'Pop', exit: 'Ease In' },
    motionProfile: {
      style: 'counter-pulse',
      stagger: 0.12,
      slotOrder: ['label', 'counter', 'payoff'],
      layerAnimations: { eyebrow: 'drift-up', headline: 'counter-slam', support: 'fade-up' },
    },
    intensity: { scale: 'medium', distance: 'medium', shake: 'light' },
    design: { primaryColor: '#ffffff', punchColor: '#38bdf8', bgColor: 'rgba(7, 15, 24, 0.82)' },
    texts: [
      createTextLayer({ id: 'label', content: 'BUILDING MY AGENCY', role: 'eyebrow', fontSize: 18, fill: '#bae6fd', hasStroke: false, y: 24 }),
      createTextLayer({ id: 'counter', content: 'DAY 5', role: 'headline', type: 'punch', font: 'Outfit', fill: '#ffffff', stroke: '#38bdf8', strokeWidth: 4, y: 45, fontSize: 78, maxChars: 18 }),
      createTextLayer({ id: 'payoff', content: 'AND I FINALLY GOT MY FIRST LEAD', role: 'support', fontSize: 24, bgColor: 'rgba(56, 189, 248, 0.18)', y: 67, maxChars: 36 }),
    ],
  },
  {
    id: 'CONTRAST',
    name: 'Pain To Solution',
    description: 'Problem-first hook that flips quickly into a clear fix.',
    category: 'Education',
    accent: '#ef4444',
    tags: ['problem', 'solution', 'contrast', 'educational'],
    isBuiltIn: true,
    structure: {
      pattern: 'pain -> solution -> retention',
      strategy: 'Name the frustration plainly, then pivot to a clean promise.',
      slots: [
        { id: 'pain', label: 'Pain', role: 'eyebrow', maxChars: 30 },
        { id: 'solution', label: 'Solution', role: 'headline', maxChars: 20 },
        { id: 'retention', label: 'Retention', role: 'support', maxChars: 28 },
      ],
    },
    layout: { safeZone: 'center-stack', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3, phases: { entry: 18, emphasis: 52, hold: 20, exit: 10 } },
    curves: { entry: 'Ease Out Smooth', emphasis: 'Pop', exit: 'Ease In' },
    motionProfile: {
      style: 'flip-reveal',
      stagger: 0.14,
      slotOrder: ['pain', 'solution', 'retention'],
      layerAnimations: { eyebrow: 'rise', headline: 'slam', support: 'fade-up' },
    },
    intensity: { scale: 'medium', distance: 'medium', shake: 'off' },
    design: { primaryColor: '#ffffff', punchColor: '#ef4444', bgColor: 'rgba(0, 0, 0, 0.75)' },
    texts: [
      createTextLayer({ id: 'pain', content: 'TIRED OF SLOW RESULTS?', role: 'eyebrow', fontSize: 20, y: 32 }),
      createTextLayer({ id: 'solution', content: 'TRY THIS HACK', role: 'headline', type: 'punch', font: 'Outfit', fill: '#ef4444', stroke: '#ffffff', strokeWidth: 2, y: 52, fontSize: 52, bgColor: 'rgba(0,0,0,0.75)' }),
      createTextLayer({ id: 'retention', content: 'WATCH TILL THE END', role: 'support', hasStroke: false, y: 72, fontSize: 16 }),
    ],
  },
  {
    id: 'CURIOSITY',
    name: 'Curiosity Gap',
    description: 'Mystery-led framing built to make the viewer wait for the reveal.',
    category: 'Curiosity',
    accent: '#a855f7',
    tags: ['curiosity', 'secret', 'reveal', 'retention'],
    isBuiltIn: true,
    structure: {
      pattern: 'setup -> mystery -> closer',
      strategy: 'Keep the setup narrow and let the middle line carry the intrigue.',
      slots: [
        { id: 'setup', label: 'Setup', role: 'eyebrow', maxChars: 26 },
        { id: 'mystery', label: 'Mystery', role: 'headline', maxChars: 16 },
        { id: 'closer', label: 'Closer', role: 'support', maxChars: 18 },
      ],
    },
    layout: { safeZone: 'center-stack', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3.2, phases: { entry: 20, emphasis: 48, hold: 22, exit: 10 } },
    curves: { entry: 'Soft Float', emphasis: 'Elastic', exit: 'Ease In' },
    motionProfile: {
      style: 'tease-reveal',
      stagger: 0.16,
      slotOrder: ['setup', 'mystery', 'closer'],
      layerAnimations: { eyebrow: 'fade-up', headline: 'zoom-spin', support: 'pill-pop' },
    },
    intensity: { scale: 'medium', distance: 'light', shake: 'off' },
    design: { primaryColor: '#ffffff', punchColor: '#a855f7', bgColor: 'rgba(17, 9, 26, 0.82)' },
    texts: [
      createTextLayer({ id: 'setup', content: 'NOBODY TALKS ABOUT', role: 'eyebrow', fill: '#d8b4fe', hasStroke: false, y: 32, fontSize: 20 }),
      createTextLayer({ id: 'mystery', content: 'THIS SECRET', role: 'headline', type: 'punch', font: 'Outfit', fill: '#ffffff', stroke: '#a855f7', strokeWidth: 3, y: 52, fontSize: 56 }),
      createTextLayer({ id: 'closer', content: 'ANYMORE', role: 'support', type: 'normal', font: 'Outfit', hasStroke: false, y: 70, fontSize: 30, bgColor: 'rgba(168,85,247,0.85)' }),
    ],
  },
  {
    id: 'TRANSFORMATION',
    name: 'Before vs After',
    description: 'Transformation hook with a clean visual split between old and new.',
    category: 'Transformation',
    accent: '#22c55e',
    tags: ['before-after', 'transformation', 'results', 'comparison'],
    isBuiltIn: true,
    structure: {
      pattern: 'before -> bridge -> after',
      strategy: 'Turn the contrast into an instant visual story.',
      slots: [
        { id: 'before', label: 'Before', role: 'headline', maxChars: 14 },
        { id: 'bridge', label: 'Bridge', role: 'eyebrow', maxChars: 8 },
        { id: 'after', label: 'After', role: 'headline', maxChars: 14 },
      ],
    },
    layout: { safeZone: 'center-stack', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3, phases: { entry: 18, emphasis: 52, hold: 20, exit: 10 } },
    curves: { entry: 'Pop', emphasis: 'Bounce Light', exit: 'Ease In' },
    motionProfile: {
      style: 'versus-stack',
      stagger: 0.1,
      slotOrder: ['before', 'bridge', 'after'],
      layerAnimations: { eyebrow: 'fade-up', headline: 'slam' },
    },
    intensity: { scale: 'medium', distance: 'medium', shake: 'off' },
    design: { primaryColor: '#ffffff', punchColor: '#22c55e', bgColor: 'rgba(0, 0, 0, 0.78)' },
    texts: [
      createTextLayer({ id: 'before', content: 'BEFORE', role: 'headline', type: 'punch', font: 'Outfit', fill: '#fca5a5', stroke: '#7f1d1d', y: 30, fontSize: 52 }),
      createTextLayer({ id: 'bridge', content: 'VS', role: 'eyebrow', hasStroke: false, y: 50, fontSize: 22 }),
      createTextLayer({ id: 'after', content: 'AFTER', role: 'headline', type: 'punch', font: 'Outfit', fill: '#86efac', stroke: '#14532d', y: 70, fontSize: 52 }),
    ],
  },
  {
    id: 'WARNING',
    name: 'Warning Banner',
    description: 'Fast-scrolling alert format for mistakes, myths, and high-stakes advice.',
    category: 'Authority',
    accent: '#fb7185',
    tags: ['warning', 'mistake', 'myth', 'authority'],
    isBuiltIn: true,
    structure: {
      pattern: 'alert -> danger -> consequence',
      strategy: 'Make the threat clear first, then land the consequence in plain language.',
      slots: [
        { id: 'alert', label: 'Alert', role: 'eyebrow', maxChars: 14 },
        { id: 'danger', label: 'Danger', role: 'headline', maxChars: 24 },
        { id: 'consequence', label: 'Consequence', role: 'support', maxChars: 30 },
      ],
    },
    layout: { safeZone: 'upper-middle', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 2.8, phases: { entry: 16, emphasis: 54, hold: 20, exit: 10 } },
    curves: { entry: 'Ease Out Expo', emphasis: 'Elastic', exit: 'Ease In' },
    motionProfile: {
      style: 'breaking-alert',
      stagger: 0.1,
      slotOrder: ['alert', 'danger', 'consequence'],
      layerAnimations: { eyebrow: 'pill-pop', headline: 'slam', support: 'fade-up' },
    },
    intensity: { scale: 'high', distance: 'medium', shake: 'light' },
    design: { primaryColor: '#ffffff', punchColor: '#fb7185', bgColor: 'rgba(24, 7, 12, 0.88)' },
    texts: [
      createTextLayer({ id: 'alert', content: 'WARNING', role: 'eyebrow', font: 'Outfit', fill: '#0b0b10', hasStroke: false, y: 24, fontSize: 18, bgColor: '#fb7185', animation: 'pill-pop' }),
      createTextLayer({ id: 'danger', content: 'STOP POSTING LIKE THIS', role: 'headline', type: 'punch', font: 'Outfit', fill: '#ffffff', stroke: '#fb7185', strokeWidth: 3, y: 45, fontSize: 54 }),
      createTextLayer({ id: 'consequence', content: 'IT IS KILLING YOUR RETENTION', role: 'support', fontSize: 22, y: 67 }),
    ],
  },
  {
    id: 'LISTICLE',
    name: '3 Things Hook',
    description: 'List-driven hook for educational creators, marketing clips, and storytelling frameworks.',
    category: 'Education',
    accent: '#facc15',
    tags: ['list', 'tips', 'educational', 'framework'],
    isBuiltIn: true,
    structure: {
      pattern: 'number -> promise -> qualifier',
      strategy: 'Lead with the number, make the promise specific, then narrow the audience.',
      slots: [
        { id: 'number', label: 'Number', role: 'headline', maxChars: 12 },
        { id: 'promise', label: 'Promise', role: 'support', maxChars: 28 },
        { id: 'qualifier', label: 'Qualifier', role: 'eyebrow', maxChars: 24 },
      ],
    },
    layout: { safeZone: 'center-stack', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3.1, phases: { entry: 20, emphasis: 48, hold: 22, exit: 10 } },
    curves: { entry: 'Pop', emphasis: 'No Overshoot', exit: 'Ease In' },
    motionProfile: {
      style: 'number-stack',
      stagger: 0.12,
      slotOrder: ['number', 'promise', 'qualifier'],
      layerAnimations: { headline: 'counter-slam', support: 'fade-up', eyebrow: 'drift-up' },
    },
    intensity: { scale: 'medium', distance: 'medium', shake: 'off' },
    design: { primaryColor: '#ffffff', punchColor: '#facc15', bgColor: 'rgba(19, 17, 4, 0.85)' },
    texts: [
      createTextLayer({ id: 'number', content: '3 THINGS', role: 'headline', type: 'punch', font: 'Outfit', fill: '#facc15', stroke: '#000000', strokeWidth: 3, y: 32, fontSize: 68 }),
      createTextLayer({ id: 'promise', content: 'THAT WILL MAKE YOUR REELS BETTER', role: 'support', bgColor: 'rgba(250, 204, 21, 0.14)', y: 55, fontSize: 24, maxChars: 34 }),
      createTextLayer({ id: 'qualifier', content: 'IF YOU WANT HIGHER RETENTION', role: 'eyebrow', hasStroke: false, y: 74, fontSize: 16 }),
    ],
  },
  {
    id: 'CONFESSION',
    name: 'Confession Hook',
    description: 'Personal-story opener for vulnerable or behind-the-scenes creator moments.',
    category: 'Story',
    accent: '#2dd4bf',
    tags: ['story', 'confession', 'personal', 'behind-the-scenes'],
    isBuiltIn: true,
    structure: {
      pattern: 'confession -> tension -> next beat',
      strategy: 'Use the first line like a diary headline, then create emotional tension.',
      slots: [
        { id: 'confession', label: 'Confession', role: 'eyebrow', maxChars: 24 },
        { id: 'tension', label: 'Tension', role: 'headline', maxChars: 24 },
        { id: 'nextBeat', label: 'Next Beat', role: 'support', maxChars: 30 },
      ],
    },
    layout: { safeZone: 'upper-middle', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3.4, phases: { entry: 24, emphasis: 42, hold: 24, exit: 10 } },
    curves: { entry: 'Soft Float', emphasis: 'Pop', exit: 'Ease In' },
    motionProfile: {
      style: 'story-journal',
      stagger: 0.16,
      slotOrder: ['confession', 'tension', 'nextBeat'],
      layerAnimations: { eyebrow: 'drift-up', headline: 'zoom-spin', support: 'fade-up' },
    },
    intensity: { scale: 'light', distance: 'light', shake: 'off' },
    design: { primaryColor: '#ffffff', punchColor: '#2dd4bf', bgColor: 'rgba(6, 22, 20, 0.84)' },
    texts: [
      createTextLayer({ id: 'confession', content: 'I ALMOST QUIT', role: 'eyebrow', fill: '#99f6e4', hasStroke: false, y: 28, fontSize: 18 }),
      createTextLayer({ id: 'tension', content: 'AFTER THIS CLIENT CALL', role: 'headline', type: 'punch', font: 'Outfit', fill: '#ffffff', stroke: '#2dd4bf', strokeWidth: 3, y: 49, fontSize: 56, maxChars: 28 }),
      createTextLayer({ id: 'nextBeat', content: 'HERE IS WHAT CHANGED MY MIND', role: 'support', y: 70, fontSize: 20, bgColor: 'rgba(45, 212, 191, 0.12)' }),
    ],
  },
  {
    id: 'ARC_REVEAL',
    name: 'Arc Reveal',
    description: 'Curved opener on top with a giant lower punchline, matching the underdog-style reference.',
    category: 'Reference',
    accent: '#dbeafe',
    tags: ['arc', 'curved', 'underdog', 'reference'],
    isBuiltIn: true,
    structure: {
      pattern: 'curved setup -> lower payoff',
      strategy: 'Use a curved question or frame up top, then land a giant payoff in the lower half.',
      slots: [
        { id: 'arc', label: 'Curved Setup', role: 'eyebrow', maxChars: 28 },
        { id: 'payoff', label: 'Payoff', role: 'headline', maxChars: 18 },
      ],
    },
    layout: { safeZone: 'center-stack', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3.2, phases: { entry: 20, emphasis: 48, hold: 22, exit: 10 } },
    curves: { entry: 'Ease Out Expo', emphasis: 'Elastic', exit: 'Ease In' },
    motionProfile: {
      style: 'arc-pop',
      stagger: 0.1,
      slotOrder: ['arc', 'payoff'],
      layerAnimations: { eyebrow: 'fade-up', headline: 'counter-slam' },
    },
    intensity: { scale: 'medium', distance: 'medium', shake: 'off' },
    design: { primaryColor: '#fff7c2', punchColor: '#fff0ad', bgColor: 'rgba(31, 20, 4, 0.18)' },
    texts: [
      createTextLayer({ id: 'arc', content: 'DO NOT UNDERESTIMATE', role: 'eyebrow', shape: 'arc', font: 'Outfit', fill: '#dbeafe', stroke: '#577391', strokeWidth: 1, y: 24, fontSize: 24, radius: 190, arcSpread: 118, hasStroke: false, letterSpacing: 2 }),
      createTextLayer({ id: 'payoff', content: 'THIS TINY BALL', role: 'headline', type: 'punch', font: 'Outfit', fill: '#fff0ad', stroke: '#6d5418', strokeWidth: 1, y: 76, x: 12, fontSize: 60, maxChars: 18, hasStroke: false, letterSpacing: -1 }),
    ],
  },
  {
    id: 'TASTE_STACK',
    name: 'Taste Stack',
    description: 'Huge taste verdict at the top with split product labels around the subject.',
    category: 'Reference',
    accent: '#fff0ad',
    tags: ['taste', 'split-label', 'top-title', 'reference'],
    isBuiltIn: true,
    structure: {
      pattern: 'giant verdict -> left label -> right label',
      strategy: 'Put the conclusion first, then identify the two ingredients in a clean split layout.',
      slots: [
        { id: 'verdict', label: 'Verdict', role: 'headline', maxChars: 18 },
        { id: 'left', label: 'Left Label', role: 'support', maxChars: 18 },
        { id: 'right', label: 'Right Label', role: 'support', maxChars: 18 },
      ],
    },
    layout: { safeZone: 'upper-middle', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 2.8, phases: { entry: 18, emphasis: 50, hold: 22, exit: 10 } },
    curves: { entry: 'Pop', emphasis: 'No Overshoot', exit: 'Ease In' },
    motionProfile: {
      style: 'split-product',
      stagger: 0.08,
      slotOrder: ['verdict', 'left', 'right'],
      layerAnimations: { headline: 'slam', support: 'fade-up' },
    },
    intensity: { scale: 'medium', distance: 'light', shake: 'off' },
    design: { primaryColor: '#fff7c2', punchColor: '#fff0ad', bgColor: 'rgba(31, 20, 4, 0.1)' },
    texts: [
      createTextLayer({ id: 'verdict', content: 'TASTE AMAZING', role: 'headline', type: 'punch', font: 'Outfit', fill: '#fff0ad', stroke: '#7f6a32', strokeWidth: 1, y: 16, x: 50, fontSize: 74, maxChars: 18, hasStroke: false, letterSpacing: -2 }),
      createTextLayer({ id: 'left', content: 'PEANUT BUTTER', role: 'support', font: 'Outfit', fill: '#ffffff', y: 65, x: 14, fontSize: 28, maxChars: 16, hasStroke: false, letterSpacing: -1 }),
      createTextLayer({ id: 'right', content: 'WHISKY', role: 'support', font: 'Outfit', fill: '#ffffff', y: 65, x: 88, fontSize: 28, maxChars: 16, hasStroke: false, letterSpacing: -1 }),
    ],
  },
  {
    id: 'SERIF_EDITORIAL',
    name: 'Serif Editorial',
    description: 'Elegant serif stack for short product-story hooks like the tiny bottle references.',
    category: 'Reference',
    accent: '#fff0ad',
    tags: ['serif', 'editorial', 'tiny bottle', 'reference'],
    isBuiltIn: true,
    structure: {
      pattern: 'serif object stack',
      strategy: 'Keep the copy short and let the high-contrast serif typography do the storytelling.',
      slots: [
        { id: 'object', label: 'Object', role: 'headline', maxChars: 18 },
      ],
    },
    layout: { safeZone: 'center-stack', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3, phases: { entry: 24, emphasis: 42, hold: 24, exit: 10 } },
    curves: { entry: 'Soft Float', emphasis: 'Pop', exit: 'Ease In' },
    motionProfile: {
      style: 'editorial-serf',
      stagger: 0.08,
      slotOrder: ['object'],
      layerAnimations: { headline: 'drift-up' },
    },
    intensity: { scale: 'light', distance: 'light', shake: 'off' },
    design: { primaryColor: '#fff0ad', punchColor: '#fff0ad', bgColor: 'rgba(31, 20, 4, 0.08)' },
    texts: [
      createTextLayer({ id: 'object', content: 'THIS TINY BOTTLE', role: 'headline', font: 'Cormorant Garamond', fill: '#fff0ad', y: 62, x: 46, fontSize: 58, maxChars: 20, hasStroke: false, letterSpacing: 0, lineHeight: 0.9, fontWeight: 600 }),
    ],
  },
  {
    id: 'RUM_STACK',
    name: 'Rum Stack',
    description: 'Aggressive lower-third stack with oversized bottom line like the Old Monk reference.',
    category: 'Reference',
    accent: '#f4d35e',
    tags: ['lower-third', 'stacked', 'rum', 'reference'],
    isBuiltIn: true,
    structure: {
      pattern: 'topic -> qualifier -> oversized punchline',
      strategy: 'Stack the thought in descending order and explode the final noun at the bottom.',
      slots: [
        { id: 'topic', label: 'Topic', role: 'support', maxChars: 18 },
        { id: 'qualifier', label: 'Qualifier', role: 'support', maxChars: 22 },
        { id: 'punch', label: 'Punchline', role: 'headline', maxChars: 12 },
      ],
    },
    layout: { safeZone: 'lower-third', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 2.8, phases: { entry: 18, emphasis: 52, hold: 20, exit: 10 } },
    curves: { entry: 'Pop', emphasis: 'Elastic', exit: 'Ease In' },
    motionProfile: {
      style: 'bottom-stack',
      stagger: 0.08,
      slotOrder: ['topic', 'qualifier', 'punch'],
      layerAnimations: { support: 'fade-up', headline: 'counter-slam' },
    },
    intensity: { scale: 'high', distance: 'light', shake: 'off' },
    design: { primaryColor: '#f4d35e', punchColor: '#f4d35e', bgColor: 'rgba(31, 20, 4, 0.08)' },
    texts: [
      createTextLayer({ id: 'topic', content: 'OLD MONK', role: 'support', font: 'Outfit', fill: '#f4d35e', y: 58, fontSize: 34, hasStroke: false, letterSpacing: -1 }),
      createTextLayer({ id: 'qualifier', content: "WASN'T JUST A", role: 'support', font: 'Outfit', fill: '#f4d35e', y: 66, fontSize: 24, hasStroke: false, letterSpacing: -1 }),
      createTextLayer({ id: 'punch', content: 'RUM', role: 'headline', type: 'punch', font: 'Outfit', fill: '#f4d35e', y: 80, fontSize: 84, maxChars: 10, hasStroke: false, letterSpacing: -3 }),
    ],
  },
  {
    id: 'INTERVIEW_SERIF',
    name: 'Interview Serif',
    description: 'Tall interview quote stack with elegant serif copy running through the middle of frame.',
    category: 'Reference',
    accent: '#ffffff',
    tags: ['interview', 'quote', 'serif', 'reference'],
    isBuiltIn: true,
    structure: {
      pattern: 'statement stack',
      strategy: 'Treat the line like a pull quote, stacked through the center with one hero verb.',
      slots: [
        { id: 'quote', label: 'Quote', role: 'headline', maxChars: 42 },
      ],
    },
    layout: { safeZone: 'center-stack', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3.4, phases: { entry: 22, emphasis: 44, hold: 24, exit: 10 } },
    curves: { entry: 'Soft Float', emphasis: 'No Overshoot', exit: 'Ease In' },
    motionProfile: {
      style: 'quote-stack',
      stagger: 0.06,
      slotOrder: ['quote'],
      layerAnimations: { headline: 'fade-up' },
    },
    intensity: { scale: 'light', distance: 'light', shake: 'off' },
    design: { primaryColor: '#ffffff', punchColor: '#ffffff', bgColor: 'rgba(10, 10, 10, 0.04)' },
    texts: [
      createTextLayer({ id: 'quote', content: 'AND YOU APPLY THAT TO THE BUSINESS', role: 'headline', font: 'Cormorant Garamond', fill: '#ffffff', y: 73, x: 48, fontSize: 54, maxChars: 38, hasStroke: false, letterSpacing: 0, lineHeight: 0.84, fontWeight: 600 }),
    ],
  },
  {
    id: 'FOOLED_WORLD',
    name: 'Fooled World',
    description: 'High-impact top and bottom stack designed for “fooled the whole world” style product claims.',
    category: 'Reference',
    accent: '#ffffff',
    tags: ['top-bottom', 'product', 'claim', 'reference'],
    isBuiltIn: true,
    structure: {
      pattern: 'top claim -> bottom payoff',
      strategy: 'Put the provocative claim at the top and the scale statement near the product foreground.',
      slots: [
        { id: 'claim', label: 'Top Claim', role: 'support', maxChars: 20 },
        { id: 'payoff', label: 'Bottom Payoff', role: 'headline', maxChars: 24 },
      ],
    },
    layout: { safeZone: 'center-stack', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3, phases: { entry: 18, emphasis: 50, hold: 22, exit: 10 } },
    curves: { entry: 'Pop', emphasis: 'Elastic', exit: 'Ease In' },
    motionProfile: {
      style: 'product-claim',
      stagger: 0.08,
      slotOrder: ['claim', 'payoff'],
      layerAnimations: { support: 'fade-up', headline: 'counter-slam' },
    },
    intensity: { scale: 'medium', distance: 'light', shake: 'off' },
    design: { primaryColor: '#ffffff', punchColor: '#f4d35e', bgColor: 'rgba(255,255,255,0.04)' },
    texts: [
      createTextLayer({ id: 'claim', content: 'GREY GOOSE FOOLED', role: 'support', font: 'Outfit', fill: '#ffffff', y: 14, fontSize: 40, hasStroke: false, letterSpacing: -1 }),
      createTextLayer({ id: 'payoff', content: 'THE ENTIRE WORLD', role: 'headline', type: 'punch', font: 'Outfit', fill: '#f4d35e', y: 76, fontSize: 58, maxChars: 22, hasStroke: false, letterSpacing: -2 }),
    ],
  },

  // ─── ALCOHOL / BEVERAGE NICHE ────────────────────────────────────────────────

  {
    id: 'BLIND_VERDICT',
    name: 'Blind Verdict',
    description: 'Blind tasting reveal — huge verdict on top, the bottle name explodes at the bottom.',
    category: 'Beverage',
    accent: '#f4d35e',
    tags: ['blind-taste', 'whiskey', 'verdict', 'beverage', 'reveal'],
    isBuiltIn: true,
    structure: {
      pattern: 'verdict -> blind label -> bottle reveal',
      strategy: 'State the result first, keep the product anonymous in the middle, then slam the name.',
      slots: [
        { id: 'verdict', label: 'Verdict', role: 'headline', maxChars: 14 },
        { id: 'setup', label: 'Setup', role: 'support', maxChars: 22 },
        { id: 'bottle', label: 'Bottle Name', role: 'eyebrow', maxChars: 16 },
      ],
    },
    layout: { safeZone: 'center-stack', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3, phases: { entry: 18, emphasis: 52, hold: 20, exit: 10 } },
    curves: { entry: 'Pop', emphasis: 'Elastic', exit: 'Ease In' },
    motionProfile: {
      style: 'bottom-stack',
      stagger: 0.1,
      slotOrder: ['verdict', 'setup', 'bottle'],
      layerAnimations: { headline: 'slam', support: 'fade-up', eyebrow: 'counter-slam' },
    },
    intensity: { scale: 'high', distance: 'medium', shake: 'off' },
    design: { primaryColor: '#f4d35e', punchColor: '#f4d35e', bgColor: 'rgba(20, 10, 0, 0.08)' },
    texts: [
      createTextLayer({ id: 'verdict', content: 'BEST NEAT', role: 'headline', type: 'punch', font: 'Outfit', fill: '#f4d35e', y: 15, fontSize: 72, maxChars: 14, hasStroke: false, letterSpacing: -2 }),
      createTextLayer({ id: 'setup', content: "I'VE EVER TASTED", role: 'support', font: 'Outfit', fill: '#ffffff', y: 56, fontSize: 28, hasStroke: false, letterSpacing: -1 }),
      createTextLayer({ id: 'bottle', content: 'LAGAVULIN 16', role: 'eyebrow', font: 'Outfit', fill: '#f4d35e', y: 80, fontSize: 42, hasStroke: false, letterSpacing: -1 }),
    ],
  },

  {
    id: 'WRONG_WAY',
    name: 'Drinking It Wrong',
    description: 'Myth-bust hook — “you\'ve been drinking X wrong” paired with the correct method below.',
    category: 'Beverage',
    accent: '#fb923c',
    tags: ['myth-bust', 'wrong', 'drinking', 'beverage', 'education'],
    isBuiltIn: true,
    structure: {
      pattern: 'accusation -> drink name -> correction',
      strategy: 'Open with the accusation, name the drink, then tease the right way.',
      slots: [
        { id: 'accusation', label: 'Accusation', role: 'eyebrow', maxChars: 26 },
        { id: 'drink', label: 'Drink Name', role: 'headline', maxChars: 14 },
        { id: 'fix', label: 'Fix / Tease', role: 'support', maxChars: 28 },
      ],
    },
    layout: { safeZone: 'center-stack', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3.2, phases: { entry: 18, emphasis: 52, hold: 20, exit: 10 } },
    curves: { entry: 'Ease Out Expo', emphasis: 'Elastic', exit: 'Ease In' },
    motionProfile: {
      style: 'flip-reveal',
      stagger: 0.12,
      slotOrder: ['accusation', 'drink', 'fix'],
      layerAnimations: { eyebrow: 'rise', headline: 'slam', support: 'fade-up' },
    },
    intensity: { scale: 'medium', distance: 'medium', shake: 'off' },
    design: { primaryColor: '#ffffff', punchColor: '#fb923c', bgColor: 'rgba(20, 8, 0, 0.08)' },
    texts: [
      createTextLayer({ id: 'accusation', content: "YOU'VE BEEN DRINKING", role: 'eyebrow', font: 'Outfit', fill: '#ffffff', y: 22, fontSize: 26, hasStroke: false, letterSpacing: -0.5 }),
      createTextLayer({ id: 'drink', content: 'BOURBON', role: 'headline', type: 'punch', font: 'Outfit', fill: '#fb923c', y: 46, fontSize: 80, maxChars: 14, hasStroke: false, letterSpacing: -3 }),
      createTextLayer({ id: 'fix', content: 'WRONG YOUR ENTIRE LIFE', role: 'support', font: 'Outfit', fill: '#ffffff', y: 72, fontSize: 24, hasStroke: false, letterSpacing: -0.5 }),
    ],
  },

  {
    id: 'PRICE_TAG',
    name: 'Price Tag',
    description: 'Price reveal hook — product name floats top, the cost slams in large at the bottom.',
    category: 'Beverage',
    accent: '#a3e635',
    tags: ['price', 'reveal', 'cost', 'beverage', 'spirit'],
    isBuiltIn: true,
    structure: {
      pattern: 'product name -> price reveal',
      strategy: 'Name the bottle first so the price lands with full context.',
      slots: [
        { id: 'product', label: 'Product', role: 'support', maxChars: 22 },
        { id: 'price', label: 'Price', role: 'headline', maxChars: 10 },
        { id: 'qualifier', label: 'Qualifier', role: 'eyebrow', maxChars: 24 },
      ],
    },
    layout: { safeZone: 'lower-third', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 2.8, phases: { entry: 18, emphasis: 52, hold: 20, exit: 10 } },
    curves: { entry: 'Pop', emphasis: 'Elastic', exit: 'Ease In' },
    motionProfile: {
      style: 'bottom-stack',
      stagger: 0.08,
      slotOrder: ['product', 'qualifier', 'price'],
      layerAnimations: { support: 'fade-up', eyebrow: 'drift-up', headline: 'counter-slam' },
    },
    intensity: { scale: 'high', distance: 'light', shake: 'off' },
    design: { primaryColor: '#ffffff', punchColor: '#a3e635', bgColor: 'rgba(4, 20, 4, 0.08)' },
    texts: [
      createTextLayer({ id: 'product', content: 'MACALLAN 18', role: 'support', font: 'Outfit', fill: '#ffffff', y: 58, fontSize: 30, hasStroke: false, letterSpacing: -1 }),
      createTextLayer({ id: 'qualifier', content: 'COSTS', role: 'eyebrow', font: 'Outfit', fill: '#ffffff', y: 66, fontSize: 20, hasStroke: false, letterSpacing: 1 }),
      createTextLayer({ id: 'price', content: '$320', role: 'headline', type: 'punch', font: 'Outfit', fill: '#a3e635', y: 82, fontSize: 88, maxChars: 10, hasStroke: false, letterSpacing: -3 }),
    ],
  },

  {
    id: 'ORIGIN_DROP',
    name: 'Origin Drop',
    description: 'Heritage story hook — birth year or origin fact drops as a punch, product name anchors below.',
    category: 'Beverage',
    accent: '#fcd34d',
    tags: ['origin', 'heritage', 'history', 'year', 'beverage'],
    isBuiltIn: true,
    structure: {
      pattern: 'year / origin fact -> brand name',
      strategy: 'Lead with the striking historical fact, let the brand name pay it off.',
      slots: [
        { id: 'fact', label: 'Fact / Year', role: 'headline', maxChars: 16 },
        { id: 'context', label: 'Context', role: 'support', maxChars: 22 },
        { id: 'brand', label: 'Brand Name', role: 'eyebrow', maxChars: 20 },
      ],
    },
    layout: { safeZone: 'upper-middle', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3.2, phases: { entry: 20, emphasis: 48, hold: 22, exit: 10 } },
    curves: { entry: 'Ease Out Expo', emphasis: 'No Overshoot', exit: 'Ease In' },
    motionProfile: {
      style: 'editorial-serf',
      stagger: 0.12,
      slotOrder: ['fact', 'context', 'brand'],
      layerAnimations: { headline: 'drift-up', support: 'fade-up', eyebrow: 'rise' },
    },
    intensity: { scale: 'light', distance: 'light', shake: 'off' },
    design: { primaryColor: '#fcd34d', punchColor: '#fcd34d', bgColor: 'rgba(20, 12, 0, 0.08)' },
    texts: [
      createTextLayer({ id: 'fact', content: 'SINCE 1820', role: 'headline', font: 'Cormorant Garamond', fill: '#fcd34d', y: 22, fontSize: 68, maxChars: 16, hasStroke: false, letterSpacing: 2, fontWeight: 600 }),
      createTextLayer({ id: 'context', content: 'THIS DISTILLERY HAS NEVER', role: 'support', font: 'Outfit', fill: '#ffffff', y: 50, fontSize: 22, hasStroke: false, letterSpacing: -0.5 }),
      createTextLayer({ id: 'brand', content: 'CHANGED THE RECIPE', role: 'eyebrow', font: 'Outfit', fill: '#fcd34d', y: 62, fontSize: 22, hasStroke: false, letterSpacing: -0.5 }),
    ],
  },

  {
    id: 'SPIRIT_VS',
    name: 'Spirit Versus',
    description: 'Clean two-bottle comparison hook — name them top and bottom, let the viewer pick a side.',
    category: 'Beverage',
    accent: '#f4d35e',
    tags: ['versus', 'comparison', 'spirits', 'battle', 'beverage'],
    isBuiltIn: true,
    structure: {
      pattern: 'bottle A -> vs -> bottle B',
      strategy: 'Keep both names equal weight, let the VS split carry the tension.',
      slots: [
        { id: 'bottleA', label: 'Bottle A', role: 'headline', maxChars: 14 },
        { id: 'vs', label: 'VS Label', role: 'eyebrow', maxChars: 4 },
        { id: 'bottleB', label: 'Bottle B', role: 'headline', maxChars: 14 },
      ],
    },
    layout: { safeZone: 'center-stack', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3, phases: { entry: 18, emphasis: 52, hold: 20, exit: 10 } },
    curves: { entry: 'Pop', emphasis: 'Elastic', exit: 'Ease In' },
    motionProfile: {
      style: 'versus-stack',
      stagger: 0.1,
      slotOrder: ['bottleA', 'vs', 'bottleB'],
      layerAnimations: { eyebrow: 'fade-up', headline: 'slam' },
    },
    intensity: { scale: 'medium', distance: 'medium', shake: 'off' },
    design: { primaryColor: '#f4d35e', punchColor: '#f4d35e', bgColor: 'rgba(20, 12, 0, 0.1)' },
    texts: [
      createTextLayer({ id: 'bottleA', content: 'JOHNNIE WALKER', role: 'headline', type: 'punch', font: 'Outfit', fill: '#ffffff', y: 22, fontSize: 50, maxChars: 14, hasStroke: false, letterSpacing: -2 }),
      createTextLayer({ id: 'vs', content: 'VS', role: 'eyebrow', font: 'Outfit', fill: '#f4d35e', y: 48, fontSize: 30, hasStroke: false, letterSpacing: 6 }),
      createTextLayer({ id: 'bottleB', content: 'CHIVAS REGAL', role: 'headline', type: 'punch', font: 'Outfit', fill: '#ffffff', y: 72, fontSize: 50, maxChars: 14, hasStroke: false, letterSpacing: -2 }),
    ],
  },

  {
    id: 'TASTING_NOTE',
    name: 'Tasting Note',
    description: 'Flavour descriptor stack — one headline flavour word up top, the full tasting note below.',
    category: 'Beverage',
    accent: '#fdba74',
    tags: ['tasting', 'flavour', 'notes', 'descriptor', 'beverage'],
    isBuiltIn: true,
    structure: {
      pattern: 'hero flavour -> full descriptor -> bottle',
      strategy: 'One dominant taste word grabs attention; the secondary notes reward those who stay.',
      slots: [
        { id: 'hero', label: 'Hero Flavour', role: 'headline', maxChars: 14 },
        { id: 'notes', label: 'Tasting Notes', role: 'support', maxChars: 30 },
        { id: 'bottle', label: 'Bottle', role: 'eyebrow', maxChars: 20 },
      ],
    },
    layout: { safeZone: 'center-stack', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3.4, phases: { entry: 22, emphasis: 44, hold: 24, exit: 10 } },
    curves: { entry: 'Soft Float', emphasis: 'No Overshoot', exit: 'Ease In' },
    motionProfile: {
      style: 'editorial-serf',
      stagger: 0.14,
      slotOrder: ['hero', 'notes', 'bottle'],
      layerAnimations: { headline: 'drift-up', support: 'fade-up', eyebrow: 'rise' },
    },
    intensity: { scale: 'light', distance: 'light', shake: 'off' },
    design: { primaryColor: '#fdba74', punchColor: '#fdba74', bgColor: 'rgba(20, 8, 0, 0.08)' },
    texts: [
      createTextLayer({ id: 'hero', content: 'SMOKY', role: 'headline', font: 'Cormorant Garamond', fill: '#fdba74', y: 22, fontSize: 82, maxChars: 14, hasStroke: false, letterSpacing: -1, fontWeight: 600 }),
      createTextLayer({ id: 'notes', content: 'VANILLA · OAK · DARK CHOCOLATE', role: 'support', font: 'Outfit', fill: '#ffffff', y: 52, fontSize: 20, hasStroke: false, letterSpacing: 1 }),
      createTextLayer({ id: 'bottle', content: 'ARDBEG 10', role: 'eyebrow', font: 'Outfit', fill: '#fdba74', y: 67, fontSize: 22, hasStroke: false, letterSpacing: 0 }),
    ],
  },

  {
    id: 'HIDDEN_BOTTLE',
    name: 'Hidden Bottle',
    description: 'Mystery hook — “nobody talks about this” positioned above a giant unknown product name.',
    category: 'Beverage',
    accent: '#c4b5fd',
    tags: ['hidden', 'mystery', 'underrated', 'beverage', 'reveal'],
    isBuiltIn: true,
    structure: {
      pattern: 'nobody knows -> the thing -> why',
      strategy: 'Open with exclusion, drop the name like a secret, tease the payoff below.',
      slots: [
        { id: 'setup', label: 'Setup', role: 'eyebrow', maxChars: 26 },
        { id: 'name', label: 'Product Name', role: 'headline', maxChars: 16 },
        { id: 'tease', label: 'Tease', role: 'support', maxChars: 26 },
      ],
    },
    layout: { safeZone: 'center-stack', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3.2, phases: { entry: 20, emphasis: 48, hold: 22, exit: 10 } },
    curves: { entry: 'Soft Float', emphasis: 'Elastic', exit: 'Ease In' },
    motionProfile: {
      style: 'tease-reveal',
      stagger: 0.14,
      slotOrder: ['setup', 'name', 'tease'],
      layerAnimations: { eyebrow: 'fade-up', headline: 'zoom-spin', support: 'pill-pop' },
    },
    intensity: { scale: 'medium', distance: 'light', shake: 'off' },
    design: { primaryColor: '#ffffff', punchColor: '#c4b5fd', bgColor: 'rgba(10, 6, 20, 0.08)' },
    texts: [
      createTextLayer({ id: 'setup', content: 'NOBODY TALKS ABOUT', role: 'eyebrow', font: 'Outfit', fill: '#c4b5fd', y: 24, fontSize: 22, hasStroke: false, letterSpacing: 0.5 }),
      createTextLayer({ id: 'name', content: 'THIS BOTTLE', role: 'headline', type: 'punch', font: 'Outfit', fill: '#ffffff', y: 48, fontSize: 68, maxChars: 16, hasStroke: false, letterSpacing: -2 }),
      createTextLayer({ id: 'tease', content: 'AND IT SHOULD BE IN YOUR BAR', role: 'support', font: 'Outfit', fill: '#c4b5fd', y: 72, fontSize: 20, hasStroke: false, letterSpacing: 0 }),
    ],
  },

  {
    id: 'COCKTAIL_REVEAL',
    name: 'Cocktail Reveal',
    description: 'Recipe hook — ingredient punch at top, cocktail name slams at the bottom.',
    category: 'Beverage',
    accent: '#34d399',
    tags: ['cocktail', 'recipe', 'mix', 'beverage', 'reveal'],
    isBuiltIn: true,
    structure: {
      pattern: 'key ingredient -> makes a -> cocktail name',
      strategy: 'Lead with the star ingredient, then make the cocktail name the payoff.',
      slots: [
        { id: 'ingredient', label: 'Key Ingredient', role: 'eyebrow', maxChars: 20 },
        { id: 'bridge', label: 'Bridge', role: 'support', maxChars: 18 },
        { id: 'cocktail', label: 'Cocktail Name', role: 'headline', maxChars: 16 },
      ],
    },
    layout: { safeZone: 'lower-third', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 2.8, phases: { entry: 18, emphasis: 52, hold: 20, exit: 10 } },
    curves: { entry: 'Pop', emphasis: 'Elastic', exit: 'Ease In' },
    motionProfile: {
      style: 'bottom-stack',
      stagger: 0.1,
      slotOrder: ['ingredient', 'bridge', 'cocktail'],
      layerAnimations: { eyebrow: 'drift-up', support: 'fade-up', headline: 'counter-slam' },
    },
    intensity: { scale: 'high', distance: 'light', shake: 'off' },
    design: { primaryColor: '#34d399', punchColor: '#34d399', bgColor: 'rgba(4, 20, 12, 0.08)' },
    texts: [
      createTextLayer({ id: 'ingredient', content: 'MEZCAL', role: 'eyebrow', font: 'Outfit', fill: '#ffffff', y: 56, fontSize: 28, hasStroke: false, letterSpacing: 2 }),
      createTextLayer({ id: 'bridge', content: 'MAKES THE BEST', role: 'support', font: 'Outfit', fill: '#ffffff', y: 65, fontSize: 20, hasStroke: false, letterSpacing: -0.5 }),
      createTextLayer({ id: 'cocktail', content: 'NEGRONI', role: 'headline', type: 'punch', font: 'Outfit', fill: '#34d399', y: 82, fontSize: 80, maxChars: 16, hasStroke: false, letterSpacing: -3 }),
    ],
  },

  {
    id: 'BOTTLE_RANK',
    name: 'Bottle Rank',
    description: 'Ranking hook — position number explodes on the left, bottle name locks right with serif elegance.',
    category: 'Beverage',
    accent: '#f4d35e',
    tags: ['ranking', 'list', 'top', 'beverage', 'whiskey'],
    isBuiltIn: true,
    structure: {
      pattern: 'rank number -> bottle name -> category',
      strategy: 'The number creates instant curiosity; the bottle name delivers the promise.',
      slots: [
        { id: 'rank', label: 'Rank', role: 'headline', maxChars: 4 },
        { id: 'bottle', label: 'Bottle Name', role: 'support', maxChars: 20 },
        { id: 'category', label: 'Category', role: 'eyebrow', maxChars: 22 },
      ],
    },
    layout: { safeZone: 'center-stack', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3, phases: { entry: 18, emphasis: 52, hold: 20, exit: 10 } },
    curves: { entry: 'Ease Out Expo', emphasis: 'No Overshoot', exit: 'Ease In' },
    motionProfile: {
      style: 'number-stack',
      stagger: 0.1,
      slotOrder: ['category', 'rank', 'bottle'],
      layerAnimations: { eyebrow: 'drift-up', headline: 'counter-slam', support: 'fade-up' },
    },
    intensity: { scale: 'medium', distance: 'medium', shake: 'off' },
    design: { primaryColor: '#f4d35e', punchColor: '#f4d35e', bgColor: 'rgba(20, 14, 0, 0.1)' },
    texts: [
      createTextLayer({ id: 'category', content: 'BEST SINGLE MALT', role: 'eyebrow', font: 'Outfit', fill: '#ffffff', y: 24, fontSize: 20, hasStroke: false, letterSpacing: 1 }),
      createTextLayer({ id: 'rank', content: '#1', role: 'headline', type: 'punch', font: 'Outfit', fill: '#f4d35e', y: 50, x: 18, fontSize: 88, maxChars: 4, hasStroke: false, letterSpacing: -2 }),
      createTextLayer({ id: 'bottle', content: 'GLENFARCLAS 25', role: 'support', font: 'Cormorant Garamond', fill: '#ffffff', y: 76, fontSize: 40, maxChars: 20, hasStroke: false, letterSpacing: 0, fontWeight: 600 }),
    ],
  },

  {
    id: 'CRAFT_STORY',
    name: 'Craft Story',
    description: 'Slow editorial reveal for craft distillery / small batch stories — one sentence, huge serif treatment.',
    category: 'Beverage',
    accent: '#fde68a',
    tags: ['craft', 'small-batch', 'story', 'editorial', 'beverage'],
    isBuiltIn: true,
    structure: {
      pattern: 'craft claim serif stack',
      strategy: 'One measured sentence about the production, no frills — just the serif and the story.',
      slots: [
        { id: 'claim', label: 'Craft Claim', role: 'headline', maxChars: 36 },
      ],
    },
    layout: { safeZone: 'center-stack', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3.4, phases: { entry: 24, emphasis: 42, hold: 24, exit: 10 } },
    curves: { entry: 'Soft Float', emphasis: 'No Overshoot', exit: 'Ease In' },
    motionProfile: {
      style: 'quote-stack',
      stagger: 0.06,
      slotOrder: ['claim'],
      layerAnimations: { headline: 'drift-up' },
    },
    intensity: { scale: 'light', distance: 'light', shake: 'off' },
    design: { primaryColor: '#fde68a', punchColor: '#fde68a', bgColor: 'rgba(20, 12, 0, 0.06)' },
    texts: [
      createTextLayer({ id: 'claim', content: 'AGED IN A SINGLE BARREL FOR 12 YEARS', role: 'headline', font: 'Cormorant Garamond', fill: '#fde68a', y: 70, x: 50, fontSize: 46, maxChars: 40, hasStroke: false, letterSpacing: 0, lineHeight: 0.88, fontWeight: 600 }),
    ],
  },

  {
    id: 'POUR_MOMENT',
    name: 'Pour Moment',
    description: 'Minimal lower-third label for a pour or serve moment — clean product name below, nothing above.',
    category: 'Beverage',
    accent: '#ffffff',
    tags: ['pour', 'serve', 'minimal', 'lower-third', 'beverage'],
    isBuiltIn: true,
    structure: {
      pattern: 'product name -> serving note',
      strategy: 'Let the video do the talking; text just names what you see.',
      slots: [
        { id: 'product', label: 'Product', role: 'headline', maxChars: 18 },
        { id: 'serve', label: 'Serve Note', role: 'support', maxChars: 22 },
      ],
    },
    layout: { safeZone: 'lower-third', alignment: 'center', anchor: 'middle' },
    timing: { startTime: 0, duration: 3, phases: { entry: 22, emphasis: 46, hold: 22, exit: 10 } },
    curves: { entry: 'Soft Float', emphasis: 'No Overshoot', exit: 'Ease In' },
    motionProfile: {
      style: 'editorial-serf',
      stagger: 0.08,
      slotOrder: ['product', 'serve'],
      layerAnimations: { headline: 'drift-up', support: 'fade-up' },
    },
    intensity: { scale: 'light', distance: 'light', shake: 'off' },
    design: { primaryColor: '#ffffff', punchColor: '#f4d35e', bgColor: 'rgba(0,0,0,0.04)' },
    texts: [
      createTextLayer({ id: 'product', content: 'HIBIKI HARMONY', role: 'headline', font: 'Cormorant Garamond', fill: '#ffffff', y: 72, x: 50, fontSize: 52, maxChars: 18, hasStroke: false, letterSpacing: 1, fontWeight: 600 }),
      createTextLayer({ id: 'serve', content: 'SERVED OVER A SINGLE SPHERE', role: 'support', font: 'Outfit', fill: '#f4d35e', y: 83, fontSize: 18, hasStroke: false, letterSpacing: 0.5 }),
    ],
  },
];

export const PRESET_META = Object.fromEntries(
  STARTER_PRESETS.map((preset) => [preset.id, {
    label: preset.name,
    desc: preset.description,
    accent: preset.accent,
    category: preset.category,
  }]),
);

const createPresetConfig = (preset) => deepClone({
  id: preset.id,
  template: preset.id,
  name: preset.name,
  description: preset.description,
  category: preset.category,
  accent: preset.accent,
  tags: preset.tags,
  isBuiltIn: preset.isBuiltIn,
  structure: preset.structure,
  layout: preset.layout,
  timing: preset.timing,
  curves: preset.curves,
  motionProfile: preset.motionProfile,
  intensity: preset.intensity,
  texts: preset.texts,
  images: preset.images ?? [],
  shapes: preset.shapes ?? [],
  design: preset.design,
});

const createBlankHookConfig = () => ({
  id: 'BLANK_HOOK',
  template: null,
  name: 'Untitled Hook',
  description: 'Start from scratch or choose a preset.',
  category: 'Custom',
  accent: '#6366f1',
  tags: [],
  isBuiltIn: false,
  structure: {
    pattern: '',
    strategy: '',
    slots: [],
  },
  layout: { safeZone: 'center-stack', alignment: 'center', anchor: 'middle' },
  timing: { startTime: 0, duration: 3, phases: { entry: 20, emphasis: 50, hold: 20, exit: 10 } },
  curves: { entry: 'Pop', emphasis: 'Elastic', exit: 'Ease In' },
  motionProfile: {
    style: 'custom',
    stagger: 0.12,
    slotOrder: [],
    layerAnimations: {},
  },
  intensity: { scale: 'medium', distance: 'medium', shake: 'off' },
  texts: [],
  images: [],
  shapes: [],
  design: { primaryColor: '#ffffff', punchColor: '#6366f1', bgColor: 'rgba(0, 0, 0, 0.8)' },
});

const createCustomPresetFromConfig = (config, name) => {
  const presetName = name?.trim() || `${config.name} Copy`;
  const timestamp = Date.now();
  const slug = presetName
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 36) || 'CUSTOM_PRESET';
  const presetId = `CUSTOM_${slug}_${timestamp}`;

  return {
    ...deepClone(config),
    id: presetId,
    template: presetId,
    name: presetName,
    description: config.description || 'Custom saved preset',
    isBuiltIn: false,
  };
};

export function HookProvider({ children }) {
  const [appMode, setAppMode] = useState('design');
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'text'
  const [sidebarTab, setSidebarTab] = useState('transcribe');
  const [video, setVideo] = useState({
    url: null,
    localFile: null,
    storagePath: null,
    name: null,
    duration: 0,
    currentTime: 0,
    playing: false,
    showSafeZones: false,
    showPhoneFrame: false,
  });
  const [customPresets, setCustomPresets] = useState([]);
  const [activePresetId, setActivePresetId] = useState(null);
  const [hookConfig, setHookConfig] = useState(createBlankHookConfig);
  const [selectedTextId, setSelectedTextId] = useState(null);
  // Multi-select: array of selected ids. Primary selection (selectedTextId) is always the last clicked.
  const [selectedTextIds, setSelectedTextIds] = useState([]);
  const [timelineH, setTimelineH] = useState(160);
  const [previewKey, setPreviewKey] = useState(0);
  const triggerPreview = () => setPreviewKey((k) => k + 1);

  // ── Canvas viewport ───────────────────────────────────────────────────────
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [showGrid, setShowGrid]     = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const CANVAS_ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];
  const GRID_STEP = 5; // percent

  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [projectSaveStatus, setProjectSaveStatus] = useState('idle'); // 'idle'|'saving'|'saved'|'error'
  const saveTimerRef = useRef(null);

  // ── Undo ─────────────────────────────────────────────────────────────────
  // Ref to the actual <video> DOM element — set by VideoPreview, read by KaraokeText for rAF-based timing
  const videoElRef = useRef(null);

  const hookHistoryRef = useRef([]);
  const hookFutureRef  = useRef([]);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const pushHistory = useCallback(() => {
    setHookConfig((current) => {
      hookHistoryRef.current = [...hookHistoryRef.current.slice(-40), deepClone(current)];
      hookFutureRef.current  = [];
      setUndoCount(hookHistoryRef.current.length);
      setRedoCount(0);
      return current;
    });
  }, []);
  const undo = useCallback(() => {
    if (hookHistoryRef.current.length === 0) return;
    setHookConfig((current) => {
      const prev = hookHistoryRef.current.at(-1);
      hookHistoryRef.current = hookHistoryRef.current.slice(0, -1);
      hookFutureRef.current  = [deepClone(current), ...hookFutureRef.current.slice(0, 39)];
      setUndoCount(hookHistoryRef.current.length);
      setRedoCount(hookFutureRef.current.length);
      return prev;
    });
  }, []);
  const redo = useCallback(() => {
    if (hookFutureRef.current.length === 0) return;
    setHookConfig((current) => {
      const next = hookFutureRef.current[0];
      hookFutureRef.current  = hookFutureRef.current.slice(1);
      hookHistoryRef.current = [...hookHistoryRef.current, deepClone(current)];
      setUndoCount(hookHistoryRef.current.length);
      setRedoCount(hookFutureRef.current.length);
      return next;
    });
  }, []);

  // ── Non-text layer selection ───────────────────────────────────────────────
  const [selectedLayerId,   setSelectedLayerId]   = useState(null);
  const [selectedLayerType, setSelectedLayerType] = useState(null); // 'image'|'shape'|null


  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setCustomPresets(parsed);
      }
    } catch {
      // Ignore malformed local storage and continue with built-in presets.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(customPresets));
  }, [customPresets]);

  // Auto-save: debounce 2s after any hookConfig change when a project is open
  useEffect(() => {
    if (!currentProjectId || !isSupabaseEnabled) return;
    setProjectSaveStatus('saving');
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await dbUpdateProject(currentProjectId, { hookConfig });
        setProjectSaveStatus('saved');
        const t = setTimeout(() => setProjectSaveStatus('idle'), 2500);
        return () => clearTimeout(t);
      } catch (err) {
        console.error('[HookForge] Auto-save failed:', err);
        setProjectSaveStatus('error');
      }
    }, 2000);
    return () => clearTimeout(saveTimerRef.current);
  }, [hookConfig, currentProjectId]);

  const presetLibrary = useMemo(() => [...STARTER_PRESETS, ...customPresets], [customPresets]);

  const activePreset = useMemo(
    () => presetLibrary.find((preset) => preset.id === activePresetId) ?? null,
    [activePresetId, presetLibrary],
  );

  const applyPreset = (presetId) => {
    const preset = presetLibrary.find((entry) => entry.id === presetId);
    if (!preset) return;

    setActivePresetId(preset.id);
    setHookConfig(createPresetConfig(preset));
    setSelectedTextId(null);
  };

  const resetActivePreset = () => {
    if (!activePreset) {
      setHookConfig(createBlankHookConfig());
      setSelectedTextId(null);
      return;
    }
    setHookConfig(createPresetConfig(activePreset));
    setSelectedTextId(null);
  };

  const createBlankHook = () => {
    setActivePresetId(null);
    setHookConfig(createBlankHookConfig());
    setSelectedTextId(null);
  };

  const saveCurrentAsPreset = (name) => {
    const nextPreset = createCustomPresetFromConfig(hookConfig, name);
    setCustomPresets((prev) => [...prev, nextPreset]);
    setActivePresetId(nextPreset.id);
    setHookConfig(createPresetConfig(nextPreset));
    return nextPreset.id;
  };

  const updateCurrentPreset = () => {
    if (hookConfig.isBuiltIn) return false;

    const updatedPreset = deepClone({
      ...hookConfig,
      id: activePresetId,
      template: activePresetId,
      isBuiltIn: false,
    });

    setCustomPresets((prev) => prev.map((preset) => (
      preset.id === activePresetId ? updatedPreset : preset
    )));
    setHookConfig(createPresetConfig(updatedPreset));
    return true;
  };

  const addTextAtPosition = (x, y) => {
    const newId = `layer_${Date.now()}`;
    setHookConfig((prev) => ({
      ...prev,
      texts: [
        ...prev.texts,
        {
          id: newId,
          content: 'NEW TEXT',
          role: 'support',
          type: 'normal',
          font: 'Inter',
          fill: '#ffffff',
          hasStroke: false,
          stroke: '#000000',
          strokeWidth: 2,
          x,
          y,
          fontSize: 36,
          bgColor: 'transparent',
          bgStyle: 'pill',
          maxChars: 24,
          animation: null,
          curve: null,
          entryTime: null,
          duration: null,
          letterSpacing: 0,
          lineHeight: 1,
          fontWeight: null,
          shape: 'line',
          radius: 160,
          arcSpread: 110,
          textCase: 'upper',
          opacity: 1,
          shadow: null,
          warpAmount: 50,
          skewX: 0,
          skewY: 0,
          rotateX: 0,
          rotateY: 0,
          textRotate: 0,
          fillType: 'solid',
          gradientFrom: null,
          gradientTo: null,
          gradientAngle: 135,
          backdropBlur: 0,
          blendMode: 'normal',
          hidden: false,
          textAlign: null,
        },
      ],
    }));
    setSelectedTextId(newId);
    setActiveTool('select');
    setSidebarTab('style');
  };

  const addImageLayer = useCallback((src, name, aspectRatio) => {
    const id = `img_${Date.now()}`;
    setHookConfig((prev) => ({
      ...prev,
      images: [...(prev.images ?? []), {
        id, layerType: 'image', src, name: name ?? 'image',
        x: 50, y: 50, width: 35, aspectRatio: aspectRatio ?? 1,
        opacity: 1, rotation: 0, blendMode: 'normal',
        locked: false, hidden: false, zOrder: Date.now(),
      }],
    }));
    setSelectedLayerId(id);
    setSelectedLayerType('image');
    setSelectedTextId(null);
    setSelectedTextIds([]);
    return id;
  }, []);

  const addShapeLayer = useCallback((shapeType) => {
    const id = `shp_${Date.now()}`;
    setHookConfig((prev) => ({
      ...prev,
      shapes: [...(prev.shapes ?? []), {
        id, layerType: 'shape', shape: shapeType ?? 'rect',
        name: shapeType ?? 'rect',
        x: 50, y: 50, width: 25, height: 14,
        fill: prev.accent ?? '#6366f1', fillOpacity: 0.85,
        strokeColor: '#ffffff', strokeWidth: 2, hasStroke: false,
        opacity: 1, rotation: 0, borderRadius: shapeType === 'circle' ? 999 : 8,
        locked: false, hidden: false, zOrder: Date.now(),
      }],
    }));
    setSelectedLayerId(id);
    setSelectedLayerType('shape');
    setSelectedTextId(null);
    setSelectedTextIds([]);
  }, []);

  const deletePreset = (presetId) => {
    const preset = customPresets.find((entry) => entry.id === presetId);
    if (!preset) return;

    setCustomPresets((prev) => prev.filter((entry) => entry.id !== presetId));

    if (activePresetId === presetId) {
      setActivePresetId(null);
      setHookConfig(createBlankHookConfig());
      setSelectedTextId(null);
    }
  };

  // ── Project management ────────────────────────────────────────────────────
  const saveNewProject = async (name = 'Untitled Project') => {
    if (!isSupabaseEnabled) return null;
    setProjectSaveStatus('saving');
    try {
      let videoPath = video.storagePath ?? null;
      let videoName = video.name ?? null;
      let videoDuration = video.duration ?? null;

      // Upload video if it's a local file not yet uploaded
      if (video.localFile && !video.storagePath) {
        const { data: { user } } = await supabase.auth.getUser();
        const tempId = `tmp_${Date.now()}`;
        videoPath = await uploadVideo(video.localFile, user.id, tempId);
        setVideo((v) => ({ ...v, storagePath: videoPath }));
      }

      const proj = await createProject({ name, hookConfig, videoPath, videoName, videoDuration });
      setCurrentProjectId(proj.id);
      setProjectSaveStatus('saved');
      setTimeout(() => setProjectSaveStatus('idle'), 2500);
      return proj.id;
    } catch (err) {
      console.error('[HookForge] Save failed:', err);
      setProjectSaveStatus('error');
      return null;
    }
  };

  const loadProjectById = async (projectId) => {
    if (!isSupabaseEnabled) return;
    try {
      const proj = await loadProject(projectId);
      setCurrentProjectId(proj.id);
      setHookConfig(proj.hook_config);
      setSelectedTextId(null);
      setSelectedTextIds([]);
      hookHistoryRef.current = [];
      setUndoCount(0);

      if (proj.video_path) {
        const signedUrl = await getVideoSignedUrl(proj.video_path);
        setVideo((v) => ({
          ...v,
          url: signedUrl,
          storagePath: proj.video_path,
          name: proj.video_name,
          duration: proj.video_duration ?? 0,
          localFile: null,
          currentTime: 0,
          playing: false,
        }));
      } else {
        setVideo((v) => ({ ...v, url: null, localFile: null, storagePath: null, name: null, duration: 0, currentTime: 0 }));
      }
    } catch (err) {
      console.error('[HookForge] Load project failed:', err);
    }
  };

  return (
    <HookContext.Provider value={{
      appMode,
      setAppMode,
      activeTool,
      setActiveTool,
      sidebarTab,
      setSidebarTab,
      video,
      setVideo,
      videoElRef,
      hookConfig,
      setHookConfig,
      selectedTextId,
      setSelectedTextId,
      selectedTextIds,
      setSelectedTextIds,
      timelineH,
      setTimelineH,
      previewKey,
      triggerPreview,
      undoCount,
      pushHistory,
      undo,
      redo,
      redoCount,
      selectedLayerId,
      setSelectedLayerId,
      selectedLayerType,
      setSelectedLayerType,
      addImageLayer,
      addShapeLayer,
      presetLibrary,
      activePreset,
      activePresetId,
      applyPreset,
      createBlankHook,
      resetActivePreset,
      saveCurrentAsPreset,
      updateCurrentPreset,
      deletePreset,
      addTextAtPosition,
      currentProjectId,
      projectSaveStatus,
      saveNewProject,
      loadProjectById,
      canvasZoom,
      setCanvasZoom,
      showGrid,
      setShowGrid,
      snapToGrid,
      setSnapToGrid,
      CANVAS_ZOOM_LEVELS,
      GRID_STEP,
    }}>
      {children}
    </HookContext.Provider>
  );
}

export function useHookStore() {
  return useContext(HookContext);
}
