// Self-check de merge.js -- node backend/merge.selfcheck.js
// Sin framework de test (convención del repo: assert + node directo para
// lógica con riesgo real). Cubre los casos que motivaron esto: 2 personas
// agregando cosas DISTINTAS no se pisan, editar vs borrar no pierde la
// edición, y el caso límite documentado (mismo campo, mismo id, ambos lados
// cambiado) sigue resolviendo a "gana el que ya está en el servidor" sin
// tronar.
'use strict';
const assert = require('node:assert');
const { merge3, deepEqual } = require('./merge');

// 1. Dos personas agregan registros DISTINTOS casi a la vez -- ninguno se pisa.
(function testAdicionesDistintas() {
  const base = { records: [{ id: '1', empresa: 'A' }] };
  const client = { records: [{ id: '1', empresa: 'A' }, { id: '2', empresa: 'Nuevo de A' }] };
  const current = { records: [{ id: '1', empresa: 'A' }, { id: '3', empresa: 'Nuevo de B' }] };
  const merged = merge3(base, client, current);
  const ids = merged.records.map((r) => r.id).sort();
  assert.deepStrictEqual(ids, ['1', '2', '3'], 'deben quedar los 3 registros, ninguno se pierde');
})();

// 2. Los dos editan el MISMO registro, pero campos DISTINTOS -- se combinan.
(function testEdicionesDeCamposDistintos() {
  const base = { records: [{ id: '1', empresa: 'A', tel: '000' }] };
  const client = { records: [{ id: '1', empresa: 'A editado por cliente', tel: '000' }] };
  const current = { records: [{ id: '1', empresa: 'A', tel: '111 editado por servidor' }] };
  const merged = merge3(base, client, current);
  assert.strictEqual(merged.records[0].empresa, 'A editado por cliente', 'el campo que solo cambió el cliente debe quedar del cliente');
  assert.strictEqual(merged.records[0].tel, '111 editado por servidor', 'el campo que solo cambió el servidor debe quedar del servidor');
})();

// 3. Mismo id, MISMO campo, cambiado distinto por los dos -- gana el servidor
//    (documentado como el único caso límite real), sin perder el resto del registro.
(function testConflictoRealMismoCampo() {
  const base = { records: [{ id: '1', empresa: 'A' }] };
  const client = { records: [{ id: '1', empresa: 'Version del cliente' }] };
  const current = { records: [{ id: '1', empresa: 'Version del servidor' }] };
  const merged = merge3(base, client, current);
  assert.strictEqual(merged.records[0].empresa, 'Version del servidor', 'en conflicto real, gana la version ya guardada');
})();

// 4. Un lado edita, el otro borra -- la edición NO se pierde con el borrado.
(function testEdicionVsBorrado() {
  const base = { records: [{ id: '1', empresa: 'A' }, { id: '2', empresa: 'B' }] };
  const client = { records: [{ id: '1', empresa: 'A editado' }, { id: '2', empresa: 'B' }] }; // cliente editó 1
  const current = { records: [{ id: '2', empresa: 'B' }] }; // servidor borró 1
  const merged = merge3(base, client, current);
  const uno = merged.records.find((r) => r.id === '1');
  assert.ok(uno, 'el registro editado no debe desaparecer solo porque el otro lado lo borró');
  assert.strictEqual(uno.empresa, 'A editado');
})();

// 5. Los dos lo borran -- de verdad desaparece.
(function testBorradoPorAmbos() {
  const base = { records: [{ id: '1', empresa: 'A' }] };
  const client = { records: [] };
  const current = { records: [] };
  const merged = merge3(base, client, current);
  assert.strictEqual(merged.records.length, 0);
})();

// 6. Contador (cotNumero) -- toma el mayor de los dos, no se retrocede.
(function testContador() {
  const base = { cotNumero: 100 };
  const client = { cotNumero: 102 };
  const current = { cotNumero: 105 };
  const merged = merge3(base, client, current);
  assert.strictEqual(merged.cotNumero, 105, 'el contador nunca debe retroceder');
})();

// 7. Objeto por clave (tipo "biblioteca") -- se combina igual que los arreglos por id.
(function testObjetoPorClave() {
  const base = { biblioteca: { Transporte: { a: 1 } } };
  const client = { biblioteca: { Transporte: { a: 1 }, Paqueteo: { nuevo: true } } };
  const current = { biblioteca: { Transporte: { a: 1 }, Aduana: { nuevo: true } } };
  const merged = merge3(base, client, current);
  assert.deepStrictEqual(Object.keys(merged.biblioteca).sort(), ['Aduana', 'Paqueteo', 'Transporte']);
})();

// 8. Nada cambió en ninguno de los dos lados -- resultado idéntico a la base (no inventa nada).
(function testSinCambios() {
  const base = { records: [{ id: '1', empresa: 'A' }], cotNumero: 5 };
  const merged = merge3(base, base, base);
  assert.ok(deepEqual(merged, base), 'sin cambios reales, la fusión no debe alterar nada');
})();

console.log('✅ merge.selfcheck.js -- 8/8 casos OK');
