/**
 * Converts a Whisper / Groq word-timestamp result into HookForge text layers.
 *
 * Key design: all caption layers sit at the SAME x/y position and appear
 * sequentially via entryTime + duration — like real subtitles. Do NOT spread
 * them across different Y coordinates (that causes all to show at once, stacked).
 *
 * @param {Object}  result        - Output with .chunks [{ text, timestamp:[s,e] }]
 * @param {number}  hookStart     - timing.startTime (informational, unused for clamping)
 * @param {number}  hookDuration  - timing.duration (pass 999999 to skip clamping)
 * @param {Object}  opts
 * @param {number}  opts.maxWords        - max words per block (default 4)
 * @param {number}  opts.pauseThreshold  - gap (s) that forces a split (default 0.35)
 * @param {number}  opts.fontSize        - font size in px (default 28)
 * @param {number}  opts.captionX        - X position % (default 50)
 * @param {number}  opts.captionY        - Y position % (default 78 = lower third)
 * @param {string}  opts.fill            - text colour (default '#ffffff')
 * @param {boolean} opts.hasStroke       - outline for readability (default true)
 * @param {string}  opts.stroke          - outline colour (default '#000000')
 * @param {number}  opts.strokeWidth     - outline width (default 2)
 * @param {string}  opts.bgColor         - background colour (default 'transparent')
 * @param {string}  opts.bgStyle         - 'pill' | 'bar' | 'box' (default 'pill')
 * @param {string}  opts.animation       - entry animation (default 'drift-up')
 * @param {string}  opts.textCase        - 'upper' | 'lower' | 'none' (default 'upper')
 * @param {string}  opts.karaokeColor    - highlight colour (default '#FFE400')
 * @returns {Array} array of text layer objects ready for hookConfig.texts
 */
export function transcriptToLayers(result, hookStart, hookDuration, opts = {}) {
  const {
    maxWords       = 4,
    pauseThreshold = 0.35,
    // Caption appearance
    fontSize       = 28,
    captionX       = 50,
    captionY       = 78,
    fill           = '#ffffff',
    hasStroke      = true,
    stroke         = '#000000',
    strokeWidth    = 2,
    bgColor        = 'transparent',
    bgStyle        = 'pill',
    animation      = 'drift-up',
    textCase       = 'upper',
    karaokeColor   = '#FFE400',
  } = opts;

  // ── 1. Extract word chunks ──────────────────────────────────────────────────
  const raw = result.chunks ?? [];
  const wordChunks = raw
    .map((c) => ({
      word:  (c.text ?? '').trim(),
      start: Array.isArray(c.timestamp) ? (c.timestamp[0] ?? 0) : 0,
      end:   Array.isArray(c.timestamp) ? (c.timestamp[1] ?? c.timestamp[0] ?? 0) : 0,
    }))
    .filter((c) => c.word.length > 0);

  if (wordChunks.length === 0) return [];

  // ── 2. Group into phrases ───────────────────────────────────────────────────
  const phrases = [];
  let current = null;

  for (const chunk of wordChunks) {
    const gap       = current ? chunk.start - current.end : 0;
    const wordCount = current ? current.words.length : 0;

    const splitOnPause  = current && gap > pauseThreshold && wordCount >= 1;
    const splitOnLength = current && wordCount >= maxWords;

    if (!current || splitOnPause || splitOnLength) {
      if (current) phrases.push(current);
      current = {
        words:      [chunk.word],
        wordStarts: [chunk.start],
        wordEnds:   [chunk.end],
        start:      chunk.start,
        end:        chunk.end,
      };
    } else {
      current.words.push(chunk.word);
      current.wordStarts.push(chunk.start);
      current.wordEnds.push(chunk.end);
      current.end = chunk.end;
    }
  }
  if (current) phrases.push(current);

  // ── 3. Apply text case ─────────────────────────────────────────────────────
  const applyCase = (str) => {
    if (textCase === 'upper') return str.toUpperCase();
    if (textCase === 'lower') return str.toLowerCase();
    if (textCase === 'title') return str.replace(/\b\w/g, (c) => c.toUpperCase());
    return str;
  };

  const ANIM_POOL = ['drift-up', 'slam', 'blur-in', 'fade-up', 'rise'];

  // ── 4. Convert phrases → text layers ───────────────────────────────────────
  // ALL layers use the same x/y — sequential display is handled by entryTime + duration.
  return phrases.map((phrase, i) => {
    const relStart = Math.max(0, phrase.start);
    const relEnd   = phrase.end;
    // Give each block a small tail so it doesn't disappear exactly on the last syllable
    const dur = Math.max(0.3, relEnd - relStart + 0.15);

    const clampedStart = Math.min(relStart, hookDuration - 0.1);
    const clampedDur   = Math.min(dur, hookDuration - clampedStart);

    // Per-word timestamps for karaoke (same time space as entryTime)
    const wordTimestamps = phrase.words.map((w, wi) => ({
      word:  w,
      start: phrase.wordStarts[wi],
      end:   phrase.wordEnds[wi],
    }));

    return {
      id:             `auto_${Date.now()}_${i}`,
      content:        applyCase(phrase.words.join(' ')),
      role:           'support',
      type:           'caption',
      font:           'Inter',
      fill,
      hasStroke,
      stroke,
      strokeWidth,
      x:              captionX,
      y:              captionY,       // ← same for ALL layers (sequential via timing)
      // width constrains the text to never overflow horizontally (enables pre-wrap)
      width:          86,
      fontSize,
      fontWeight:     700,
      bgColor,
      bgStyle,
      animation:      ANIM_POOL[i % ANIM_POOL.length],
      curve:          null,
      entryTime:      clampedStart,
      duration:       clampedDur,
      letterSpacing:  0,
      lineHeight:     1.2,
      shape:          'line',
      textCase,
      opacity:        1,
      shadow:         null,
      fillType:       'solid',
      textAlign:      'center',
      // Karaoke
      wordTimestamps,
      karaokeColor,
    };
  });
}
