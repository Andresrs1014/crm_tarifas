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
  var pendingSave = Object.create(null); // key -> { valueStr, attempt } -- próxima escritura a mandar
  var saving = Object.create(null);      // key -> true mientras haya un PUT en vuelo para esa clave
  var MAX_RETRIES = 3;

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

  // Antes, cada setItem() disparaba su propio PUT con la versión que tuviera
  // cache[key] EN ESE MOMENTO, sin esperar la respuesta del anterior -- si la
  // app llamaba a save() dos veces seguidas (algo normal: hay 70+ puntos de
  // guardado y ningún debounce), la segunda mandaba la MISMA expectedVersion
  // que la primera porque cache[key].version nunca se corregía hasta que
  // llegaba la respuesta. El servidor aceptaba la primera y rechazaba la
  // segunda con 409 -- y el manejador de 409 hacía alert()+reload() de una,
  // descartando ese guardado sin más. Con dos pestañas abiertas (o dos
  // usuarios) el choque es constante, no la excepción.
  //
  // Fix: como mucho un PUT en vuelo por clave. Si llega un setItem mientras
  // ya hay uno viajando, se encola (la más nueva reemplaza a la que estaba
  // encolada, no hace falta mandar cada estado intermedio) y se manda apenas
  // el anterior responda, ya con la versión real que confirmó el servidor.
  // Y si aun así choca (409 -- otro usuario sí guardó de por medio), el
  // servidor ya nos dice currentVersion en el propio 409: reintentamos el
  // guardado de este usuario contra esa versión fresca, hasta MAX_RETRIES
  // veces, en vez de tirar el cambio a la basura. Solo si sigue chocando
  // (conflicto real y repetido en la misma clave) cae al aviso + recarga de
  // antes, como último recurso.
  function flushKey(key) {
    if (saving[key] || !(key in pendingSave)) return;
    var job = pendingSave[key];
    delete pendingSave[key];
    saving[key] = true;

    var expectedVersion = cache[key] ? cache[key].version : null;
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', '/api/storage/' + encodeURIComponent(key), true); // async — no bloquea la UI
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      saving[key] = false;

      if (xhr.status === 409) {
        var currentVersion = null;
        try { currentVersion = JSON.parse(xhr.responseText).currentVersion; } catch (e) {}
        if (currentVersion != null && job.attempt < MAX_RETRIES) {
          if (cache[key]) cache[key].version = currentVersion;
          // Si ya se encoló un guardado más nuevo mientras este viajaba, ese
          // reemplaza al que falló -- no lo pisamos, ya se va a mandar solo
          // con la versión recién corregida arriba.
          if (!(key in pendingSave)) {
            pendingSave[key] = { valueStr: job.valueStr, attempt: job.attempt + 1 };
          }
          flushKey(key);
        } else {
          console.error('[storage-bridge] Conflicto persistente guardando "' + key + '" tras ' + job.attempt + ' reintento(s).');
          alert('Otro usuario guardó cambios en este momento y no se pudo resolver automáticamente. La página se va a recargar para traer la versión más reciente — repite la última acción que hiciste.');
          window.location.reload();
        }
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var res = JSON.parse(xhr.responseText);
          if (cache[key]) cache[key].version = res.version;
        } catch (e) {}
      } else {
        console.error('[storage-bridge] Error guardando "' + key + '": HTTP ' + xhr.status);
      }
      flushKey(key); // por si entró un guardado nuevo mientras este viajaba
    };
    xhr.onerror = function () {
      saving[key] = false;
      console.error('[storage-bridge] No se pudo guardar "' + key + '" — sin conexión con el servidor.');
    };
    try {
      xhr.send(JSON.stringify({ value: JSON.parse(job.valueStr), expectedVersion: expectedVersion }));
    } catch (e) {
      saving[key] = false;
      console.error('[storage-bridge] Valor no serializable para "' + key + '":', e);
    }
  }

  var storageShim = {
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(cache, key) ? cache[key].value : null;
    },
    setItem: function (key, value) {
      var valueStr = String(value);
      // La versión NUNCA se toca acá -- solo flushKey() la actualiza, y solo
      // con lo que el servidor confirmó (ver comentario arriba de flushKey).
      if (Object.prototype.hasOwnProperty.call(cache, key)) {
        cache[key].value = valueStr;
      } else {
        cache[key] = { value: valueStr, version: null };
      }
      // Vista pública: solo-lectura, nunca escribe al backend compartido.
      if (isPublicView) return;
      pendingSave[key] = { valueStr: valueStr, attempt: 0 };
      flushKey(key);
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

  // ── Sincronización periódica ──────────────────────────────────────────────
  // La hidratación inicial (arriba) solo pasa una vez, al cargar la página --
  // si alguien más crea/edita algo después, esta pestaña nunca se entera, se
  // queda con la foto de cuando cargó. Por eso a un comercial le aparecían
  // cotizaciones que a otro no: cada quien ve lo que había cuando SU pestaña
  // cargó, no lo que hay ahora.
  //
  // No se recarga sola en silencio -- si alguien está a mitad de llenar un
  // formulario, una recarga automática le tira el trabajo no guardado (lo
  // mismo que se acaba de corregir arriba, pero por otra vía). En vez de eso,
  // revisa el servidor cada 20s y, si hay algo más nuevo que no sea un
  // guardado propio en vuelo, muestra un aviso -- el usuario decide cuándo
  // es buen momento para actualizar.
  if (!isPublicView) {
    var syncBannerShown = false;
    function showSyncBanner() {
      if (syncBannerShown) return;
      syncBannerShown = true;
      var bar = document.createElement('div');
      bar.setAttribute('style',
        'position:fixed;left:0;right:0;bottom:0;z-index:999999;' +
        'background:#1d4ed8;color:#fff;font:600 13px/1.4 system-ui,sans-serif;' +
        'padding:10px 16px;display:flex;align-items:center;justify-content:center;' +
        'gap:14px;box-shadow:0 -2px 10px rgba(0,0,0,.25)');
      bar.innerHTML =
        '<span>Hay cotizaciones o datos nuevos guardados por otro usuario.</span>' +
        '<button type="button" style="background:#fff;color:#1d4ed8;border:0;' +
        'border-radius:6px;padding:6px 14px;font:700 13px system-ui,sans-serif;' +
        'cursor:pointer">Actualizar ahora</button>';
      bar.querySelector('button').onclick = function () { window.location.reload(); };
      document.body.appendChild(bar);
    }

    setInterval(function () {
      if (syncBannerShown) return; // ya se avisó, no hace falta seguir preguntando
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/storage', true);
      xhr.onload = function () {
        if (xhr.status !== 200) return;
        var all = {};
        try { all = JSON.parse(xhr.responseText || '{}'); } catch (e) { return; }
        var stale = Object.keys(all).some(function (key) {
          // Si hay un guardado propio pendiente o en vuelo para esta clave, no
          // cuenta como "atrasado" -- es a este usuario a quien le falta subir
          // su cambio, no al revés.
          if (key in pendingSave || saving[key]) return false;
          var localVersion = cache[key] ? cache[key].version : null;
          return localVersion != null && all[key].version > localVersion;
        });
        if (stale) showSyncBanner();
      };
      xhr.send(null);
    }, 20000);
  }
})();
