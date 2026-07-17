// Migración única (e idempotente): mueve el JSON embebido en el HTML original
// (que index.html ya no tiene — se vació al pasar a BD) a la BD, bajo la clave
// 'zymo-db' — exactamente la misma clave que usaba localStorage.
// No transforma nada, es un lift-and-shift literal. Se puede correr las veces
// que haga falta: si 'zymo-db' ya existe, no hace nada (exit 0).
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const SOURCE_HTML = path.join(__dirname, '..', 'HTML ULTIMA VERSION', 'seguimiento-zymo-v6 (89).html');

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
  console.log('"zymo-db" ya existe en la BD (version ' + existing.version + ') — nada que sembrar.');
  process.exit(0);
}

if (!fs.existsSync(SOURCE_HTML)) {
  console.error('No se encontró el HTML fuente en: ' + SOURCE_HTML);
  process.exit(1);
}
const lines = fs.readFileSync(SOURCE_HTML, 'utf8').split('\n');
const startMarker = lines.findIndex((l) => l.includes('id="zymo-backup-data"'));
if (startMarker === -1) {
  console.error('No se encontró el bloque zymo-backup-data en el HTML fuente.');
  process.exit(1);
}
const jsonLine = lines[startMarker + 1];
const parsed = JSON.parse(jsonLine); // valida que sea JSON correcto antes de tocar nada

db.prepare(`
  INSERT INTO storage (key, value, version, updated_at) VALUES (?, ?, 1, datetime('now'))
`).run('zymo-db', JSON.stringify(parsed));

console.log('✅ Sembrado "zymo-db" en la BD.');
console.log('   Registros:', (parsed.records || []).length);
console.log('   Cotizaciones:', (parsed.cotizaciones || []).length);
