import bcrypt from 'bcryptjs';
import prisma from '../../database';

export async function listUsuarios() {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
      comercial: { select: { id: true, nombre: true, cargo: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createUsuario(data: {
  username: string;
  password: string;
  role: string;
  esComercial?: boolean;
  nombreComercial?: string;
  cargo?: string;
  email?: string;
  tel?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing) {
    throw Object.assign(new Error('El usuario ya existe'), { statusCode: 400 });
  }
  const hashed = await bcrypt.hash(data.password, 10);

  if (data.esComercial) {
    // Crear usuario y comercial vinculados en una transacción
    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          username: data.username,
          password: hashed,
          role: data.role,
          comercial: {
            create: {
              nombre: data.nombreComercial || data.username,
              cargo: data.cargo,
              email: data.email,
              tel: data.tel,
              activo: true,
            },
          },
        },
        select: { id: true, username: true, role: true, createdAt: true },
      }),
    ]);
    return user;
  }

  const user = await prisma.user.create({
    data: { username: data.username, password: hashed, role: data.role },
    select: { id: true, username: true, role: true, createdAt: true },
  });
  return user;
}

export async function updateUsuario(
  id: string,
  data: { username?: string; password?: string; role?: string }
) {
  const updateData: Record<string, unknown> = {};
  if (data.username) updateData.username = data.username;
  if (data.role) updateData.role = data.role;
  if (data.password) updateData.password = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, username: true, role: true, createdAt: true },
  });
  return user;
}

export async function deleteUsuario(id: string) {
  await prisma.user.delete({ where: { id } });
}
