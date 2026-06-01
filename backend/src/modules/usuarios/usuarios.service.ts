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
  data: {
    username?: string;
    password?: string;
    role?: string;
    esComercial?: boolean;
    nombreComercial?: string;
    cargo?: string;
    email?: string;
    tel?: string;
  }
) {
  const userUpdate: Record<string, unknown> = {};
  if (data.username) userUpdate.username = data.username;
  if (data.role)     userUpdate.role     = data.role;
  if (data.password) userUpdate.password = await bcrypt.hash(data.password, 10);

  if (data.esComercial === true) {
    // Verificar si ya tiene un comercial vinculado
    const existing = await prisma.comercial.findUnique({ where: { userId: id } });
    if (existing) {
      // Actualizar datos del comercial existente
      await prisma.comercial.update({
        where: { userId: id },
        data: {
          nombre: data.nombreComercial ?? existing.nombre,
          cargo:  data.cargo  !== undefined ? data.cargo  : existing.cargo,
          email:  data.email  !== undefined ? data.email  : existing.email,
          tel:    data.tel    !== undefined ? data.tel    : existing.tel,
        },
      });
    } else {
      // Crear y vincular un nuevo comercial
      userUpdate.comercial = {
        create: {
          nombre: data.nombreComercial || 'Sin nombre',
          cargo:  data.cargo  || undefined,
          email:  data.email  || undefined,
          tel:    data.tel    || undefined,
          activo: true,
        },
      };
    }
  } else if (data.esComercial === false) {
    // Desvincular: eliminar comercial solo si no tiene records asignados
    const existing = await prisma.comercial.findUnique({ where: { userId: id } });
    if (existing) {
      const count = await prisma.record.count({ where: { comercialId: existing.id } });
      if (count > 0) {
        throw Object.assign(
          new Error(`No se puede quitar: el comercial tiene ${count} registros asignados`),
          { statusCode: 400 }
        );
      }
      await prisma.comercial.delete({ where: { userId: id } });
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: userUpdate,
    select: {
      id: true, username: true, role: true, createdAt: true,
      comercial: { select: { id: true, nombre: true, cargo: true } },
    },
  });
  return user;
}

export async function deleteUsuario(id: string) {
  await prisma.user.delete({ where: { id } });
}
