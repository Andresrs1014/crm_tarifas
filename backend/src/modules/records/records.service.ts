import prisma from '../../database';

type JsonInput = Record<string, unknown> | unknown[];

export interface RecordFilters {
  tipo?: string;
  estado?: string;
  comercialId?: string;
  search?: string;
  fecha?: string;
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
    },
  });
  if (!record) throw Object.assign(new Error('Registro no encontrado'), { statusCode: 404 });
  return record;
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
  }>;
}) {
  const { contactos, ...recordData } = data;

  return prisma.record.create({
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
