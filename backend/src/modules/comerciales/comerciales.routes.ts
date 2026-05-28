import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, param } from '../../middleware/auth';
import {
  listComerciales,
  createComercial,
  updateComercial,
  deleteComercial,
} from './comerciales.service';

const router = Router();
router.use(authenticate);

const CreateSchema = z.object({
  nombre: z.string().min(1),
  cargo: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  tel: z.string().optional(),
  activo: z.boolean().optional(),
});

const UpdateSchema = CreateSchema.partial();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const includeInactive = req.query.all === 'true';
    const data = await listComerciales(includeInactive);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CreateSchema.parse(req.body);
    const comercial = await createComercial(body);
    res.status(201).json(comercial);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = UpdateSchema.parse(req.body);
    const comercial = await updateComercial(param(req.params.id), body);
    res.json(comercial);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteComercial(param(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
