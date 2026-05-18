/**
 * Extracts a mono 16 kHz Float32Array from a video/audio blob URL.
 * Whisper expects 16 kHz mono PCM.
 *
 * @param {string}   blobUrl   - blob: or object URL pointing to the media file
 * @param {number}   startSec  - start of the segment in seconds
 * @param {number}   durSec    - duration of the segment in seconds
 * @param {function} onStatus  - optional callback(string) for progress messages
 * @returns {Promise<Float32Array>}
 */
export async function extractAudioSegment(blobUrl, startSec, durSec, onStatus) {
  onStatus?.('Fetching media…');
  const response = await fetch(blobUrl);
  if (!response.ok) throw new Error(`Could not fetch video (${response.status})`);
  const arrayBuffer = await response.arrayBuffer();

  onStatus?.('Decoding audio…');
  const decodeCtx = new AudioContext();
  const fullBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
  await decodeCtx.close();

  const TARGET_SR = 16_000;
  const clampedStart = Math.max(0, Math.min(startSec, fullBuffer.duration));
  const clampedDur   = Math.min(durSec, fullBuffer.duration - clampedStart);

  onStatus?.('Resampling to 16 kHz…');
  // OfflineAudioContext resamples + sums to mono in one pass
  const offlineCtx = new OfflineAudioContext(
    1,
    Math.ceil(clampedDur * TARGET_SR),
    TARGET_SR
  );
  const source = offlineCtx.createBufferSource();
  source.buffer = fullBuffer;
  source.connect(offlineCtx.destination);
  source.start(0, clampedStart, clampedDur);

  const rendered = await offlineCtx.startRendering();
  return rendered.getChannelData(0);
}
