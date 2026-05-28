import prisma from '../../database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonInput = any;

const MR_POND: Record<string, number> = {
  mercancia:   0.45,
  tipoPersona: 0.05,
  tiempo:      0.05,
  capital:     0.05,
  frecuencia:  0.15,
  facturacion: 0.25,
};

const MR_SCORES: Record<string, Record<string, number>> = {
  mercancia: {
    'Industrial': 2, 'Tecnología': 2, 'Consumo masivo': 3, 'Textiles': 2,
    'Farmacéuticos': 2, 'Dispositivos Médicos': 2, 'Repuestos automotrices': 3,
    'Hogar y cocina': 2, 'Accesorios': 2, 'Herramientas': 2, 'Juguetería': 2,
    'Electrodomésticos': 3, 'Decoración': 2, 'Misceláneos': 2,
  },
  tipoPersona: { 'Jurídica': 1, 'Natural': 3 },
  tiempo:      { '< 1 año': 5, '1 - 3 años': 3, '> 3 años': 1 },
  capital:     { '< 1 M': 5, '1 M - 50M': 4, '>50M - 100M': 3, '> 100M': 1 },
  frecuencia:  { 'Bajo': 1, 'Medio': 3, 'Alta': 5 },
  facturacion: { 'Bajo': 1, 'Medio': 3, 'Alta': 5 },
  cert:        { 'Sí': -0.5, 'No': 0 },
  anFin:       { 'Favorable': -0.5, 'Desfavorable': 0.5, 'No disponible': 0 },
};

export function calcPuntaje(data: {
  mercancia?: string; tipoPersona?: string; tiempo?: string;
  capital?: string; frecuencia?: string; facturacion?: string;
  cert?: string; anFin?: string;
}): number {
  let total = 0;
  for (const k of ['mercancia', 'tipoPersona', 'tiempo', 'capital', 'frecuencia', 'facturacion']) {
    const val = (data as Record<string, string | undefined>)[k] ?? '';
    const score = (MR_SCORES[k] ?? {})[val] ?? 0;
    total += score * (MR_POND[k] ?? 0);
  }
  total += (MR_SCORES.cert[data.cert ?? ''] ?? 0);
  total += (MR_SCORES.anFin[data.anFin ?? ''] ?? 0);
  return Math.round(total * 100) / 100;
}

export function calcRiesgo(puntaje: number): string {
  if (puntaje >= 5.0) return 'CRÍTICO';
  if (puntaje >= 4.0) return 'ALTO';
  if (puntaje >= 3.0) return 'MEDIO';
  if (puntaje > 0)    return 'BAJO';
  return 'PENDIENTE';
}

export function autoControl(riesgo: string, frecControl?: string): { control: string; frecControl: string } {
  if (riesgo === 'CRÍTICO') return {
    control: 'Visitas regulares a sus instalaciones + Validación beneficiarios finales clientes + proveedores',
    frecControl: frecControl || 'Trimestral',
  };
  if (riesgo === 'ALTO') return {
    control: 'Visitas regulares a sus instalaciones + Control documental + Listas cautelares',
    frecControl: frecControl || 'Semestral',
  };
  return {
    control: 'Control documental + Listas cautelares',
    frecControl: frecControl || 'Anual',
  };
}

function companiasByServicios(servicios: string[]): string[] {
  const cias: string[] = [];
  if (servicios.some(s => ['Zona Franca', 'CEDI', 'Transporte'].includes(s))) cias.push('Logimat');
  if (servicios.some(s => ['Aduana', 'Depósito Aduanero'].includes(s))) cias.push('IMC Cargo');
  if (servicios.includes('Paqueteo')) cias.push('IMC Depósito');
  return cias;
}

export async function getOrCreateMatriz(recordId: string) {
  const existing = await prisma.matrizRiesgo.findUnique({ where: { recordId } });
  if (existing) return existing;

  // Auto-populate companias from record servicios
  const record = await prisma.record.findUnique({ where: { id: recordId }, select: { servicios: true, tipo: true } });
  if (!record || record.tipo !== 'cliente') {
    throw Object.assign(new Error('Solo disponible para clientes'), { statusCode: 400 });
  }
  const servicios = (record.servicios as string[]) || [];
  const companias = companiasByServicios(servicios);

  return prisma.matrizRiesgo.create({
    data: { recordId, companias: companias as JsonInput },
  });
}

export async function upsertMatriz(recordId: string, data: {
  companias?: string[];
  mercancia?: string;
  tipoPersona?: string;
  tiempo?: string;
  capital?: string;
  frecuencia?: string;
  facturacion?: string;
  cert?: string;
  anFin?: string;
  frecControl?: string;
}) {
  const puntaje = calcPuntaje(data);
  const riesgo  = calcRiesgo(puntaje);
  const { control, frecControl } = autoControl(riesgo, data.frecControl);

  return prisma.matrizRiesgo.upsert({
    where: { recordId },
    create: {
      recordId,
      companias: (data.companias ?? []) as JsonInput,
      mercancia:   data.mercancia,
      tipoPersona: data.tipoPersona,
      tiempo:      data.tiempo,
      capital:     data.capital,
      frecuencia:  data.frecuencia,
      facturacion: data.facturacion,
      cert:        data.cert,
      anFin:       data.anFin,
      puntaje,
      riesgo,
      control,
      frecControl,
    },
    update: {
      companias:   data.companias !== undefined ? (data.companias as JsonInput) : undefined,
      mercancia:   data.mercancia,
      tipoPersona: data.tipoPersona,
      tiempo:      data.tiempo,
      capital:     data.capital,
      frecuencia:  data.frecuencia,
      facturacion: data.facturacion,
      cert:        data.cert,
      anFin:       data.anFin,
      puntaje,
      riesgo,
      control,
      frecControl,
    },
  });
}

export async function listMatriz(filters: { search?: string; riesgo?: string; completa?: string }) {
  const clientes = await prisma.record.findMany({
    where: { tipo: 'cliente' },
    select: {
      id: true, empresa: true, nit: true, ciudad: true, estadoCliente: true,
      comercial: { select: { nombre: true } },
      matrizRiesgo: true,
    },
    orderBy: { empresa: 'asc' },
  });

  return clientes
    .filter(r => {
      const m = r.matrizRiesgo;
      const completa = !!(m?.mercancia && m.tipoPersona && m.tiempo && m.capital && m.frecuencia && m.facturacion && m.cert && m.anFin);
      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (!r.empresa.toLowerCase().includes(s) && !(r.nit ?? '').includes(s)) return false;
      }
      if (filters.riesgo && m?.riesgo !== filters.riesgo) return false;
      if (filters.completa === 'completa' && !completa) return false;
      if (filters.completa === 'pendiente' && completa) return false;
      return true;
    })
    .map(r => ({
      ...r,
      matrizRiesgo: r.matrizRiesgo ?? null,
    }));
}
