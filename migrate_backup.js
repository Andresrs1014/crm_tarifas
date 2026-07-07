/**
 * migrate_backup.js
 * Carga un backup de ZYMO (localStorage del HTML v6) a la base de datos PostgreSQL del CRM.
 *
 * IDEMPOTENTE: se puede correr varias veces sin duplicar nada. Antes de crear cada
 * fila se busca si ya existe (por llave natural: nombre/email/nit/numero según la
 * entidad) y se reutiliza. La versión anterior de este script creaba sin verificar
 * en varias tablas (records, contactos, actividades, analistas, items de biblioteca),
 * por eso una corrida repetida triplicaba los datos.
 *
 * Ejecución (desde el host, junto al docker-compose.yml):
 *   docker cp "docs/backup_zymo_2026-06-10 (1).json" crm_backend:/app/backup.json
 *   docker cp migrate_backup.js crm_backend:/app/migrate_backup.js
 *   docker exec crm_backend node migrate_backup.js
 *
 * Si ya corriste el script viejo y los datos quedaron triplicados, limpia primero:
 *   ./scripts/reset-data.sh
 * (borra todo menos la tabla de usuarios) y luego corre este script una sola vez.
 *
 * Simplificación deliberada: para cotizaciones históricas NO se reconstruye el modo
 * "Tarifa Especial" por línea (tarifaTipoPorLinea/tarifaEspecialGrupos quedan vacíos).
 * El backup viejo guardaba esos grupos con ids "esp_..." que no calzan con los ids
 * reales de itemsSnapshot de esa misma cotización — reconstruirlo literalmente
 * dejaría esas líneas sin ítems. Los ítems sí se migran tal cual (itemsSnapshot),
 * y el renderer ya tiene un fallback por nombre/patrón para bloques legacy sin id
 * de grupo real (ver resolveGrupoSnapshotItems en snapshot.ts).
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

// ─── Carga del backup ────────────────────────────────────────────────────────
const BACKUP_PATH = path.join(__dirname, 'backup.json');
if (!fs.existsSync(BACKUP_PATH)) {
  console.error('❌  No se encontró backup.json en /app/backup.json');
  process.exit(1);
}
const backup = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf8'));

// Mapa de IDs antiguos → nuevos UUIDs (se llena durante la migración)
const idMap = {
  comerciales: {}, // oldId → newUUID
  records: {},     // oldId → newUUID
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function safeInt(val) {
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

/** vigencia legacy: puede ser "30" (días desde fecha) o ya una fecha ISO. */
function resolveVigencia(fechaBase, vigenciaRaw) {
  if (!vigenciaRaw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(String(vigenciaRaw))) return parseDate(vigenciaRaw);
  const dias = parseInt(vigenciaRaw, 10);
  if (isNaN(dias)) return null;
  const base = fechaBase ? new Date(fechaBase) : new Date();
  base.setDate(base.getDate() + dias);
  return base;
}

// ─── 1. COMERCIALES ──────────────────────────────────────────────────────────
// Busca por email o nombre antes de crear — reutiliza si ya existe.
async function migrateComerciales() {
  console.log('\n📦  migrateComerciales...');
  const rows = backup.comerciales || [];
  let reutilizados = 0;
  let creados = 0;

  const existentes = await prisma.comercial.findMany();

  for (const c of rows) {
    const match = existentes.find(e =>
      (c.email && e.email && e.email.toLowerCase() === c.email.toLowerCase()) ||
      e.nombre.toLowerCase() === (c.nombre || '').toLowerCase()
    );

    if (match) {
      idMap.comerciales[c.id] = match.id;
      reutilizados++;
    } else {
      const newId = randomUUID();
      idMap.comerciales[c.id] = newId;
      const created = await prisma.comercial.create({
        data: {
          id: newId,
          nombre: c.nombre || 'Sin nombre',
          cargo: c.cargo || null,
          email: c.email || null,
          tel: c.tel || null,
          activo: true,
        },
      });
      existentes.push(created);
      creados++;
    }
  }

  console.log(`  Reutilizados: ${reutilizados}, Creados nuevos: ${creados}`);
}

// ─── 2. ANALISTAS ─────────────────────────────────────────────────────────────
// Fix: el script viejo hacía upsert por un UUID recién generado (nunca coincidía
// con nada existente), así que siempre creaba. Ahora busca por email/nombre.
async function migrateAnalistas() {
  console.log('\n📦  migrateAnalistas...');
  const rows = backup.analistas || [];
  let creados = 0;
  let reutilizados = 0;

  const existentes = await prisma.analista.findMany();

  for (const a of rows) {
    const match = existentes.find(e =>
      (a.email && e.email && e.email.toLowerCase() === a.email.toLowerCase()) ||
      e.nombre.toLowerCase() === (a.nombre || '').toLowerCase()
    );

    if (match) {
      reutilizados++;
      continue;
    }

    const created = await prisma.analista.create({
      data: {
        nombre: a.nombre || 'Sin nombre',
        email: a.email || null,
        tel: a.tel || null,
      },
    });
    existentes.push(created);
    creados++;
  }

  console.log(`  Reutilizados: ${reutilizados}, Creados nuevos: ${creados}`);
}

// ─── 3. BIBLIOTECA ───────────────────────────────────────────────────────────
// Fix: items y observaciones ahora se buscan antes de crear (el script viejo los
// creaba siempre sin condición → triplicados en cada corrida repetida).
async function migrateBiblioteca() {
  console.log('\n📦  migrateBiblioteca...');
  const bib = backup.biblioteca || {};
  const lineas = Object.keys(bib);
  let totalItemsCreados = 0;
  let totalItemsReutilizados = 0;

  for (let orden = 0; orden < lineas.length; orden++) {
    const nombre = lineas[orden];
    const lineaData = bib[nombre];
    const columnas = lineaData.columnas || lineaData.colHeaders || [];

    const linea = await prisma.bibliotecaLinea.upsert({
      where: { nombre },
      update: { columnas, orden },
      create: { nombre, columnas, orden },
    });

    console.log(`  Línea: ${nombre}`);

    const grupos = lineaData.grupos || [];
    for (let gi = 0; gi < grupos.length; gi++) {
      const g = grupos[gi];

      let grupo = await prisma.bibliotecaGrupo.findFirst({
        where: { lineaId: linea.id, nombre: g.nombre },
      });

      if (!grupo) {
        grupo = await prisma.bibliotecaGrupo.create({
          data: {
            lineaId: linea.id,
            nombre: g.nombre || `Grupo ${gi + 1}`,
            orden: gi,
          },
        });
      }

      const items = g.items || [];
      for (let ii = 0; ii < items.length; ii++) {
        const item = items[ii];

        const existingItem = await prisma.bibliotecaItem.findFirst({
          where: { grupoId: grupo.id, nombre: item.nombre || 'Sin nombre' },
        });
        if (existingItem) {
          totalItemsReutilizados++;
          continue;
        }

        const extraCols = {};
        const knownKeys = ['id', 'nombre', 'tarifa', 'tipoTarifa', 'obs', 'sel'];
        for (const [k, v] of Object.entries(item)) {
          if (!knownKeys.includes(k)) extraCols[k] = v;
        }

        await prisma.bibliotecaItem.create({
          data: {
            grupoId: grupo.id,
            nombre: item.nombre || 'Sin nombre',
            tarifa: String(item.tarifa || '0'),
            tipoTarifa: item.tipoTarifa || 'moneda',
            obs: item.obs || null,
            extraCols,
            orden: ii,
          },
        });
        totalItemsCreados++;
      }
    }

    const observaciones = lineaData.observaciones || [];
    for (const obs of observaciones) {
      if (!obs.html) continue;
      const existingObs = await prisma.bibliotecaObs.findFirst({
        where: { lineaId: linea.id, nombre: obs.nombre || nombre },
      });
      if (existingObs) continue;

      await prisma.bibliotecaObs.create({
        data: {
          lineaId: linea.id,
          nombre: obs.nombre || nombre,
          html: obs.html,
        },
      });
    }
  }

  console.log(`  Items creados: ${totalItemsCreados}, reutilizados: ${totalItemsReutilizados}`);
}

// ─── 4. TARIFAS ESPECIALES (biblioteca reutilizable) ─────────────────────────
async function migrateTarifasEspeciales() {
  console.log('\n📦  migrateTarifasEspeciales...');
  const tarifas = backup.tarifasEspeciales || {};
  let creadas = 0;
  let reutilizadas = 0;

  for (const [espKey, list] of Object.entries(tarifas)) {
    for (const te of Array.isArray(list) ? list : []) {
      const existing = await prisma.tarifaEspecial.findFirst({
        where: { espKey, nombre: te.nombre || 'Sin nombre' },
      });
      if (existing) {
        reutilizadas++;
        continue;
      }

      await prisma.tarifaEspecial.create({
        data: {
          espKey,
          svc: te.svc || espKey,
          nombre: te.nombre || 'Sin nombre',
          grupos: te.grupos || [],
        },
      });
      creadas++;
    }
  }

  console.log(`  Creadas: ${creadas}, ya existían: ${reutilizadas}`);
}

// ─── 5. CONTADOR DE COTIZACIONES ─────────────────────────────────────────────
async function migrateCotNumero() {
  console.log('\n📦  migrateCotNumero...');
  const valor = backup.cotNumero || 0;

  const existing = await prisma.cotNumeroCounter.findFirst();
  if (existing) {
    if (valor > existing.valor) {
      await prisma.cotNumeroCounter.update({ where: { id: existing.id }, data: { valor } });
      console.log(`  Actualizado a: ${valor}`);
    } else {
      console.log(`  Sin cambios (actual ${existing.valor} >= backup ${valor})`);
    }
  } else {
    await prisma.cotNumeroCounter.create({ data: { valor } });
    console.log(`  Creado con valor: ${valor}`);
  }
}

// ─── 6. RECORDS (incluye contactos, actividades, CRM meta y ficha cliente) ──
// Fix: antes se creaba un Record nuevo siempre, con nuevos contactos/actividades
// cada vez. Ahora se busca por (empresa + nit); si ya existe se reutiliza su id
// y NO se reinsertan contactos/actividades (para no duplicarlos en una segunda
// corrida).
async function migrateRecords() {
  console.log('\n📦  migrateRecords...');
  const rows = backup.records || [];
  let creados = 0;
  let reutilizados = 0;
  let saltados = 0;
  let totalContactos = 0;
  let totalActividades = 0;

  const existentes = await prisma.record.findMany({ select: { id: true, empresa: true, nit: true } });

  for (const r of rows) {
    const comercialId = idMap.comerciales[r.comercialId];
    if (!comercialId) {
      console.warn(`  ⚠  Record ${r.empresa}: comercialId ${r.comercialId} no encontrado — saltando`);
      saltados++;
      continue;
    }

    const match = existentes.find(e =>
      e.empresa.toLowerCase() === (r.empresa || '').toLowerCase() &&
      (e.nit || '') === (r.nit || ''),
    );

    if (match) {
      idMap.records[r.id] = match.id;
      reutilizados++;
      continue;
    }

    const newId = randomUUID();
    idMap.records[r.id] = newId;

    await prisma.record.create({
      data: {
        id: newId,
        tipo: r.tipo || 'prospecto',
        empresa: r.empresa || 'Sin nombre',
        nit: r.nit || null,
        ciudad: r.ciudad || null,
        direccion: r.direccion || null,
        categoria: r.categoria || null,
        comercialId,
        tipoCliente: r.tipoCliente || 'directo',
        clienteIndirectoId: r.clienteIndirectoId || null,
        comision: r.comision || null,
        fecha: parseDate(r.fecha) || new Date(),
        proximoSeguimiento: parseDate(r.proximoSeguimiento),
        observaciones: r.observaciones || null,
        estadoProspecto: r.estadoProspecto || null,
        estadoCliente: r.estadoCliente || null,
        visita: r.visita || null,
        visitaCliente: r.visitaCliente || null,
        fechaVisita: parseDate(r.fechaVisita),
        fechaVisitaCliente: parseDate(r.fechaVisitaCliente),
        facturadoP: r.facturadoP || null,
        facturado: r.facturado || null,
        valorP: safeInt(r.valorP),
        valor: safeInt(r.valor),
        nuevoServicio: r.nuevoServicio || null,
        servicioNuevo: r.servicioNuevo || null,
        ingresosEsperados: safeInt(r.ingresosEsperados),
        servicios: r.servicios || [],
        facturacionLineas: r.facturacionLineas || {},
      },
    });
    existentes.push({ id: newId, empresa: r.empresa, nit: r.nit });
    creados++;

    const contactos = r.contactos || [];
    for (const c of contactos) {
      await prisma.contacto.create({
        data: {
          recordId: newId,
          nombre: c.nombre || 'Sin nombre',
          cargo: c.cargo || null,
          telefono: c.telefono || null,
          email: c.email || null,
          direccion: c.direccion || null,
          orden: c.orden || 0,
          cumpleanos: c.cumpleanos || null,
          recibeRegalos: c.recibeRegalos === true || c.recibeRegalos === 'si' || c.recibeRegalos === 'yes',
          tipo: c.tipoContacto || null,
          fotosEntrega: c.fotosEntrega || [],
        },
      });
      totalContactos++;
    }

    const actividades = r.actividades || [];
    for (const a of actividades) {
      const descripcion = a.descripcion || a.desc || a.nota || '';
      if (!descripcion && !a.tipo) continue;

      const tipo = a.tipo === 'visit' ? 'visita' : (a.tipo || 'seguimiento');

      await prisma.actividad.create({
        data: {
          recordId: newId,
          tipo,
          descripcion: descripcion || '(sin descripción)',
          fecha: parseDate(a.fecha) || new Date(),
          hecho: a.hecho !== undefined ? a.hecho : true,
        },
      });
      totalActividades++;
    }

    if (r.crmMeta) {
      await prisma.crmMeta.upsert({
        where: { recordId: newId },
        update: {},
        create: {
          recordId: newId,
          obs: r.crmMeta.obs || null,
          tiempos: r.crmMeta.tiempos || {},
        },
      });
    }

    if (r.fichaData) {
      await prisma.fichaCliente.upsert({
        where: { recordId: newId },
        update: {},
        create: { recordId: newId, data: r.fichaData },
      });
    }
  }

  console.log(`  Records creados: ${creados}, reutilizados: ${reutilizados}, saltados: ${saltados}`);
  console.log(`  Contactos: ${totalContactos}, Actividades: ${totalActividades}`);
}

// ─── 7. COTIZACIONES ─────────────────────────────────────────────────────────
async function migrateCotizaciones() {
  console.log('\n📦  migrateCotizaciones...');
  const rows = backup.cotizaciones || [];
  let created = 0;
  let skipped = 0;

  for (const c of rows) {
    const exists = await prisma.cotizacion.findUnique({ where: { numero: c.numero } });
    if (exists) {
      skipped++;
      continue;
    }

    const recordId = c.recordId ? idMap.records[c.recordId] || null : null;

    const comercialData = (backup.comerciales || []).find(cm => cm.id === c.comercialId);
    const comercialNombre = comercialData?.nombre || c.comercialNombre || 'Desconocido';

    const fecha = parseDate(c.fecha) || new Date();

    await prisma.cotizacion.create({
      data: {
        id: randomUUID(),
        numero: c.numero,
        recordId,
        empresa: c.empresa || 'Sin nombre',
        nit: c.nit || null,
        ciudad: c.ciudad || null,
        contacto: c.contacto || null,
        cargo: c.cargo || null,
        telefono: c.telefono || null,
        email: c.email || null,
        comercial: comercialNombre,
        paqueteadora: c.paqueteadora || null,
        estado: c.estado || 'borrador',
        fecha,
        vigencia: resolveVigencia(fecha, c.vigencia),
        asunto: c.asunto || null,
        lineas: c.lineas || [],
        itemsSnapshot: c.items || {},
        obsHtml: c.obsPlantillas || {},
        obsLibre: c.obsLibre || null,
      },
    });
    created++;
  }

  console.log(`  Creadas: ${created}, Saltadas (numero duplicado): ${skipped}`);
}

// ─── 8. GESTIÓN DOCUMENTAL ───────────────────────────────────────────────────
async function migrateGestionDocumental() {
  console.log('\n📦  migrateGestionDocumental...');
  const gd = backup.gestionDocumental || {};
  let created = 0;
  let skipped = 0;

  for (const [oldRecordId, gdData] of Object.entries(gd)) {
    const newRecordId = idMap.records[oldRecordId];
    if (!newRecordId) {
      skipped++;
      continue;
    }

    const rawDocs = gdData.docs || gdData;
    const docs = {};
    for (const [docId, docVal] of Object.entries(rawDocs)) {
      if (typeof docVal === 'object' && docVal !== null) {
        docs[docId] = {
          estado: docVal.estado || 'pendiente',
          obs: docVal.obs || '',
          fecha: docVal.fecha || '',
        };
      }
    }

    await prisma.gestionDocumental.upsert({
      where: { recordId: newRecordId },
      update: { docs },
      create: { recordId: newRecordId, docs },
    });
    created++;
  }

  console.log(`  Creadas/actualizadas: ${created}, Saltadas (record no migrado): ${skipped}`);
}

// ─── 9. MATRIZ DE RIESGOS ─────────────────────────────────────────────────────
async function migrateMatrizRiesgos() {
  console.log('\n📦  migrateMatrizRiesgos...');
  const mr = backup.matrizRiesgos || {};

  const mrData = backup.mrData || {};
  const mrFused = { ...mr };
  for (const [k, v] of Object.entries(mrData)) {
    if (!mrFused[k]) mrFused[k] = v;
    else mrFused[k] = { ...v, ...mrFused[k] };
  }

  let created = 0;
  let skipped = 0;

  for (const [oldRecordId, mrRow] of Object.entries(mrFused)) {
    const newRecordId = idMap.records[oldRecordId];
    if (!newRecordId) {
      skipped++;
      continue;
    }

    const puntaje = typeof mrRow.puntaje === 'number' ? mrRow.puntaje : 0;
    const riesgo = mrRow.nivel || mrRow.riesgo || 'PENDIENTE';

    const data = {
      mercancia: mrRow.tipoMercancia || mrRow.mercancia || null,
      tipoPersona: mrRow.tipoPersona || null,
      tiempo: mrRow.tiempoMercado || mrRow.tiempo || null,
      capital: mrRow.capitalEmpresa || mrRow.capital || null,
      frecuencia: mrRow.frecOp || mrRow.frecuencia || null,
      facturacion: mrRow.promedioFact || mrRow.facturacion || null,
      cert: mrRow.certif || mrRow.cert || null,
      anFin: mrRow.analisisFin || mrRow.anFin || null,
      puntaje,
      riesgo,
      control: mrRow.control || null,
      frecControl: mrRow.frecControl || null,
    };

    await prisma.matrizRiesgo.upsert({
      where: { recordId: newRecordId },
      update: data,
      create: { recordId: newRecordId, companias: [], ...data },
    });
    created++;
  }

  console.log(`  Creadas/actualizadas: ${created}, Saltadas (record no migrado): ${skipped}`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀  Iniciando migración de backup.json');
  console.log('──────────────────────────────────────────────────────');

  try {
    await migrateComerciales();
    await migrateAnalistas();
    await migrateBiblioteca();
    await migrateTarifasEspeciales();
    await migrateCotNumero();
    await migrateRecords();
    await migrateCotizaciones();
    await migrateGestionDocumental();
    await migrateMatrizRiesgos();

    console.log('\n──────────────────────────────────────────────────────');
    console.log('✅  Migración completada exitosamente (segura para re-ejecutar)');
  } catch (err) {
    console.error('\n❌  Error durante la migración:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
