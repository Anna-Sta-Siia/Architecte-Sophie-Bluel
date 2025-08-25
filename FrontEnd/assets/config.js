// assets/config.js
(function () {
  // Permet d’OVERRIDE à la volée: ?api=https://mon-api.exemple.com
  const qs = new URLSearchParams(location.search);
  const manual = qs.get('api');

  // milieu local (localhost, 127.0.0.1, ::1, *.local ou file://)
  const isLocal =
    location.protocol === 'file:' ||
    /^(localhost|127\.0\.0\.1|::1)$/i.test(location.hostname) ||
    /\.local$/i.test(location.hostname);

  const localApi = 'http://localhost:5678';
  const prodApi =
    document.querySelector('meta[name="api-url-prod"]')?.content ||
    'https://architecte-sophie-bluel.onrender.com';

  // -> UNE seule source de vérité partout dans le front
  window.API_URL = manual || (isLocal ? localApi : prodApi);
})();
