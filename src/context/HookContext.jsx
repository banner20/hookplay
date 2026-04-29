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
}) => ({
  id,
  content,
  role,
  type,
  font,
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
  const [video, setVideo] = useState({
    url: null,
    duration: 0,
    currentTime: 0,
    playing: false,
    showSafeZones: false,
  });
  const [customPresets, setCustomPresets] = useState([]);
  const [activePresetId, setActivePresetId] = useState(STARTER_PRESETS[0].id);
  const [hookConfig, setHookConfig] = useState(() => createPresetConfig(STARTER_PRESETS[0]));
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
    () => presetLibrary.find((preset) => preset.id === activePresetId) ?? presetLibrary[0],
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
    if (!activePreset) return;
    setHookConfig(createPresetConfig(activePreset));
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

  const deletePreset = (presetId) => {
    const preset = customPresets.find((entry) => entry.id === presetId);
    if (!preset) return;

    setCustomPresets((prev) => prev.filter((entry) => entry.id !== presetId));

    if (activePresetId === presetId) {
      setActivePresetId(STARTER_PRESETS[0].id);
      setHookConfig(createPresetConfig(STARTER_PRESETS[0]));
      setSelectedTextId(null);
    }
  };

  return (
    <HookContext.Provider value={{
      appMode,
      setAppMode,
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
      resetActivePreset,
      saveCurrentAsPreset,
      updateCurrentPreset,
      deletePreset,
    }}>
      {children}
    </HookContext.Provider>
  );
}

export function useHookStore() {
  return useContext(HookContext);
}
