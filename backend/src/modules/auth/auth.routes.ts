import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { loginWithCredentials, loginWithSso } from './auth.service';
import { authenticate } from '../../middleware/auth';
import prisma from '../../database';

const router = Router();

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// Accept both 'token' (from frontend) and 'sso_token' for compatibility
const SsoSchema = z.object({
  token: z.string().optional(),
  sso_token: z.string().optional(),
}).transform((data) => ({
  sso_token: data.token || data.sso_token || '',
})).refine((data) => data.sso_token.length > 0, { message: 'Token requerido' });

// POST /api/auth/login — direct login with CRM credentials
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = LoginSchema.parse(req.body);
    const result = await loginWithCredentials(body.username, body.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/sso — SSO token exchange from intranet
router.post('/sso', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = SsoSchema.parse(req.body);
    const result = await loginWithSso(body.sso_token);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — get current user from CRM token
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.user!.sub },
      select: { id: true, username: true, role: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
