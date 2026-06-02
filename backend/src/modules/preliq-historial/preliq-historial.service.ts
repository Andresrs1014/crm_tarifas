import prisma from '../../database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonInput = any;

export async function listPreliqHistorial(userId: string) {
  return prisma.preliqHistorial.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function createPreliqHistorial(userId: string, data: {
  empresa: string;
  cotNumero: string;
  servicios: string[];
  parametros: Record<string, unknown>;
  lineas: unknown[];
  total: number;
}) {
  return prisma.preliqHistorial.create({
    data: {
      userId,
      empresa:    data.empresa,
      cotNumero:  data.cotNumero,
      servicios:  data.servicios as JsonInput,
      parametros: data.parametros as JsonInput,
      lineas:     data.lineas as JsonInput,
      total:      data.total,
    },
  });
}

export async function deletePreliqHistorial(id: string, userId: string) {
  const entry = await prisma.preliqHistorial.findUnique({ where: { id } });
  if (!entry || entry.userId !== userId) {
    throw Object.assign(new Error('No encontrado'), { statusCode: 404 });
  }
  await prisma.preliqHistorial.delete({ where: { id } });
}
