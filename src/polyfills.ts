/**
 * Polyfill exécuté avant tout autre module (sockjs-client / @stomp/stompjs utilisent "global").
 */
const g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : undefined);
if (g && typeof (g as unknown as { global?: unknown }).global === 'undefined') {
  (g as unknown as { global: typeof g }).global = g;
}
