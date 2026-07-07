import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, param } from '../../middleware/auth';
import {
  listTarifasEspeciales,
  createTarifaEspecial,
  updateTarifaEspecial,
  deleteTarifaEspecial,
} from './tarifas-especiales.service';

const router = Router();
router.use(authenticate);

const CreateSchema = z.object({
  espKey: z.string().min(1),
  svc: z.string().min(1),
  nombre: z.string().min(1),
  grupos: z.array(z.unknown()),
});

const UpdateSchema = z.object({
  nombre: z.string().min(1).optional(),
  grupos: z.array(z.unknown()).optional(),
});

// GET /api/tarifas-especiales?espKey=Zona%20Franca
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const espKey = req.query.espKey;
    if (typeof espKey !== 'string' || !espKey) {
      res.status(400).json({ error: 'espKey es requerido' });
      return;
    }
    const data = await listTarifasEspeciales(espKey);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/tarifas-especiales
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CreateSchema.parse(req.body);
    const data = await createTarifaEspecial(body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/tarifas-especiales/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = UpdateSchema.parse(req.body);
    const data = await updateTarifaEspecial(param(req.params.id), body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tarifas-especiales/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteTarifaEspecial(param(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
