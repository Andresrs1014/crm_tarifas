/**
 * migrate_backup.js
 * Carga backup_zymo_2026-06-10.json a la base de datos PostgreSQL del CRM.
 *
 * Ejecución desde dentro del contenedor:
 *   docker cp backup_zymo_2026-06-10.json crm_backend:/app/backup.json
 *   docker cp migrate_backup.js crm_backend:/app/migrate_backup.js
 *   docker exec crm_backend node migrate_backup.js
 *
 * O desde el host (requiere DATABASE_URL accesible):
 *   DATABASE_URL="postgresql://..." node migrate_backup.js
 *
 * Funciones disponibles (se ejecutan en orden):
 *   1. migrateComerciales()
 *   2. migrateAnalistas()
 *   3. migrateBiblioteca()
 *   4. migrateCotNumero()
 *   5. migrateRecords()        ← incluye contactos y actividades
 *   6. migrateCotizaciones()
 *   7. migrateGestionDocumental()
 *   8. migrateMatrizRiesgos()
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
  comerciales: {},  // oldId → newUUID
  records: {},      // oldId → newUUID
};

// ─── Helper ──────────────────────────────────────────────────────────────────
function parseDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function safeInt(val) {
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

// ─── 1. COMERCIALES ──────────────────────────────────────────────────────────
// Busca comerciales existentes por email o nombre (no crea duplicados).
// Si ya existe en la BD → reutiliza su ID.
// Si no existe → lo crea.
async function migrateComerciales() {
  console.log('\n📦  migrateComerciales...');
  const rows = backup.comerciales || [];
  let reutilizados = 0;
  let creados = 0;

  // Traer todos los comerciales actuales de la BD
  const existentes = await prisma.comercial.findMany();

  for (const c of rows) {
    // Buscar por email primero, luego por nombre (case-insensitive)
    const match = existentes.find(e =>
      (c.email && e.email && e.email.toLowerCase() === c.email.toLowerCase()) ||
      e.nombre.toLowerCase() === c.nombre.toLowerCase()
    );

    if (match) {
      idMap.comerciales[c.id] = match.id;
      reutilizados++;
      console.log(`  ↩  ${c.nombre} → ya existe (${match.id}), reutilizando`);
    } else {
      const newId = randomUUID();
      idMap.comerciales[c.id] = newId;
      await prisma.comercial.create({
        data: {
          id: newId,
          nombre: c.nombre || 'Sin nombre',
          cargo: c.cargo || null,
          email: c.email || null,
          tel: c.tel || null,
          activo: true,
        },
      });
      creados++;
      console.log(`  ✓  ${c.nombre} → creado (${newId})`);
    }
  }

  console.log(`  Reutilizados: ${reutilizados}, Creados nuevos: ${creados}`);
}

// ─── 2. ANALISTAS ─────────────────────────────────────────────────────────────
async function migrateAnalistas() {
  console.log('\n📦  migrateAnalistas...');
  const rows = backup.analistas || [];
  let created = 0;

  for (const a of rows) {
    const newId = randomUUID();
    await prisma.analista.upsert({
      where: { id: newId },
      update: {},
      create: {
        id: newId,
        nombre: a.nombre || 'Sin nombre',
        email: a.email || null,
        tel: a.tel || null,
      },
    });
    created++;
    console.log(`  ✓ ${a.nombre}`);
  }

  console.log(`  Total: ${created} analistas`);
}

// ─── 3. BIBLIOTECA ───────────────────────────────────────────────────────────
async function migrateBiblioteca() {
  console.log('\n📦  migrateBiblioteca...');
  const bib = backup.biblioteca || {};
  const lineas = Object.keys(bib);
  let totalItems = 0;

  for (let orden = 0; orden < lineas.length; orden++) {
    const nombre = lineas[orden];
    const lineaData = bib[nombre];

    // Columnas extra (si existen)
    const columnas = lineaData.columnas || lineaData.colHeaders || [];

    // Crear o actualizar linea
    const linea = await prisma.bibliotecaLinea.upsert({
      where: { nombre },
      update: { columnas, orden },
      create: { nombre, columnas, orden },
    });

    console.log(`  Línea: ${nombre}`);

    // Grupos e items
    const grupos = lineaData.grupos || [];
    for (let gi = 0; gi < grupos.length; gi++) {
      const g = grupos[gi];

      // Verificar si ya existe un grupo con mismo nombre en esta linea
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

        // Construir extraCols si hay campos adicionales
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
        totalItems++;
      }
    }

    // Observaciones HTML
    const observaciones = lineaData.observaciones || [];
    for (const obs of observaciones) {
      if (!obs.html) continue;
      await prisma.bibliotecaObs.create({
        data: {
          lineaId: linea.id,
          nombre: obs.nombre || nombre,
          html: obs.html,
        },
      });
    }
  }

  console.log(`  Total items: ${totalItems}`);
}

// ─── 4. CONTADOR DE COTIZACIONES ─────────────────────────────────────────────
async function migrateCotNumero() {
  console.log('\n📦  migrateCotNumero...');
  const valor = backup.cotNumero || 0;

  const existing = await prisma.cotNumeroCounter.findFirst();
  if (existing) {
    await prisma.cotNumeroCounter.update({
      where: { id: existing.id },
      data: { valor },
    });
    console.log(`  Actualizado a: ${valor}`);
  } else {
    await prisma.cotNumeroCounter.create({ data: { valor } });
    console.log(`  Creado con valor: ${valor}`);
  }
}

// ─── 5. RECORDS (incluye contactos y actividades) ───────────────────────────
async function migrateRecords() {
  console.log('\n📦  migrateRecords...');
  const rows = backup.records || [];
  let created = 0;
  let totalContactos = 0;
  let totalActividades = 0;

  for (const r of rows) {
    const newId = randomUUID();
    idMap.records[r.id] = newId;

    // Resolver comercialId
    const comercialId = idMap.comerciales[r.comercialId];
    if (!comercialId) {
      console.warn(`  ⚠  Record ${r.empresa}: comercialId ${r.comercialId} no encontrado — saltando`);
      continue;
    }

    // Crear el record principal
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
        servicios: r.servicios || [],
        facturacionLineas: r.facturacionLineas || {},
      },
    });
    created++;

    // Contactos anidados
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
        },
      });
      totalContactos++;
    }

    // Actividades anidadas
    const actividades = r.actividades || [];
    for (const a of actividades) {
      // El backup usa 'desc' en lugar de 'descripcion'
      const descripcion = a.descripcion || a.desc || a.nota || '';
      if (!descripcion && !a.tipo) continue;

      // El backup usa 'visit' en lugar de 'visita'
      const tipo = a.tipo === 'visit' ? 'visita' : (a.tipo || 'seguimiento');

      await prisma.actividad.create({
        data: {
          recordId: newId,
          tipo,
          descripcion: descripcion || '(sin descripción)',
          fecha: parseDate(a.fecha) || new Date(),
          hora: a.hora || null,
          lugar: a.lugar || null,
          origen: a.origen || null,
          hecho: a.hecho !== undefined ? a.hecho : true,
        },
      });
      totalActividades++;
    }
  }

  console.log(`  Records: ${created}, Contactos: ${totalContactos}, Actividades: ${totalActividades}`);
}

// ─── 6. COTIZACIONES ─────────────────────────────────────────────────────────
async function migrateCotizaciones() {
  console.log('\n📦  migrateCotizaciones...');
  const rows = backup.cotizaciones || [];
  let created = 0;
  let skipped = 0;

  for (const c of rows) {
    // Verificar que el numero no exista
    const exists = await prisma.cotizacion.findUnique({ where: { numero: c.numero } });
    if (exists) {
      skipped++;
      continue;
    }

    // Mapear recordId si existe (en este backup no hay, pero por si acaso)
    const recordId = c.recordId ? idMap.records[c.recordId] || null : null;

    // Buscar comercialNombre desde backup
    const comercialData = (backup.comerciales || []).find(cm => cm.id === c.comercialId);
    const comercialNombre = comercialData?.nombre || c.comercialNombre || 'Desconocido';

    // El backup usa 'items' como itemsSnapshot y 'obsPlantillas' como obsHtml
    await prisma.cotizacion.create({
      data: {
        id: randomUUID(),
        numero: c.numero,
        recordId,
        empresa: c.empresa || 'Sin nombre',
        nit: c.nit || null,
        ciudad: c.ciudad || null,
        contacto: c.contacto || null,
        email: c.email || null,
        comercial: comercialNombre,
        tarifaTipo: 'biblioteca',
        estado: c.estado || 'borrador',
        lineas: c.lineas || [],
        itemsSnapshot: c.items || {},
        obsHtml: c.obsPlantillas || {},
        obsLibre: c.obsLibre || null,
      },
    });
    created++;
  }

  console.log(`  Creadas: ${created}, Saltadas (duplicado): ${skipped}`);
}

// ─── 7. GESTIÓN DOCUMENTAL ───────────────────────────────────────────────────
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

    // Sanitizar docs: quitar campo 'archivos' (archivos no se migraron)
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

  console.log(`  Creadas: ${created}, Saltadas (record no migrado): ${skipped}`);
}

// ─── 8. MATRIZ DE RIESGOS ─────────────────────────────────────────────────────
async function migrateMatrizRiesgos() {
  console.log('\n📦  migrateMatrizRiesgos...');
  const mr = backup.matrizRiesgos || {};

  // Fusionar mrData si existe
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

    // Mapeo de campos backup → DB
    const puntaje = typeof mrRow.puntaje === 'number' ? mrRow.puntaje : 0;
    const riesgo = mrRow.nivel || mrRow.riesgo || 'PENDIENTE';

    await prisma.matrizRiesgo.upsert({
      where: { recordId: newRecordId },
      update: {
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
      },
      create: {
        recordId: newRecordId,
        companias: [],
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
      },
    });
    created++;
  }

  console.log(`  Creadas: ${created}, Saltadas (record no migrado): ${skipped}`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀  Iniciando migración de backup_zymo_2026-06-10.json');
  console.log('──────────────────────────────────────────────────────');

  try {
    await migrateComerciales();
    await migrateAnalistas();
    await migrateBiblioteca();
    await migrateCotNumero();
    await migrateRecords();
    await migrateCotizaciones();
    await migrateGestionDocumental();
    await migrateMatrizRiesgos();

    console.log('\n──────────────────────────────────────────────────────');
    console.log('✅  Migración completada exitosamente');
  } catch (err) {
    console.error('\n❌  Error durante la migración:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
