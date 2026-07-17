// Crea un usuario. Uso:
//   node create-user.js <username> <password> "<nombre completo>" <admin|comercial>
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const [, , username, password, nombre, role] = process.argv;
if (!username || !password || !nombre || !['admin', 'comercial'].includes(role)) {
  console.error('Uso: node create-user.js <username> <password> "<nombre completo>" <admin|comercial>');
  process.exit(1);
}

const db = new DatabaseSync(path.join(__dirname, 'data', 'app.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    nombre TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','comercial')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

if (db.prepare('SELECT id FROM users WHERE username = ?').get(username)) {
  console.error(`El usuario "${username}" ya existe.`);
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(password, salt, 64).toString('hex');
const id = crypto.randomUUID();

db.prepare('INSERT INTO users (id, username, password_hash, salt, nombre, role) VALUES (?, ?, ?, ?, ?, ?)')
  .run(id, username, hash, salt, nombre, role);

console.log(`✅ Usuario creado: ${username} (${role}) — ${nombre}`);
