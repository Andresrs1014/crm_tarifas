// ============================================================
// BRIDGE DE PERSISTENCIA — reemplaza localStorage por el backend, sin tocar
// ninguna línea del resto de la app (block-1 a block-4). El resto del código
// sigue llamando localStorage.getItem/setItem/removeItem/key/length exactamente
// igual que antes; este archivo intercepta esas llamadas.
//
// Carga inicial: una sola petición SÍNCRONA (bloqueante) para hidratar la caché
// en memoria ANTES de que corra el resto de los scripts — es la única forma de
// que el `let db = JSON.parse(localStorage.getItem(...))` de block-2-app.js,
// que se ejecuta en cuanto el script carga, reciba datos reales.
// Escrituras: van a la caché en memoria de inmediato (igual de rápido que antes
// para quien está usando la app) y se persisten en el backend en segundo plano.
// ============================================================
(function () {
  'use strict';

  function syncRequest(method, url, body) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, false); // false = síncrono, intencional (ver comentario arriba)
    if (body) xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(body ? JSON.stringify(body) : null);
    return xhr;
  }

  var cache = Object.create(null); // { key: { value: <string>, version: <number> } }

  // 0. Link público de cotización (?ZYMO=COT001 o ?cot=id) — sin login. El propio
  // HTML original ya asumía este link como de solo-lectura ("solo funciona en el
  // dispositivo donde fue creada"); acá se resuelve del lado del servidor y se le
  // entrega al visitante ÚNICAMENTE esa cotización, nunca el resto de la BD.
  var params = new URLSearchParams(window.location.search);
  var cotParam = params.get('ZYMO') || params.get('cot');
  var isPublicView = !!cotParam;

  if (isPublicView) {
    var pubXhr = syncRequest('GET', '/api/public/cotizacion/' + encodeURIComponent(cotParam));
    var pub = { cotizacion: null };
    try { pub = JSON.parse(pubXhr.responseText || '{}'); } catch (e) {}
    var syntheticDb = {
      cotizaciones: pub.cotizacion ? [pub.cotizacion] : [],
      biblioteca: pub.biblioteca || {},
      tarifasEspeciales: pub.tarifasEspeciales || {},
      comerciales: pub.comerciales || [],
    };
    cache['zymo-db'] = { value: JSON.stringify(syntheticDb), version: null };
  } else {
    // 1. Sesión requerida — si no hay, a login.
    var meXhr = syncRequest('GET', '/api/auth/me');
    var me = {};
    try { me = JSON.parse(meXhr.responseText || '{}'); } catch (e) {}
    if (!me.authenticated) {
      window.location.replace('/login.html?next=' + encodeURIComponent(window.location.pathname + window.location.search));
      throw new Error('No autenticado — redirigiendo a login');
    }

    // 2. Hidratar TODA la caché de una sola vez.
    var storeXhr = syncRequest('GET', '/api/storage');
    if (storeXhr.status === 200) {
      var all = {};
      try { all = JSON.parse(storeXhr.responseText || '{}'); } catch (e) {}
      Object.keys(all).forEach(function (k) {
        cache[k] = { value: JSON.stringify(all[k].value), version: all[k].version };
      });
    }
  }

  function persist(key, valueStr, expectedVersion) {
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', '/api/storage/' + encodeURIComponent(key), true); // async — no bloquea la UI
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      if (xhr.status === 409) {
        console.error('[storage-bridge] Conflicto guardando "' + key + '": otro usuario guardó cambios más recientes.');
        // ponytail: sin esto, la versión local nunca se actualiza y CADA acción
        // siguiente de este usuario vuelve a fallar en silencio hasta que cierra
        // la pestaña — perdiendo todo lo que hizo desde el último guardado exitoso,
        // sin dejar rastro. Recargar de inmediato limita la pérdida a solo esta
        // acción puntual, en vez de a toda la sesión.
        alert('Otro usuario guardó cambios en este momento. La página se va a recargar para traer la versión más reciente — repite la última acción que hiciste.');
        window.location.reload();
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var res = JSON.parse(xhr.responseText);
          if (cache[key]) cache[key].version = res.version;
        } catch (e) {}
      }
    };
    xhr.onerror = function () {
      console.error('[storage-bridge] No se pudo guardar "' + key + '" — sin conexión con el servidor.');
    };
    try {
      xhr.send(JSON.stringify({ value: JSON.parse(valueStr), expectedVersion: expectedVersion }));
    } catch (e) {
      console.error('[storage-bridge] Valor no serializable para "' + key + '":', e);
    }
  }

  var storageShim = {
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(cache, key) ? cache[key].value : null;
    },
    setItem: function (key, value) {
      var valueStr = String(value);
      var expectedVersion = Object.prototype.hasOwnProperty.call(cache, key) ? cache[key].version : null;
      cache[key] = { value: valueStr, version: expectedVersion };
      // Vista pública: solo-lectura, nunca escribe al backend compartido.
      if (!isPublicView) persist(key, valueStr, expectedVersion);
    },
    removeItem: function (key) {
      delete cache[key];
      if (isPublicView) return;
      var xhr = new XMLHttpRequest();
      xhr.open('DELETE', '/api/storage/' + encodeURIComponent(key), true);
      xhr.send(null);
    },
    key: function (index) {
      var keys = Object.keys(cache);
      return index >= 0 && index < keys.length ? keys[index] : null;
    },
    clear: function () {
      Object.keys(cache).forEach(function (k) { storageShim.removeItem(k); });
    },
  };
  Object.defineProperty(storageShim, 'length', {
    get: function () { return Object.keys(cache).length; },
  });

  try {
    Object.defineProperty(window, 'localStorage', {
      value: storageShim,
      writable: false,
      configurable: true,
    });
  } catch (e) {
    console.error('[storage-bridge] No se pudo reemplazar window.localStorage:', e);
  }
})();
