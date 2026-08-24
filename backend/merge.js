'use strict';

// ============================================================
// Fusión de 3 vías (base / cliente / servidor) para el blob de storage.
//
// El guardado de este CRM manda el objeto COMPLETO cada vez -- si dos
// personas editan cosas DISTINTAS casi al mismo tiempo (un cliente nuevo vs
// una cotización nueva), sin esto el que guarda de segundo pisa por completo
// lo que el primero acababa de agregar, aunque no tengan nada que ver entre
// sí. Esta fusión evita eso: en vez de "el que guarda último gana todo",
// combina por id (arreglos) o por clave (objetos) lo que cambió de cada
// lado desde la base común.
//
// Techo real, a propósito (no es una fusión perfecta tipo Git):
// - Si las DOS personas editan el MISMO id/clave con valores distintos
//   desde la misma base, gana la versión que ya estaba en el servidor
//   (`current`) -- se prefiere no pisar a ciegas lo que ya está en vivo.
//   Ese caso puntual sigue siendo "el último gana", pero acotado a ESE
//   campo puntual, no a todo el blob -- y de todas formas nada se pierde
//   del todo: la versión del cliente que no ganó queda en storage_history
//   igual (ver server.js), restaurable desde /historial.html.
// - Solo aplica a arreglos de objetos con `.id` y a objetos planos
//   (Object.create(Object.prototype) o {}). Arreglos de escalares (strings,
//   números) no tienen forma de saber "cuál item es cuál" entre las 3
//   versiones -- ahí se usa el resultado que sí cambió respecto a la base,
//   priorizando el del cliente si ambos cambiaron.

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  var ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (var i = 0; i < ka.length; i++) {
    var k = ka[i];
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!deepEqual(a[k], b[k])) return false;
  }
  return true;
}

function isIdArray(arr) {
  return Array.isArray(arr) && arr.length > 0 && arr.every(function (it) {
    return isPlainObject(it) && (typeof it.id === 'string' || typeof it.id === 'number');
  });
}

function indexById(arr) {
  var out = Object.create(null);
  (arr || []).forEach(function (it) { out[String(it.id)] = it; });
  return out;
}

/** Fusiona 3 versiones de un mismo valor (base común, lo que manda el
 * cliente, lo que ya está guardado en el servidor). Devuelve el valor
 * fusionado. */
function merge3(base, client, current) {
  // Si cualquiera de los 3 es un arreglo, se trata como arreglo.
  if (Array.isArray(base) || Array.isArray(client) || Array.isArray(current)) {
    return mergeArrays(
      Array.isArray(base) ? base : [],
      Array.isArray(client) ? client : [],
      Array.isArray(current) ? current : []
    );
  }
  // Si cualquiera es un objeto plano, se trata como objeto (mapa por clave).
  if (isPlainObject(base) || isPlainObject(client) || isPlainObject(current)) {
    return mergeObjects(
      isPlainObject(base) ? base : {},
      isPlainObject(client) ? client : {},
      isPlainObject(current) ? current : {}
    );
  }
  // Escalar (string, number, boolean, null, undefined).
  var clientChanged = !deepEqual(client, base);
  var currentChanged = !deepEqual(current, base);
  if (clientChanged && !currentChanged) return client;
  if (!clientChanged && currentChanged) return current;
  if (!clientChanged && !currentChanged) return base;
  // Ambos cambiaron el mismo campo escalar a valores distintos -- gana lo
  // que ya está en vivo (ver "techo real" arriba). Excepción: si son
  // números y huelen a contador (ambos > base), toma el mayor -- cubre
  // cotNumero y similares sin necesitar saber el nombre del campo.
  if (typeof client === 'number' && typeof current === 'number' && typeof base === 'number'
    && client >= base && current >= base) {
    return Math.max(client, current);
  }
  return current;
}

function mergeArrays(base, client, current) {
  // Solo se puede fusionar por id si al menos una de las 3 versiones tiene
  // esa forma -- si no, no hay manera de saber qué item es cuál entre las
  // 3 listas, así que se usa el que sí cambió respecto a la base.
  if (!isIdArray(base) && !isIdArray(client) && !isIdArray(current)) {
    var currentChangedArr = !deepEqual(base, current);
    var clientChangedArr = !deepEqual(base, client);
    if (currentChangedArr && !clientChangedArr) return current;
    return client;
  }

  var baseById = indexById(base), clientById = indexById(client), currentById = indexById(current);
  var ids = []; // preserva un orden estable: primero como aparecen en current, luego nuevos del cliente
  Object.keys(currentById).forEach(function (id) { ids.push(id); });
  Object.keys(clientById).forEach(function (id) { if (ids.indexOf(id) === -1) ids.push(id); });

  var result = [];
  ids.forEach(function (id) {
    var inBase = Object.prototype.hasOwnProperty.call(baseById, id);
    var inClient = Object.prototype.hasOwnProperty.call(clientById, id);
    var inCurrent = Object.prototype.hasOwnProperty.call(currentById, id);

    if (!inClient && !inCurrent) return; // no debería pasar (venía de una de las dos listas), por seguridad

    if (inBase && !inClient && inCurrent) {
      // El cliente lo borró. ¿Alguien más lo editó desde la base mientras tanto?
      if (!deepEqual(currentById[id], baseById[id])) { result.push(currentById[id]); return; } // sí -- no lo borres, hay una edición nueva de por medio
      return; // nadie más lo tocó -- respeta el borrado
    }
    if (inBase && inClient && !inCurrent) {
      // El servidor (otra persona) ya lo había borrado. ¿El cliente lo editó desde la base?
      if (!deepEqual(clientById[id], baseById[id])) { result.push(clientById[id]); return; } // sí -- conserva la edición en vez de perderla con el borrado
      return; // el cliente no lo tocó -- respeta el borrado del otro lado
    }
    if (!inBase && inClient && !inCurrent) { result.push(clientById[id]); return; } // el cliente lo agregó
    if (!inBase && !inClient && inCurrent) { result.push(currentById[id]); return; } // otra persona lo agregó
    if (!inBase && inClient && inCurrent) {
      // Mismo id nuevo por los dos lados a la vez (raro) -- fusiona el contenido.
      result.push(merge3(undefined, clientById[id], currentById[id]));
      return;
    }
    // Está en las 3 -- fusión normal campo por campo.
    result.push(merge3(baseById[id], clientById[id], currentById[id]));
  });
  return result;
}

function mergeObjects(base, client, current) {
  var keys = [];
  Object.keys(current).forEach(function (k) { keys.push(k); });
  Object.keys(client).forEach(function (k) { if (keys.indexOf(k) === -1) keys.push(k); });

  var result = {};
  keys.forEach(function (k) {
    var inBase = Object.prototype.hasOwnProperty.call(base, k);
    var inClient = Object.prototype.hasOwnProperty.call(client, k);
    var inCurrent = Object.prototype.hasOwnProperty.call(current, k);

    if (!inClient && !inCurrent) return;
    if (inBase && !inClient && inCurrent) {
      if (!deepEqual(current[k], base[k])) result[k] = current[k];
      return;
    }
    if (inBase && inClient && !inCurrent) {
      if (!deepEqual(client[k], base[k])) result[k] = client[k];
      return;
    }
    if (!inBase && inClient && !inCurrent) { result[k] = client[k]; return; }
    if (!inBase && !inClient && inCurrent) { result[k] = current[k]; return; }
    result[k] = merge3(base[k], client[k], current[k]);
  });
  return result;
}

module.exports = { merge3: merge3, deepEqual: deepEqual };
