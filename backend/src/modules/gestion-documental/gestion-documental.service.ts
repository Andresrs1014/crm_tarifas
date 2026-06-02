import prisma from '../../database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonInput = any;

export interface GDDoc {
  id: string;
  nombre: string;
  aplica: 'todos' | 'directo';
  pond_di: number;
  pond_ref: number;
}

export const GD_DOCS: GDDoc[] = [
  { id: 'fr001',      nombre: 'FR-001-GC Formulario de datos y conocimiento de cliente',               aplica: 'todos',   pond_di: 0.34,  pond_ref: 0.34 },
  { id: 'fr004',      nombre: 'FR-004-GC Formato visita clientes',                                     aplica: 'todos',   pond_di: 0.07,  pond_ref: 0.10 },
  { id: 'est_fin',    nombre: 'Estados financieros comparativos del año inmediatamente anterior',       aplica: 'todos',   pond_di: 0.05,  pond_ref: 0.05 },
  { id: 'cam_com',    nombre: 'Certificado de Cámara de Comercio (actualizado del año en curso)',       aplica: 'todos',   pond_di: 0.03,  pond_ref: 0.03 },
  { id: 'rut',        nombre: 'RUT (actualizado del año en curso)',                                     aplica: 'todos',   pond_di: 0.03,  pond_ref: 0.03 },
  { id: 'cert_ban',   nombre: 'Certificado Bancario (actualizado del año en curso)',                    aplica: 'directo', pond_di: 0.01,  pond_ref: 0    },
  { id: 'ced_rl',     nombre: 'Fotocopia cédula de ciudadanía del Representante Legal',                aplica: 'todos',   pond_di: 0.01,  pond_ref: 0.03 },
  { id: 'ref_com',    nombre: 'Referencias comerciales actualizadas del año en curso',                 aplica: 'directo', pond_di: 0.01,  pond_ref: 0    },
  { id: 'ant_cont',   nombre: 'Certificado de Antecedentes Disciplinarios Contador',                   aplica: 'directo', pond_di: 0.005, pond_ref: 0    },
  { id: 'ant_rf',     nombre: 'Certificado de Antecedentes Disciplinarios Revisor Fiscal',             aplica: 'directo', pond_di: 0.005, pond_ref: 0    },
  { id: 'ced_rf',     nombre: 'Fotocopia cédula ciudadanía del Revisor Fiscal (si aplica)',            aplica: 'directo', pond_di: 0.005, pond_ref: 0    },
  { id: 'ced_cont',   nombre: 'Fotocopia cédula ciudadanía del Contador',                              aplica: 'directo', pond_di: 0.005, pond_ref: 0    },
  { id: 'tp_rf',      nombre: 'Tarjeta Profesional del Revisor Fiscal (si aplica)',                    aplica: 'directo', pond_di: 0.005, pond_ref: 0    },
  { id: 'tp_cont',    nombre: 'Tarjeta Profesional del Contador',                                      aplica: 'directo', pond_di: 0.005, pond_ref: 0    },
  { id: 'cert_basc',  nombre: 'Certificaciones BASC / OEA / ISO (si aplica)',                          aplica: 'todos',   pond_di: 0.01,  pond_ref: 0.01 },
  { id: 'benef_dian', nombre: 'Reportes beneficiarios finales DIAN (a partir de mayo 2025)',           aplica: 'todos',   pond_di: 0.01,  pond_ref: 0.01 },
  { id: 'analisis_fin',nombre:'Estudio Análisis Financiero',                                           aplica: 'todos',   pond_di: 0.20,  pond_ref: 0.20 },
  { id: 'listas_caut',nombre: 'Listas Cautelares',                                                     aplica: 'todos',   pond_di: 0.20,  pond_ref: 0.20 },
];

export interface DocEstado {
  estado?: 'completo' | 'incompleto' | 'pendiente';
  obs?: string;
  fecha?: string; // ISO date string
}

function calcCumplimiento(docs: Record<string, DocEstado>, tipoCliente: string, cicloActual: number): number {
  const esReferido = tipoCliente === 'referido';
  const anoActual = new Date().getFullYear();
  if (cicloActual < anoActual) return 0;

  const aplicables = GD_DOCS.filter(d => esReferido ? d.aplica === 'todos' : true);
  let totalPond = 0, cumplido = 0;
  for (const d of aplicables) {
    const pond = esReferido ? d.pond_ref : d.pond_di;
    if (!pond) continue;
    totalPond += pond;
    const est = docs[d.id]?.estado ?? '';
    if (est === 'completo')   cumplido += pond;
    else if (est === 'incompleto') cumplido += pond * 0.5;
  }
  if (totalPond === 0) return 0;
  return Math.round((cumplido / totalPond) * 100);
}

function calcVencimiento(docs: Record<string, DocEstado>): {
  status: 'vencido' | 'por-vencer' | 'con-tiempo' | 'sin-fecha';
  diasRestantes: number | null;
  fechaVencimiento: string | null;
} {
  const fr001 = docs['fr001'];
  const fechaStr = fr001?.estado === 'completo' ? fr001.fecha : undefined;
  if (!fechaStr) return { status: 'sin-fecha', diasRestantes: null, fechaVencimiento: null };

  const ultima = new Date(fechaStr);
  const proxima = new Date(ultima);
  proxima.setFullYear(proxima.getFullYear() + 1);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diasRestantes = Math.ceil((proxima.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  const fechaVencimiento = proxima.toISOString().split('T')[0];

  if (diasRestantes < 0)   return { status: 'vencido',    diasRestantes, fechaVencimiento };
  if (diasRestantes <= 60) return { status: 'por-vencer', diasRestantes, fechaVencimiento };
  return                          { status: 'con-tiempo', diasRestantes, fechaVencimiento };
}

function calcEstadoDocs(docs: Record<string, DocEstado>, tipoCliente: string): 'completo' | 'incompleto' | 'pendiente' {
  const esReferido = tipoCliente === 'referido';
  const aplicables = GD_DOCS.filter(d => esReferido ? d.aplica === 'todos' : true);
  const estados = aplicables.map(d => docs[d.id]?.estado ?? '');
  if (estados.every(e => e === 'completo'))  return 'completo';
  if (estados.some(e => e === 'incompleto')) return 'incompleto';
  return 'pendiente';
}

function enrichRow(r: {
  id: string; empresa: string; nit: string | null; ciudad: string | null;
  tipoCliente: string; estadoCliente: string | null;
  comercial: { nombre: string };
  matrizRiesgo: { companias: JsonInput } | null;
  gestionDocumental: { id: string; docs: JsonInput; cicloActual: number; updatedAt: Date } | null;
}) {
  const gd = r.gestionDocumental;
  const docs: Record<string, DocEstado> = gd ? (gd.docs as Record<string, DocEstado>) : {};
  const cicloActual = gd?.cicloActual ?? new Date().getFullYear();
  const cumplimiento = calcCumplimiento(docs, r.tipoCliente, cicloActual);
  const vencimiento  = calcVencimiento(docs);
  const estadoDocs   = calcEstadoDocs(docs, r.tipoCliente);

  return {
    id:            r.id,
    empresa:       r.empresa,
    nit:           r.nit,
    ciudad:        r.ciudad,
    tipoCliente:   r.tipoCliente,
    estadoCliente: r.estadoCliente,
    companias:     (r.matrizRiesgo?.companias as string[]) ?? [],
    comercial:     r.comercial,
    gd: {
      id:            gd?.id ?? null,
      docs,
      cicloActual,
      updatedAt:     gd?.updatedAt ?? null,
    },
    cumplimiento,
    vencimiento,
    estadoDocs,
  };
}

export async function listGD(filters: { search?: string; vencimiento?: string; estadoDocs?: string }) {
  const clientes = await prisma.record.findMany({
    where: { tipo: 'cliente' },
    select: {
      id: true, empresa: true, nit: true, ciudad: true,
      tipoCliente: true, estadoCliente: true,
      comercial: { select: { nombre: true } },
      matrizRiesgo: { select: { companias: true } },
      gestionDocumental: {
        select: { id: true, docs: true, cicloActual: true, updatedAt: true },
      },
    },
    orderBy: { empresa: 'asc' },
  });

  const enriched = clientes.map(enrichRow);

  return enriched.filter(r => {
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!r.empresa.toLowerCase().includes(s) && !(r.nit ?? '').includes(s)) return false;
    }
    if (filters.vencimiento && r.vencimiento.status !== filters.vencimiento) return false;
    if (filters.estadoDocs && r.estadoDocs !== filters.estadoDocs) return false;
    return true;
  });
}

export async function getOrCreateGD(recordId: string) {
  const record = await prisma.record.findUnique({
    where: { id: recordId },
    select: { tipo: true, tipoCliente: true },
  });
  if (!record || record.tipo !== 'cliente') {
    throw Object.assign(new Error('Solo disponible para clientes'), { statusCode: 400 });
  }

  const existing = await prisma.gestionDocumental.findUnique({ where: { recordId } });
  if (existing) return existing;

  return prisma.gestionDocumental.create({
    data: { recordId, cicloActual: new Date().getFullYear() },
  });
}

export async function upsertGD(recordId: string, data: {
  docs?: Record<string, DocEstado>;
  cicloActual?: number;
}) {
  return prisma.gestionDocumental.upsert({
    where: { recordId },
    create: {
      recordId,
      docs: (data.docs ?? {}) as JsonInput,
      cicloActual: data.cicloActual ?? new Date().getFullYear(),
    },
    update: {
      docs: data.docs !== undefined ? (data.docs as JsonInput) : undefined,
      cicloActual: data.cicloActual,
    },
  });
}
