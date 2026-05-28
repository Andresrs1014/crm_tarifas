import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { listMatriz, getOrCreateMatriz, upsertMatriz } from './matriz-riesgos.service';

const router = Router();
router.use(authenticate);

// GET /api/matriz-riesgos — lista todos los clientes con su matriz
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, riesgo, completa } = req.query;
    const data = await listMatriz({
      search:   typeof search   === 'string' ? search   : undefined,
      riesgo:   typeof riesgo   === 'string' ? riesgo   : undefined,
      completa: typeof completa === 'string' ? completa : undefined,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/matriz-riesgos/:recordId — obtiene (o crea) la matriz de un cliente
router.get('/:recordId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getOrCreateMatriz(String(req.params.recordId));
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/matriz-riesgos/:recordId — upsert completo de la matriz
router.put('/:recordId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await upsertMatriz(String(req.params.recordId), req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
