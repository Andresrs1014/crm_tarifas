// Backend mínimo: reemplaza localStorage por persistencia real, sin tocar la app original.
// Almacén genérico clave-valor (mismo contrato que Storage: getItem/setItem/removeItem/key/length)
// + login con contraseña compartida + chequeo de versión para no pisar cambios concurrentes.
const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('node:crypto');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { merge3 } = require('./merge');

const PORT = process.env.PORT || 3010;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h

if (!process.env.SESSION_SECRET) {
  console.warn('SESSION_SECRET no definido — se generó uno aleatorio para esta ejecución (las sesiones no sobreviven un reinicio).');
}

// ---------- DB ----------
const db = new DatabaseSync(path.join(__dirname, 'data', 'app.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS storage (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    nombre TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','comercial')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS storage_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    version INTEGER NOT NULL,
    saved_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_storage_history_key ON storage_history(key, id);
`);

// Cuántas versiones viejas se conservan por clave antes de podar las más
// antiguas -- sin esto storage_history crece sin límite (cada guardado del
// blob completo pesa unos MB) y se come el disco con el tiempo.
const HISTORY_KEEP = Number(process.env.STORAGE_HISTORY_KEEP) || 50;

// ---------- Contraseñas (scrypt nativo — sin dependencias externas) ----------
function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}
function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
}

// ---------- Auth (cookie firmada con el id de usuario, sin sesión en servidor) ----------
function sign(payload) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}
function makeToken(userId) {
  const payload = `${userId}|${Date.now() + SESSION_TTL_MS}`;
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
}
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;
  let payload;
  try { payload = Buffer.from(encoded, 'base64url').toString('utf8'); } catch { return null; }
  if (sign(payload) !== sig) return null;
  const [userId, expStr] = payload.split('|');
  if (!userId || Number(expStr) <= Date.now()) return null;
  return userId;
}
function requireAuth(req, res, next) {
  const userId = verifyToken(req.cookies?.zymo_session);
  if (!userId) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  const user = db.prepare('SELECT id, username, nombre, role FROM users WHERE id = ?').get(userId);
  if (!user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  req.user = user;
  next();
}
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Solo un administrador puede hacer esto' });
    return;
  }
  next();
}

// ---------- App ----------
const app = express();
app.use(express.json({ limit: '20mb' })); // el blob completo puede pesar varios MB
app.use(cookieParser());

// Marca de versión del build (escrita por el Dockerfile en cada rebuild real).
// Sin auth a propósito -- el bridge del cliente la revisa antes de saber si
// hay sesión, y de todas formas no expone nada sensible, solo un timestamp.
let BUILD_VERSION = 'dev';
try {
  BUILD_VERSION = require('node:fs').readFileSync(path.join(__dirname, 'BUILD_VERSION'), 'utf8').trim();
} catch (e) {
  console.warn('BUILD_VERSION no encontrado (normal en desarrollo local, fuera de Docker).');
}
app.get('/api/app-version', (_req, res) => res.json({ version: BUILD_VERSION }));

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username || '');
  if (!user || !verifyPassword(password || '', user.salt, user.password_hash)) {
    res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    return;
  }
  res.cookie('zymo_session', makeToken(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS,
  });
  res.json({ ok: true, user: { id: user.id, username: user.username, nombre: user.nombre, role: user.role } });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('zymo_session');
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const userId = verifyToken(req.cookies?.zymo_session);
  const user = userId ? db.prepare('SELECT id, username, nombre, role FROM users WHERE id = ?').get(userId) : null;
  res.json({ authenticated: !!user, user: user || null });
});

// ---------- Gestión de usuarios (solo admin) ----------
app.get('/api/users', requireAuth, requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT id, username, nombre, role, created_at FROM users ORDER BY created_at').all());
});

app.post('/api/users', requireAuth, requireAdmin, (req, res) => {
  const { username, password, nombre, role } = req.body || {};
  if (!username || !password || !nombre || !['admin', 'comercial'].includes(role)) {
    res.status(400).json({ error: 'Faltan campos: username, password, nombre, role (admin|comercial)' });
    return;
  }
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    res.status(409).json({ error: 'Ese usuario ya existe' });
    return;
  }
  const { hash, salt } = hashPassword(password);
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO users (id, username, password_hash, salt, nombre, role) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, username, hash, salt, nombre, role);
  res.status(201).json({ id, username, nombre, role });
});

app.delete('/api/users/:id', requireAuth, requireAdmin, (req, res) => {
  if (req.params.id === req.user.id) {
    res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    return;
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Link público de cotización (SIN auth — para clientes externos) ----------
// Antes de tener BD compartida, este link solo funcionaba en el mismo navegador que
// creó la cotización (localStorage aislado por usuario) — el propio HTML original lo
// admitía así ("Este link solo funciona en el dispositivo donde fue creada..."). Ahora
// que los datos son compartidos, expone SOLO la cotización pedida, nunca el resto de
// la base — ni las demás cotizaciones, ni la Biblioteca completa, ni otros comerciales.
function normalizarNumeroCot(raw) {
  return String(raw || '').replace(/^(COT)(\d+)$/i, 'COT-$2');
}
app.get('/api/public/cotizacion/:numero', (req, res) => {
  const row = db.prepare('SELECT value FROM storage WHERE key = ?').get('zymo-db');
  if (!row) { res.json({ cotizacion: null }); return; }
  const zdb = JSON.parse(row.value);
  const raw = req.params.numero;
  const normalized = normalizarNumeroCot(raw);
  const cot = (zdb.cotizaciones || []).find((c) =>
    String(c.numero || '').replace(/-/g, '').toUpperCase() === String(raw).toUpperCase() ||
    c.numero === normalized ||
    c.id === raw);
  if (!cot) { res.json({ cotizacion: null }); return; }

  const biblioteca = {};
  for (const linea of cot.lineas || []) {
    if (zdb.biblioteca?.[linea]) biblioteca[linea] = zdb.biblioteca[linea];
  }

  const tarifasEspeciales = {};
  for (const linea of cot.lineas || []) {
    if (cot.tarifaTipo?.[linea] !== 'especial') continue;
    const teId = cot.tarifaEspecialId?.[linea];
    if (!teId) continue;
    const keys = linea === 'Paqueteo'
      ? ['Paqueteo-COORDINADORA', 'Paqueteo-TCC', 'Paqueteo-SERVIENTREGA', 'Paqueteo']
      : [linea];
    for (const key of keys) {
      const te = (zdb.tarifasEspeciales?.[key] || []).find((t) => t.id === teId);
      if (te) { tarifasEspeciales[key] = [te]; break; }
    }
  }

  const comercial = (zdb.comerciales || []).find((c) => c.id === cot.comercialId);

  res.json({
    cotizacion: cot,
    biblioteca,
    tarifasEspeciales,
    comerciales: comercial ? [comercial] : [],
  });
});

// Trae TODAS las claves de una — hidratación inicial del bridge de localStorage.
app.get('/api/storage', requireAuth, (_req, res) => {
  const rows = db.prepare('SELECT key, value, version FROM storage').all();
  const out = {};
  for (const row of rows) {
    out[row.key] = { value: JSON.parse(row.value), version: row.version };
  }
  res.json(out);
});

app.put('/api/storage/:key', requireAuth, (req, res) => {
  const { key } = req.params;
  const { value, expectedVersion } = req.body || {};
  if (value === undefined) {
    res.status(400).json({ error: 'Falta "value" en el body' });
    return;
  }

  const current = db.prepare('SELECT value, version FROM storage WHERE key = ?').get(key);

  // Si la clave ya existe, exigir expectedVersion siempre — sin esto, un cliente
  // que por cualquier razón mande null/undefined pisaba la clave a ciegas sin
  // pasar por el chequeo de conflicto de abajo.
  if (current && (expectedVersion === undefined || expectedVersion === null)) {
    res.status(400).json({ error: 'Falta "expectedVersion" — la clave ya existe, no se puede guardar a ciegas.' });
    return;
  }

  // Chequeo de versión: si alguien más guardó desde que este cliente cargó su
  // copia, antes esto rechazaba directo con 409 y el cliente reintentaba con
  // SU blob completo, pisando lo que el otro usuario hubiera agregado
  // mientras tanto (aunque fuera algo sin relación, ej. un cliente nuevo vs
  // una cotización nueva). Ahora, si todavía existe en storage_history la
  // versión exacta de la que partió este cliente (la "base" común), se
  // intenta fusionar por id/clave en vez de rechazar -- ver merge.js para el
  // porqué y el único caso límite real que queda (mismo campo del mismo
  // registro editado distinto por los dos: gana lo que ya está en vivo, pero
  // el resto del registro y todo lo demás no se pierde).
  let valueToSave = value;
  let mergedFromConflict = false;
  if (current && expectedVersion !== undefined && expectedVersion !== null && current.version !== expectedVersion) {
    const baseRow = db.prepare('SELECT value FROM storage_history WHERE key = ? AND version = ?').get(key, expectedVersion);
    if (!baseRow) {
      // Sin base común (se podó del historial, o expectedVersion nunca fue
      // una versión real) no hay con qué fusionar de forma segura -- cae al
      // rechazo de siempre, el cliente reintenta con la versión fresca.
      console.warn(`[storage] CONFLICTO_VERSION (sin base para fusionar) key=${key} user=${req.user.username} expectedVersion=${expectedVersion} currentVersion=${current.version} at=${new Date().toISOString()}`);
      res.status(409).json({
        error: 'CONFLICTO_VERSION',
        message: 'Alguien más guardó cambios en esta clave. Recarga antes de continuar.',
        currentVersion: current.version,
      });
      return;
    }
    try {
      valueToSave = merge3(JSON.parse(baseRow.value), value, JSON.parse(current.value));
      mergedFromConflict = true;
      console.warn(`[storage] FUSIONADO key=${key} user=${req.user.username} expectedVersion=${expectedVersion} currentVersion=${current.version} at=${new Date().toISOString()}`);
    } catch (e) {
      console.error(`[storage] Error fusionando key=${key}, cae a rechazo:`, e);
      res.status(409).json({
        error: 'CONFLICTO_VERSION',
        message: 'Alguien más guardó cambios en esta clave. Recarga antes de continuar.',
        currentVersion: current.version,
      });
      return;
    }
  }

  const newVersion = (current?.version ?? 0) + 1;
  const json = JSON.stringify(valueToSave);

  // Respaldo: antes de pisar la versión anterior, la guarda en storage_history
  // -- "en vez de borrar las cosas, respaldarlas" (nada se pierde de verdad,
  // incluso si dos usuarios se pisan el blob completo entre sí). Solo hay algo
  // que respaldar si ya existía una versión previa (current) -- una clave
  // nueva no reemplaza nada.
  if (current) {
    db.prepare('INSERT INTO storage_history (key, value, version, saved_by) VALUES (?, ?, ?, ?)')
      .run(key, current.value, current.version, req.user.username);
    // Poda lo más viejo -- sin esto storage_history crece sin límite.
    db.prepare(`
      DELETE FROM storage_history WHERE key = ? AND id NOT IN (
        SELECT id FROM storage_history WHERE key = ? ORDER BY id DESC LIMIT ?
      )
    `).run(key, key, HISTORY_KEEP);
  }

  db.prepare(`
    INSERT INTO storage (key, value, version, updated_at) VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, version = excluded.version, updated_at = excluded.updated_at
  `).run(key, json, newVersion);

  console.log(`[storage] guardado key=${key} user=${req.user.username} version=${newVersion} bytes=${json.length}${mergedFromConflict ? ' (fusionado)' : ''} at=${new Date().toISOString()}`);
  // Si se fusionó, lo que quedó guardado puede tener cosas que este cliente
  // todavía no tenía en su copia (lo que agregó el otro usuario) -- se lo
  // manda de vuelta para que el bridge actualice su caché ya mismo, en vez
  // de que la pestaña se quede "atrasada" hasta el próximo aviso de
  // sincronización de los 20s.
  const responseBody = { ok: true, version: newVersion };
  if (mergedFromConflict) {
    responseBody.merged = true;
    responseBody.value = valueToSave;
  }
  res.json(responseBody);
});

app.delete('/api/storage/:key', requireAuth, (req, res) => {
  const { key } = req.params;
  console.warn(`[storage] BORRADO key=${key} user=${req.user.username} at=${new Date().toISOString()}`);
  // Mismo criterio que el guardado: respaldar antes de borrar, no perderlo.
  const current = db.prepare('SELECT value, version FROM storage WHERE key = ?').get(key);
  if (current) {
    db.prepare('INSERT INTO storage_history (key, value, version, saved_by) VALUES (?, ?, ?, ?)')
      .run(key, current.value, current.version, req.user.username);
  }
  db.prepare('DELETE FROM storage WHERE key = ?').run(key);
  res.json({ ok: true });
});

// ---------- Historial de versiones + restauración (solo admin) ----------
// Lista liviana: NO trae el value completo (puede pesar varios MB por fila),
// solo lo necesario para elegir cuál restaurar.
app.get('/api/storage/:key/history', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare(
    'SELECT id, version, saved_by, created_at, length(value) AS bytes FROM storage_history WHERE key = ? ORDER BY id DESC'
  ).all(req.params.key);
  res.json(rows);
});

app.post('/api/storage/:key/restore/:historyId', requireAuth, requireAdmin, (req, res) => {
  const { key, historyId } = req.params;
  const snapshot = db.prepare('SELECT value, version FROM storage_history WHERE id = ? AND key = ?').get(historyId, key);
  if (!snapshot) {
    res.status(404).json({ error: 'Esa versión del historial no existe.' });
    return;
  }
  // Restaurar es en sí mismo un guardado más -- pasa por el mismo camino de
  // respaldo de arriba (lo que había justo antes de restaurar también queda
  // en el historial, por si la restauración fue un error).
  const current = db.prepare('SELECT value, version FROM storage WHERE key = ?').get(key);
  if (current) {
    db.prepare('INSERT INTO storage_history (key, value, version, saved_by) VALUES (?, ?, ?, ?)')
      .run(key, current.value, current.version, req.user.username);
    db.prepare(`
      DELETE FROM storage_history WHERE key = ? AND id NOT IN (
        SELECT id FROM storage_history WHERE key = ? ORDER BY id DESC LIMIT ?
      )
    `).run(key, key, HISTORY_KEEP);
  }
  const newVersion = (current?.version ?? 0) + 1;
  db.prepare(`
    INSERT INTO storage (key, value, version, updated_at) VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, version = excluded.version, updated_at = excluded.updated_at
  `).run(key, snapshot.value, newVersion);

  console.warn(`[storage] RESTAURADO key=${key} desde historyId=${historyId} (version original ${snapshot.version}) user=${req.user.username} -> nueva version=${newVersion} at=${new Date().toISOString()}`);
  res.json({ ok: true, version: newVersion });
});

// ---------- Estáticos: sirve index.html + css/ + js/ desde la raíz del proyecto ----------
const ROOT = path.join(__dirname, '..');
app.use(express.static(ROOT));
app.get('/', (_req, res) => res.sendFile(path.join(ROOT, 'index.html')));

// ---------- Bootstrap: crea el primer admin si la tabla users está vacía ----------
// Solo corre en el primer arranque contra una BD nueva — si ya hay usuarios, no hace nada.
(function bootstrapAdmin() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (count > 0) return;
  const { BOOTSTRAP_ADMIN_USERNAME, BOOTSTRAP_ADMIN_PASSWORD, BOOTSTRAP_ADMIN_NOMBRE } = process.env;
  if (!BOOTSTRAP_ADMIN_USERNAME || !BOOTSTRAP_ADMIN_PASSWORD) {
    console.warn('No hay usuarios en la BD y no hay BOOTSTRAP_ADMIN_USERNAME/PASSWORD en el entorno — nadie va a poder iniciar sesión. Define esas variables o crea uno con create-user.js.');
    return;
  }
  const { hash, salt } = hashPassword(BOOTSTRAP_ADMIN_PASSWORD);
  db.prepare('INSERT INTO users (id, username, password_hash, salt, nombre, role) VALUES (?, ?, ?, ?, ?, ?)')
    .run(crypto.randomUUID(), BOOTSTRAP_ADMIN_USERNAME, hash, salt, BOOTSTRAP_ADMIN_NOMBRE || BOOTSTRAP_ADMIN_USERNAME, 'admin');
  console.log(`✅ Admin inicial creado: ${BOOTSTRAP_ADMIN_USERNAME}`);
})();

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
