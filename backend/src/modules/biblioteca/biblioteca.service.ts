import prisma from '../../database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonInput = any;

export async function getFullBiblioteca() {
  return prisma.bibliotecaLinea.findMany({
    orderBy: { orden: 'asc' },
    include: {
      grupos: {
        orderBy: { orden: 'asc' },
        include: {
          items: { orderBy: { orden: 'asc' } },
        },
      },
      obs: true,
    },
  });
}

// --- Lineas ---
export async function createLinea(data: { nombre: string; orden?: number; columnas?: unknown[] }) {
  return prisma.bibliotecaLinea.create({
    data: {
      nombre: data.nombre,
      orden: data.orden ?? 0,
      columnas: (data.columnas ?? []) as JsonInput,
    },
  });
}

export async function updateLinea(
  id: string,
  data: { nombre?: string; orden?: number; columnas?: unknown[] }
) {
  return prisma.bibliotecaLinea.update({
    where: { id },
    data: {
      ...(data.nombre !== undefined && { nombre: data.nombre }),
      ...(data.orden !== undefined && { orden: data.orden }),
      ...(data.columnas !== undefined && { columnas: data.columnas as JsonInput }),
    },
  });
}

export async function deleteLinea(id: string) {
  await prisma.bibliotecaLinea.delete({ where: { id } });
}

// --- Grupos ---
export async function createGrupo(lineaId: string, data: { nombre: string; orden?: number }) {
  return prisma.bibliotecaGrupo.create({
    data: { lineaId, nombre: data.nombre, orden: data.orden ?? 0 },
  });
}

export async function updateGrupo(id: string, data: { nombre?: string; orden?: number }) {
  return prisma.bibliotecaGrupo.update({ where: { id }, data });
}

export async function deleteGrupo(id: string) {
  await prisma.bibliotecaGrupo.delete({ where: { id } });
}

// --- Items ---
export async function createItem(
  grupoId: string,
  data: {
    nombre: string;
    tarifa: string;
    tipoTarifa?: string;
    obs?: string;
    extraCols?: Record<string, unknown>;
    orden?: number;
  }
) {
  return prisma.bibliotecaItem.create({
    data: {
      grupoId,
      nombre: data.nombre,
      tarifa: data.tarifa,
      tipoTarifa: data.tipoTarifa ?? 'moneda',
      obs: data.obs,
      extraCols: (data.extraCols ?? {}) as JsonInput,
      orden: data.orden ?? 0,
    },
  });
}

export async function updateItem(
  id: string,
  data: {
    nombre?: string;
    tarifa?: string;
    tipoTarifa?: string;
    obs?: string;
    extraCols?: Record<string, unknown>;
    orden?: number;
  }
) {
  return prisma.bibliotecaItem.update({
    where: { id },
    data: {
      ...(data.nombre !== undefined && { nombre: data.nombre }),
      ...(data.tarifa !== undefined && { tarifa: data.tarifa }),
      ...(data.tipoTarifa !== undefined && { tipoTarifa: data.tipoTarifa }),
      ...(data.obs !== undefined && { obs: data.obs }),
      ...(data.extraCols !== undefined && { extraCols: data.extraCols as JsonInput }),
      ...(data.orden !== undefined && { orden: data.orden }),
    },
  });
}

export async function deleteItem(id: string) {
  await prisma.bibliotecaItem.delete({ where: { id } });
}

// --- Obs ---
export async function getObsByLinea(lineaId: string) {
  return prisma.bibliotecaObs.findMany({ where: { lineaId } });
}

export async function createObs(lineaId: string, data: { nombre: string; html: string }) {
  return prisma.bibliotecaObs.create({ data: { lineaId, nombre: data.nombre, html: data.html } });
}

export async function updateObs(id: string, data: { nombre?: string; html?: string }) {
  return prisma.bibliotecaObs.update({ where: { id }, data });
}

export async function deleteObs(id: string) {
  await prisma.bibliotecaObs.delete({ where: { id } });
}
