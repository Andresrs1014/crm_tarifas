import prisma from '../../database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonInput = any;

export async function listTarifasEspeciales(espKey: string) {
  return prisma.tarifaEspecial.findMany({
    where: { espKey },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createTarifaEspecial(data: { espKey: string; svc: string; nombre: string; grupos: unknown[] }) {
  return prisma.tarifaEspecial.create({
    data: {
      espKey: data.espKey,
      svc: data.svc,
      nombre: data.nombre,
      grupos: data.grupos as JsonInput,
    },
  });
}

export async function updateTarifaEspecial(id: string, data: { nombre?: string; grupos?: unknown[] }) {
  return prisma.tarifaEspecial.update({
    where: { id },
    data: {
      ...(data.nombre !== undefined && { nombre: data.nombre }),
      ...(data.grupos !== undefined && { grupos: data.grupos as JsonInput }),
    },
  });
}

export async function deleteTarifaEspecial(id: string) {
  await prisma.tarifaEspecial.delete({ where: { id } });
}
