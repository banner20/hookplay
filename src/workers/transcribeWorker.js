import { pipeline, env } from '@xenova/transformers';

// ── Fix: force single-threaded WASM (SharedArrayBuffer unavailable in most
//    Vite dev-server contexts because COOP/COEP headers are not set).
//    Pointing wasmPaths at the CDN avoids local path-resolution failures.
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.wasmPaths  = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/';

env.allowLocalModels = false;
env.useBrowserCache  = true;

let transcriber = null;

// ─── Catch unhandled errors so the UI always gets an error message ─────────────
self.onerror = (msg, src, line, col, err) => {
  self.postMessage({ type: 'error', message: err?.message ?? String(msg) });
  return true;
};

// ─── Message handler ───────────────────────────────────────────────────────────
self.onmessage = async ({ data }) => {
  switch (data.type) {

    // ── Load / warm-up the model ──────────────────────────────────────────────
    case 'load': {
      const model = data.model ?? 'Xenova/whisper-tiny';
      try {
        transcriber = await pipeline(
          'automatic-speech-recognition',
          model,
          {
            progress_callback: (p) => {
              // transformers.js 2.x uses {status, loaded, total, file, name}
              const status = p.status ?? '';
              if (status === 'downloading' || status === 'progress' || status === 'loading') {
                self.postMessage({
                  type:   'progress',
                  loaded: p.loaded ?? 0,
                  total:  p.total  ?? 0,
                  file:   p.file   ?? p.name ?? '',
                });
              }
            },
          }
        );
        self.postMessage({ type: 'ready' });
      } catch (err) {
        self.postMessage({ type: 'error', message: err?.message ?? String(err) });
      }
      break;
    }

    // ── Transcribe a Float32Array of 16 kHz mono audio ────────────────────────
    case 'transcribe': {
      if (!transcriber) {
        self.postMessage({ type: 'error', message: 'Model not loaded yet.' });
        return;
      }
      try {
        const result = await transcriber(data.audio, {
          return_timestamps: 'word',
          chunk_length_s:    28,
          stride_length_s:   4,
          language:          data.language ?? null,
          task:              'transcribe',
        });
        self.postMessage({ type: 'result', result });
      } catch (err) {
        self.postMessage({ type: 'error', message: err?.message ?? String(err) });
      }
      break;
    }
  }
};
