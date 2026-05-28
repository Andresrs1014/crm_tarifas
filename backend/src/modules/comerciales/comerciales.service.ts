import prisma from '../../database';

export async function listComerciales(includeInactive = false) {
  return prisma.comercial.findMany({
    where: includeInactive ? {} : { activo: true },
    orderBy: { nombre: 'asc' },
  });
}

export async function createComercial(data: {
  nombre: string;
  cargo?: string;
  email?: string;
  tel?: string;
  activo?: boolean;
}) {
  return prisma.comercial.create({ data });
}

export async function updateComercial(
  id: string,
  data: {
    nombre?: string;
    cargo?: string;
    email?: string;
    tel?: string;
    activo?: boolean;
  }
) {
  return prisma.comercial.update({ where: { id }, data });
}

export async function deleteComercial(id: string) {
  // Check if comercial has records
  const count = await prisma.record.count({ where: { comercialId: id } });
  if (count > 0) {
    throw Object.assign(
      new Error(`No se puede eliminar: el comercial tiene ${count} registros asociados`),
      { statusCode: 400 }
    );
  }
  await prisma.comercial.delete({ where: { id } });
}
