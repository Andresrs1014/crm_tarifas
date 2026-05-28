import prisma from '../../database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonInput = any;

async function generateNumero(): Promise<string> {
  return prisma.$transaction(async (tx) => {
    let counter = await tx.cotNumeroCounter.findFirst();
    if (!counter) {
      counter = await tx.cotNumeroCounter.create({ data: { valor: 0 } });
    }
    const updated = await tx.cotNumeroCounter.update({
      where: { id: counter.id },
      data: { valor: { increment: 1 } },
    });
    return `COT-${String(updated.valor).padStart(3, '0')}`;
  });
}

export async function listCotizaciones(filters: { estado?: string; search?: string }) {
  return prisma.cotizacion.findMany({
    where: {
      ...(filters.estado && { estado: filters.estado }),
      ...(filters.search && {
        OR: [
          { empresa: { contains: filters.search, mode: 'insensitive' } },
          { numero: { contains: filters.search, mode: 'insensitive' } },
          { contacto: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCotizacionById(id: string) {
  const cot = await prisma.cotizacion.findUnique({ where: { id } });
  if (!cot) throw Object.assign(new Error('Cotización no encontrada'), { statusCode: 404 });
  return cot;
}

export async function createCotizacion(data: {
  recordId?: string;
  empresa: string;
  nit?: string;
  ciudad?: string;
  contacto?: string;
  email?: string;
  comercial: string;
  paqueteadora?: string;
  tarifaTipo?: string;
  estado?: string;
  lineas?: unknown[];
  itemsSnapshot?: Record<string, unknown>;
  obsHtml?: Record<string, unknown>;
  obsLibre?: string;
  htmlPreview?: string;
}) {
  const numero = await generateNumero();
  return prisma.cotizacion.create({
    data: {
      numero,
      recordId: data.recordId ?? null,
      empresa: data.empresa,
      nit: data.nit,
      ciudad: data.ciudad,
      contacto: data.contacto,
      email: data.email,
      comercial: data.comercial,
      paqueteadora: data.paqueteadora,
      tarifaTipo: data.tarifaTipo ?? 'biblioteca',
      estado: data.estado ?? 'borrador',
      lineas: (data.lineas ?? []) as JsonInput,
      itemsSnapshot: (data.itemsSnapshot ?? {}) as JsonInput,
      obsHtml: (data.obsHtml ?? {}) as JsonInput,
      obsLibre: data.obsLibre,
      htmlPreview: data.htmlPreview,
    },
  });
}

export async function updateCotizacion(id: string, data: {
  recordId?: string;
  empresa?: string;
  nit?: string;
  ciudad?: string;
  contacto?: string;
  email?: string;
  comercial?: string;
  paqueteadora?: string;
  tarifaTipo?: string;
  estado?: string;
  lineas?: unknown[];
  itemsSnapshot?: Record<string, unknown>;
  obsHtml?: Record<string, unknown>;
  obsLibre?: string;
  htmlPreview?: string;
}) {
  return prisma.cotizacion.update({
    where: { id },
    data: {
      ...(data.recordId !== undefined && { recordId: data.recordId }),
      ...(data.empresa !== undefined && { empresa: data.empresa }),
      ...(data.nit !== undefined && { nit: data.nit }),
      ...(data.ciudad !== undefined && { ciudad: data.ciudad }),
      ...(data.contacto !== undefined && { contacto: data.contacto }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.comercial !== undefined && { comercial: data.comercial }),
      ...(data.paqueteadora !== undefined && { paqueteadora: data.paqueteadora }),
      ...(data.tarifaTipo !== undefined && { tarifaTipo: data.tarifaTipo }),
      ...(data.estado !== undefined && { estado: data.estado }),
      ...(data.lineas !== undefined && { lineas: data.lineas as JsonInput }),
      ...(data.itemsSnapshot !== undefined && { itemsSnapshot: data.itemsSnapshot as JsonInput }),
      ...(data.obsHtml !== undefined && { obsHtml: data.obsHtml as JsonInput }),
      ...(data.obsLibre !== undefined && { obsLibre: data.obsLibre }),
      ...(data.htmlPreview !== undefined && { htmlPreview: data.htmlPreview }),
    },
  });
}

export async function deleteCotizacion(id: string) {
  await prisma.cotizacion.delete({ where: { id } });
}

export async function duplicarCotizacion(id: string) {
  const original = await getCotizacionById(id);
  const numero = await generateNumero();
  return prisma.cotizacion.create({
    data: {
      numero,
      recordId: original.recordId,
      empresa: original.empresa,
      nit: original.nit,
      ciudad: original.ciudad,
      contacto: original.contacto,
      email: original.email,
      comercial: original.comercial,
      paqueteadora: original.paqueteadora,
      tarifaTipo: original.tarifaTipo,
      estado: 'borrador',
      lineas: original.lineas as JsonInput,
      itemsSnapshot: original.itemsSnapshot as JsonInput,
      obsHtml: original.obsHtml as JsonInput,
      obsLibre: original.obsLibre,
      htmlPreview: null,
    },
  });
}

function parseTarifaMoneda(tarifa: string): number | null {
  const cleaned = tarifa.replace(/\$/g, '').replace(/\./g, '').replace(/,/g, '.').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function formatTarifaMoneda(value: number): string {
  return '$' + Math.round(value).toLocaleString('es-CO');
}

export async function actualizarTarifas(id: string, incremento: number) {
  const original = await getCotizacionById(id);
  const numero = await generateNumero();

  const snapshot = original.itemsSnapshot as Record<string, unknown>;
  let itemsActualizados = 0;
  const newSnapshot: Record<string, unknown> = {};

  for (const [lineaId, grupos] of Object.entries(snapshot)) {
    const gruposObj = grupos as Record<string, unknown>;
    const newGrupos: Record<string, unknown> = {};
    for (const [grupoId, items] of Object.entries(gruposObj)) {
      const itemsArr = items as Array<Record<string, unknown>>;
      newGrupos[grupoId] = itemsArr.map((item) => {
        const tipoTarifa = item.tipoTarifa as string | undefined;
        const tarifa = item.tarifa as string | undefined;
        if (tipoTarifa === 'moneda' && tarifa) {
          const value = parseTarifaMoneda(tarifa);
          if (value !== null) {
            itemsActualizados++;
            return { ...item, tarifa: formatTarifaMoneda(value * (1 + incremento / 100)) };
          }
        }
        return item;
      });
    }
    newSnapshot[lineaId] = newGrupos;
  }

  const newCot = await prisma.cotizacion.create({
    data: {
      numero,
      recordId: original.recordId,
      empresa: original.empresa,
      nit: original.nit,
      ciudad: original.ciudad,
      contacto: original.contacto,
      email: original.email,
      comercial: original.comercial,
      paqueteadora: original.paqueteadora,
      tarifaTipo: original.tarifaTipo,
      estado: 'borrador',
      lineas: original.lineas as JsonInput,
      itemsSnapshot: newSnapshot as JsonInput,
      obsHtml: original.obsHtml as JsonInput,
      obsLibre: original.obsLibre,
      htmlPreview: null,
    },
  });

  return { cotizacion: newCot, itemsActualizados };
}
