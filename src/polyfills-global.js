/* Polyfill global pour le navigateur (sockjs-client / stompjs) */
(function () {
  var g = typeof globalThis !== 'undefined' ? globalThis : window;
  if (typeof g.global === 'undefined') {
    g.global = g;
  }
})();
