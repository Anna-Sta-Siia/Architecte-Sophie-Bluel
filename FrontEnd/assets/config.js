// FrontEnd/assets/config.js
(function () {
  const prodApiMeta = document.querySelector('meta[name="api-url-prod"]');
  const PROD_API = (prodApiMeta && prodApiMeta.content) || 'https://TON-APP.onrender.com';

  const qs = new URLSearchParams(location.search);
  const manual = qs.get('api'); // ?api=http://localhost:9090

  const isLocal =
    location.protocol === 'file:' ||
    /^(localhost|127\.0\.0\.1|::1)$/i.test(location.hostname) ||
    /\.local$/i.test(location.hostname);

  const candidatePorts = [5678, 5050, 3000, 8080];

  async function ping(base, path) {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 900);
      const r = await fetch(`${base}${path}`, { signal: c.signal, cache: 'no-store' });
      clearTimeout(t);
      return r.ok;
    } catch { return false; }
  }

  async function pickApi() {
    if (manual) return manual;

    if (isLocal) {
      for (const p of candidatePorts) {
        const base = `http://localhost:${p}`;
        if (await ping(base, '/api/works')) return base;   // spécifique à Sophie Bluel
        if (await ping(base, '/api/health')) return base;  // fallback santé
      }
    }
    return PROD_API;
  }

  // expose en global
  (async () => {
    window.API_URL = await pickApi();
    // console.log('[API_URL]', window.API_URL);
  })();
})();
