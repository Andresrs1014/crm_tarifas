import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, param } from '../../middleware/auth';
import { requireRole } from '../../middleware/requireRole';
import {
  listUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from './usuarios.service';

const router = Router();

router.use(authenticate, requireRole('superadmin'));

const CreateSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(['superadmin', 'usuario']).default('usuario'),
});

const UpdateSchema = z.object({
  username: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['superadmin', 'usuario']).optional(),
});

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await listUsuarios();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CreateSchema.parse(req.body);
    const user = await createUsuario(body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = UpdateSchema.parse(req.body);
    const user = await updateUsuario(param(req.params.id), body);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteUsuario(param(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
