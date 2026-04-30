import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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
  maxChars = 24,
  animation = null,
  curve = null,        // per-layer easing curve override; null = use global
  entryTime = null,   // seconds offset from hook start; null = use motionProfile stagger
  duration = null,    // seconds duration; null = until hook ends
  letterSpacing = 0,
  lineHeight = 1,
  fontWeight = null,
  radius = 160,
  arcSpread = 110,
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
  maxChars,
  animation,
  curve,
  entryTime,
  duration,
  letterSpacing,
  lineHeight,
  fontWeight,
  radius,
  arcSpread,
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
      createTextLayer({ id: 'payoff', content: "THE ENTIRE WORLD", role: 'headline', type: 'punch', font: 'Outfit', fill: '#f4d35e', y: 76, fontSize: 58, maxChars: 22, hasStroke: false, letterSpacing: -2 }),
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
  const [sidebarTab, setSidebarTab] = useState('layers');
  const [video, setVideo] = useState({
    url: null,
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
        },
      ],
    }));
    setSelectedTextId(newId);
    setActiveTool('select');
    setSidebarTab('layers');
  };

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
      hookConfig,
      setHookConfig,
      selectedTextId,
      setSelectedTextId,
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
    }}>
      {children}
    </HookContext.Provider>
  );
}

export function useHookStore() {
  return useContext(HookContext);
}
