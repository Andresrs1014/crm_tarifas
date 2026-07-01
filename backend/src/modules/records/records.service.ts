import prisma from '../../database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonInput = any;

export interface RecordFilters {
  tipo?: string;
  estado?: string;
  comercialId?: string;
  search?: string;
  fecha?: string;
  mes?: string;
}

export async function listRecords(filters: RecordFilters) {
  const where: Record<string, unknown> = {};

  if (filters.tipo) where.tipo = filters.tipo;
  if (filters.comercialId) where.comercialId = filters.comercialId;

  if (filters.estado) {
    if (filters.tipo === 'prospecto') {
      where.estadoProspecto = filters.estado;
    } else if (filters.tipo === 'cliente') {
      where.estadoCliente = filters.estado;
    } else {
      where.OR = [
        { estadoProspecto: filters.estado },
        { estadoCliente: filters.estado },
      ];
    }
  }

  if (filters.search) {
    const s = filters.search;
    where.OR = [
      { empresa: { contains: s, mode: 'insensitive' } },
      { nit: { contains: s, mode: 'insensitive' } },
      { ciudad: { contains: s, mode: 'insensitive' } },
    ];
  }

  if (filters.fecha) {
    const start = new Date(filters.fecha);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.fecha);
    end.setHours(23, 59, 59, 999);
    where.fecha = { gte: start, lte: end };
  }

  if (filters.mes) {
    const [year, month] = filters.mes.split('-').map(Number);
    where.fecha = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return prisma.record.findMany({
    where: where as any,
    include: {
      comercial: { select: { id: true, nombre: true, cargo: true } },
      contactos: { orderBy: { orden: 'asc' } },
      _count: { select: { actividades: true, cotizaciones: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getRecordById(id: string) {
  const record = await prisma.record.findUnique({
    where: { id },
    include: {
      comercial: true,
      contactos: { orderBy: { orden: 'asc' } },
      actividades: { orderBy: { fecha: 'desc' } },
      cotizaciones: {
        select: { id: true, numero: true, estado: true, empresa: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: 'desc' },
      },
      matrizRiesgo: { select: { companias: true } },
    },
  });
  if (!record) throw Object.assign(new Error('Registro no encontrado'), { statusCode: 404 });
  return {
    ...record,
    companias: (record.matrizRiesgo?.companias as string[]) ?? [],
  };
}

export async function createRecord(data: {
  tipo: string;
  empresa: string;
  nit?: string;
  ciudad?: string;
  direccion?: string;
  categoria?: string;
  comercialId: string;
  tipoCliente?: string;
  clienteIndirectoId?: string;
  comision?: string;
  fecha: string;
  proximoSeguimiento?: string;
  observaciones?: string;
  estadoProspecto?: string;
  estadoCliente?: string;
  visita?: string;
  visitaCliente?: string;
  fechaVisita?: string;
  fechaVisitaCliente?: string;
  facturadoP?: string;
  facturado?: string;
  valorP?: number;
  valor?: number;
  nuevoServicio?: string;
  servicioNuevo?: string;
  ingresosEsperados?: number;
  servicios?: unknown[];
  facturacionLineas?: Record<string, unknown>;
  contactos?: Array<{
    nombre: string;
    cargo?: string;
    telefono?: string;
    email?: string;
    orden?: number;
    cumpleanos?: string;
    recibeRegalos?: boolean;
    tipo?: string;
  }>;
}) {
  const { contactos, ...recordData } = data;

  const created = await prisma.record.create({
    data: {
      ...recordData,
      fecha: new Date(recordData.fecha),
      proximoSeguimiento: recordData.proximoSeguimiento ? new Date(recordData.proximoSeguimiento) : undefined,
      fechaVisita: recordData.fechaVisita ? new Date(recordData.fechaVisita) : undefined,
      fechaVisitaCliente: recordData.fechaVisitaCliente ? new Date(recordData.fechaVisitaCliente) : undefined,
      servicios: (recordData.servicios ?? []) as JsonInput,
      facturacionLineas: (recordData.facturacionLineas ?? {}) as JsonInput,
      contactos: contactos
        ? { create: contactos.map((c, i) => ({ ...c, orden: c.orden ?? i })) }
        : undefined,
    },
    include: {
      comercial: { select: { id: true, nombre: true } },
      contactos: { orderBy: { orden: 'asc' } },
    },
  });

  const actividades: Array<{ tipo: string; descripcion: string; fecha: Date }> = [];

  if (recordData.tipo === 'prospecto') {
    if (recordData.visita && recordData.visita !== 'no') {
      actividades.push({
        tipo: 'visita',
        descripcion: `Visita/Contacto: ${recordData.visita}`,
        fecha: recordData.fechaVisita ? new Date(recordData.fechaVisita) : new Date(recordData.fecha),
      });
    }
    if ((recordData.valorP ?? 0) > 0) {
      actividades.push({
        tipo: 'seguimiento',
        descripcion: `Facturación: $${Number(recordData.valorP).toLocaleString('es-CO')}`,
        fecha: new Date(recordData.fecha),
      });
    }
  } else if (recordData.tipo === 'cliente') {
    if (recordData.visitaCliente && recordData.visitaCliente !== 'no') {
      actividades.push({
        tipo: 'visita',
        descripcion: `Visita cliente: ${recordData.visitaCliente}`,
        fecha: recordData.fechaVisitaCliente ? new Date(recordData.fechaVisitaCliente) : new Date(recordData.fecha),
      });
    }
    if (recordData.nuevoServicio === 'si') {
      actividades.push({
        tipo: 'tarea',
        descripcion: `Nuevo servicio: ${recordData.servicioNuevo || 'Sin especificar'}`,
        fecha: new Date(recordData.fecha),
      });
    }
    if ((recordData.valor ?? 0) > 0) {
      actividades.push({
        tipo: 'seguimiento',
        descripcion: `Facturación: $${Number(recordData.valor).toLocaleString('es-CO')}`,
        fecha: new Date(recordData.fecha),
      });
    }
  }

  if (actividades.length) {
    await prisma.actividad.createMany({
      data: actividades.map((a) => ({ ...a, recordId: created.id })),
    });
  }

  if (recordData.tipo === 'cliente') {
    const { getOrCreateMatriz } = await import('../matriz-riesgos/matriz-riesgos.service');
    await getOrCreateMatriz(created.id);
  }

  if (recordData.tipo === 'prospecto') {
    await prisma.crmMeta.create({
      data: {
        recordId: created.id,
        estadoPipeline: recordData.estadoProspecto ?? 'prospecto',
      },
    });
  }

  return created;
}

export async function updateRecord(id: string, data: Partial<{
  tipo: string;
  empresa: string;
  nit: string;
  ciudad: string;
  direccion: string;
  categoria: string;
  comercialId: string;
  tipoCliente: string;
  clienteIndirectoId: string;
  comision: string;
  fecha: string;
  proximoSeguimiento: string;
  observaciones: string;
  estadoProspecto: string;
  estadoCliente: string;
  visita: string;
  visitaCliente: string;
  fechaVisita: string;
  fechaVisitaCliente: string;
  facturadoP: string;
  facturado: string;
  valorP: number;
  valor: number;
  nuevoServicio: string;
  servicioNuevo: string;
  ingresosEsperados: number;
  servicios: unknown[];
  facturacionLineas: Record<string, unknown>;
  contactos: Array<{
    id?: string;
    nombre: string;
    cargo?: string;
    telefono?: string;
    email?: string;
    orden?: number;
    cumpleanos?: string;
    recibeRegalos?: boolean;
  }>;
}>) {
  const { contactos, ...rest } = data;

  // Build update object without Prisma type imports
  const updateObj: Record<string, unknown> = {};
  if (rest.tipo !== undefined) updateObj.tipo = rest.tipo;
  if (rest.empresa !== undefined) updateObj.empresa = rest.empresa;
  if (rest.nit !== undefined) updateObj.nit = rest.nit;
  if (rest.ciudad !== undefined) updateObj.ciudad = rest.ciudad;
  if (rest.direccion !== undefined) updateObj.direccion = rest.direccion;
  if (rest.categoria !== undefined) updateObj.categoria = rest.categoria;
  if (rest.comercialId !== undefined) updateObj.comercial = { connect: { id: rest.comercialId } };
  if (rest.tipoCliente !== undefined) updateObj.tipoCliente = rest.tipoCliente;
  if (rest.clienteIndirectoId !== undefined) updateObj.clienteIndirectoId = rest.clienteIndirectoId;
  if (rest.comision !== undefined) updateObj.comision = rest.comision;
  if (rest.fecha !== undefined) updateObj.fecha = new Date(rest.fecha);
  if (rest.proximoSeguimiento !== undefined)
    updateObj.proximoSeguimiento = rest.proximoSeguimiento ? new Date(rest.proximoSeguimiento) : null;
  if (rest.observaciones !== undefined) updateObj.observaciones = rest.observaciones;
  if (rest.estadoProspecto !== undefined) updateObj.estadoProspecto = rest.estadoProspecto;
  if (rest.estadoCliente !== undefined) updateObj.estadoCliente = rest.estadoCliente;
  if (rest.visita !== undefined) updateObj.visita = rest.visita;
  if (rest.visitaCliente !== undefined) updateObj.visitaCliente = rest.visitaCliente;
  if (rest.fechaVisita !== undefined)
    updateObj.fechaVisita = rest.fechaVisita ? new Date(rest.fechaVisita) : null;
  if (rest.fechaVisitaCliente !== undefined)
    updateObj.fechaVisitaCliente = rest.fechaVisitaCliente ? new Date(rest.fechaVisitaCliente) : null;
  if (rest.facturadoP !== undefined) updateObj.facturadoP = rest.facturadoP;
  if (rest.facturado !== undefined) updateObj.facturado = rest.facturado;
  if (rest.valorP !== undefined) updateObj.valorP = rest.valorP;
  if (rest.valor !== undefined) updateObj.valor = rest.valor;
  if (rest.nuevoServicio !== undefined) updateObj.nuevoServicio = rest.nuevoServicio;
  if (rest.servicioNuevo !== undefined) updateObj.servicioNuevo = rest.servicioNuevo;
  if (rest.ingresosEsperados !== undefined) updateObj.ingresosEsperados = rest.ingresosEsperados;
  if (rest.servicios !== undefined) updateObj.servicios = rest.servicios as JsonInput;
  if (rest.facturacionLineas !== undefined) updateObj.facturacionLineas = rest.facturacionLineas as JsonInput;

  if (contactos !== undefined) {
    await prisma.contacto.deleteMany({ where: { recordId: id } });
    updateObj.contactos = {
      create: contactos.map((c, i) => ({
        nombre: c.nombre,
        cargo: c.cargo,
        telefono: c.telefono,
        email: c.email,
        orden: c.orden ?? i,
        cumpleanos: c.cumpleanos,
        recibeRegalos: c.recibeRegalos ?? false,
      })),
    };
  }

  // Trackear cambio de etapa en stageHistory
  if (rest.estadoProspecto !== undefined) {
    const current = await prisma.record.findUnique({
      where: { id },
      select: { estadoProspecto: true, stageHistory: true, createdAt: true },
    });
    if (current && current.estadoProspecto !== rest.estadoProspecto) {
      const now = new Date().toISOString();
      const history = (current.stageHistory as JsonInput[]) ?? [];
      // Inicializar si está vacío
      if (history.length === 0 && current.estadoProspecto) {
        history.push({ stage: current.estadoProspecto, desde: current.createdAt.toISOString(), hasta: now });
      } else {
        // Cerrar la entrada abierta
        const last = history[history.length - 1];
        if (last && last.hasta === null) last.hasta = now;
      }
      history.push({ stage: rest.estadoProspecto, desde: now, hasta: null });
      updateObj.stageHistory = history as JsonInput;
    }
  }

  return prisma.record.update({
    where: { id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: updateObj as any,
    include: {
      comercial: { select: { id: true, nombre: true } },
      contactos: { orderBy: { orden: 'asc' } },
    },
  });
}

export async function deleteRecord(id: string) {
  await prisma.record.delete({ where: { id } });
}

/** Avanza estadoProspecto + CrmMeta + stageHistory (side-effects M8 B4). */
export async function advanceProspectoEstado(recordId: string, estadoProspecto: string) {
  const current = await prisma.record.findUnique({
    where: { id: recordId },
    select: { tipo: true, estadoProspecto: true, stageHistory: true, createdAt: true },
  });
  if (!current || current.tipo !== 'prospecto') return;
  if (current.estadoProspecto === estadoProspecto) return;

  const now = new Date().toISOString();
  const history = (current.stageHistory as JsonInput[]) ?? [];
  if (history.length === 0 && current.estadoProspecto) {
    history.push({ stage: current.estadoProspecto, desde: current.createdAt.toISOString(), hasta: now });
  } else {
    const last = history[history.length - 1];
    if (last && last.hasta === null) last.hasta = now;
  }
  history.push({ stage: estadoProspecto, desde: now, hasta: null });

  await prisma.record.update({
    where: { id: recordId },
    data: { estadoProspecto, stageHistory: history as JsonInput },
  });

  await prisma.crmMeta.upsert({
    where: { recordId },
    create: { recordId, estadoPipeline: estadoProspecto },
    update: { estadoPipeline: estadoProspecto },
  });
}

/** Convierte un prospecto en cliente activo (paridad HTML convertirACliente). */
export async function convertProspectToCliente(id: string) {
  const record = await prisma.record.findUnique({ where: { id } });
  if (!record) {
    throw Object.assign(new Error('Registro no encontrado'), { statusCode: 404 });
  }
  if (record.tipo !== 'prospecto') {
    throw Object.assign(new Error('Este registro ya es un cliente'), { statusCode: 400 });
  }

  const visitaCliente = record.visitaCliente ?? record.visita ?? 'no';
  const facturado = record.facturado ?? record.facturadoP ?? 'no';
  const valor = record.valor ?? record.valorP ?? 0;
  const facturacionLineas = record.facturacionLineas as Record<string, number> | null;
  const hasLineBilling = facturacionLineas && Object.keys(facturacionLineas).length > 0;

  await prisma.record.update({
    where: { id },
    data: {
      tipo: 'cliente',
      estadoCliente: record.estadoCliente ?? 'activo',
      tipoCliente: record.tipoCliente ?? 'directo',
      visitaCliente,
      fechaVisitaCliente: record.fechaVisitaCliente ?? record.fechaVisita ?? undefined,
      facturado,
      valor,
      nuevoServicio: record.nuevoServicio ?? 'no',
      servicioNuevo: record.servicioNuevo ?? undefined,
      facturacionLineas: hasLineBilling
        ? (facturacionLineas as JsonInput)
        : (record.servicios as string[]).length > 0 && valor > 0
          ? Object.fromEntries(
              (record.servicios as string[]).map((s) => [s, Math.floor(valor / (record.servicios as string[]).length)]),
            ) as JsonInput
          : (record.facturacionLineas as JsonInput),
      estadoProspecto: record.estadoProspecto === 'facturado'
        ? record.estadoProspecto
        : 'facturado',
    },
  });

  await prisma.actividad.create({
    data: {
      recordId: id,
      tipo: 'seguimiento',
      descripcion: 'Convertido de prospecto a cliente activo',
      fecha: new Date(),
      hecho: true,
    },
  });

  const { getOrCreateMatriz } = await import('../matriz-riesgos/matriz-riesgos.service');
  await getOrCreateMatriz(id);

  const { getOrCreateGD } = await import('../gestion-documental/gestion-documental.service');
  await getOrCreateGD(id);

  return getRecordById(id);
}
