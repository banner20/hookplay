// Easing presets — shared between HookOverlay and ControlsPanel
export const getTransition = (preset) => {
  switch (preset) {
    case 'Ease Out Smooth':   return { type: 'tween', ease: [0.25, 0.1, 0.25, 1],   duration: 0.6 };
    case 'Ease Out Expo':     return { type: 'tween', ease: [0.16, 1, 0.3, 1],       duration: 0.8 };
    case 'Pop':               return { type: 'spring', stiffness: 400, damping: 15 };
    case 'Elastic':           return { type: 'spring', stiffness: 500, damping: 10, mass: 1 };
    case 'Bounce Light':      return { type: 'spring', stiffness: 300, damping: 12 };
    case 'Soft Float':        return { type: 'tween', ease: 'easeInOut', duration: 1.2 };
    case 'Ease In':           return { type: 'tween', ease: [0.42, 0, 1, 1],         duration: 0.4 };
    case 'No Overshoot':      return { type: 'tween', ease: 'easeOut',               duration: 0.4 };
    case 'Spring Stiff':      return { type: 'spring', stiffness: 700, damping: 20 };
    case 'Spring Soft':       return { type: 'spring', stiffness: 180, damping: 18 };
    case 'Linear':            return { type: 'tween', ease: 'linear', duration: 0.5 };
    case 'Overshoot':         return { type: 'spring', stiffness: 420, damping: 8, mass: 0.8 };
    default:                  return { type: 'spring', stiffness: 400, damping: 15 };
  }
};
