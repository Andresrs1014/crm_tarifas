// Migración única: mueve el JSON embebido en index.html (línea 1235, id=zymo-backup-data)
// a la BD, bajo la clave 'zymo-db' — exactamente la misma clave que usaba localStorage.
// No transforma nada, es un lift-and-shift literal.
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const INDEX_HTML = path.join(__dirname, '..', 'index.html');
const lines = fs.readFileSync(INDEX_HTML, 'utf8').split('\n');

const startMarker = lines.findIndex((l) => l.includes('id="zymo-backup-data"'));
if (startMarker === -1) {
  console.error('No se encontró el bloque zymo-backup-data en index.html — ¿ya se migró?');
  process.exit(1);
}
const jsonLine = lines[startMarker + 1];
const parsed = JSON.parse(jsonLine); // valida que sea JSON correcto antes de tocar nada

const db = new DatabaseSync(path.join(__dirname, 'data', 'app.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS storage (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const existing = db.prepare('SELECT version FROM storage WHERE key = ?').get('zymo-db');
if (existing) {
  console.error('La clave "zymo-db" ya existe en la BD (version ' + existing.version + ') — no se sobrescribe. Bórrala a mano si de verdad quieres re-sembrar.');
  process.exit(1);
}

db.prepare(`
  INSERT INTO storage (key, value, version, updated_at) VALUES (?, ?, 1, datetime('now'))
`).run('zymo-db', JSON.stringify(parsed));

console.log('✅ Sembrado "zymo-db" en la BD.');
console.log('   Registros:', (parsed.records || []).length);
console.log('   Cotizaciones:', (parsed.cotizaciones || []).length);
