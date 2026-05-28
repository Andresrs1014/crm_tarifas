import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../database';
import { config } from '../../config';

export interface LoginResult {
  access_token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

function signToken(user: { id: string; username: string; role: string }): string {
  return jwt.sign(
    { sub: user.username, role: user.role, userId: user.id },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
  );
}

export async function loginWithCredentials(
  username: string,
  password: string
): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
  }

  const token = signToken(user);
  return {
    access_token: token,
    user: { id: user.id, username: user.username, role: user.role },
  };
}

export async function loginWithSso(intranetToken: string): Promise<LoginResult> {
  // Verify the intranet JWT using the SHARED secret
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(intranetToken, config.jwtSecret) as jwt.JwtPayload;
  } catch {
    throw Object.assign(new Error('Token SSO inválido o expirado'), { statusCode: 401 });
  }

  const username: string = (payload.sub as string) || (payload.username as string);
  if (!username) {
    throw Object.assign(new Error('Token SSO sin usuario'), { statusCode: 401 });
  }

  // Look up or create user in CRM's own users table
  let user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    // Auto-provision with default "usuario" role
    const hashedPw = await bcrypt.hash(Math.random().toString(36), 10);
    user = await prisma.user.create({
      data: {
        username,
        password: hashedPw,
        role: 'usuario',
      },
    });
  }

  const token = signToken(user);
  return {
    access_token: token,
    user: { id: user.id, username: user.username, role: user.role },
  };
}
