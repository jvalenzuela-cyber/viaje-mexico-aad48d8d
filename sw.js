/* Service worker — offline en destino, pero siempre la última versión si hay conexión.
   Estrategia: HTML network-first (refresca al regenerar la app); imágenes/estáticos cache-first. */
const VERSION = 'v3';
const CACHE = 'viaje-mexico-' + VERSION;
const IMG_KEYS = [
  'portada',
  'dgo_hero','mex_hero','mex_hero2','oax_hero','pxm_hero',
  'd_aguachile','d_barbacoa','d_caldillo','d_chapulines','d_chilaquiles',
  'd_churros','d_coco','d_desayuno','d_esquites','d_gorditas',
  'd_memelas','d_mezcal','d_mole','d_nieves','d_panyema',
  'd_pastor','d_pescado','d_pozole','d_pulque','d_quesillo',
  'd_quesomenonita','d_tacospescado','d_tamales','d_tasajo','d_tejate',
  'd_tlacoyos','d_tlayuda','d_tortillaharina','d_zarandeado','x_antropologia',
  'x_biolumi','x_cholula','x_condesa','x_hierve','x_surf',
  'x_teleferico','x_teotitlan','x_tortugas','x_tule','x_western',
  'x_xochimilco'
];
const CORE = ['./', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './icon-maskable.png', './icon-180.png']
  .concat(IMG_KEYS.map(k => 'img/' + k + '.jpg'));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isHTML = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy)).catch(()=>{});
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => { try { c.put(req, copy); } catch (_) {} });
      return res;
    }).catch(() => undefined))
  );
});
