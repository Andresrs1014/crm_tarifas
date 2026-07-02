import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../database';

export interface JwtPayload {
  sub: string;
  role: string;
  userId?: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** Extract a guaranteed string from Express params (typed as string | string[] in Express v5) */
export const param = (v: string | string[]): string => (Array.isArray(v) ? v[0] : v);


/** UUID del usuario autenticado (FK a users.id). sub es username, no id. */
export async function getAuthenticatedUserId(req: Request): Promise<string> {
  if (req.user?.userId) return req.user.userId;

  const user = await prisma.user.findUnique({
    where: { username: req.user!.sub },
    select: { id: true },
  });
  if (!user) {
    throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
  }
  return user.id;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
