import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, getAuthenticatedUserId, param } from '../../middleware/auth';
import { listPreliqHistorial, createPreliqHistorial, deletePreliqHistorial } from './preliq-historial.service';

const router = Router();
router.use(authenticate);

// GET /api/preliq-historial
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getAuthenticatedUserId(req);
    const data = await listPreliqHistorial(userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/preliq-historial
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getAuthenticatedUserId(req);
    const data = await createPreliqHistorial(userId, req.body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/preliq-historial/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getAuthenticatedUserId(req);
    await deletePreliqHistorial(param(req.params.id), userId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
