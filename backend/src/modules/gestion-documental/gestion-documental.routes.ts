import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { listGD, getOrCreateGD, upsertGD } from './gestion-documental.service';

const router = Router();
router.use(authenticate);

// GET /api/gestion-documental
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, vencimiento, estadoDocs } = req.query;
    const data = await listGD({
      search:     typeof search     === 'string' ? search     : undefined,
      vencimiento:typeof vencimiento=== 'string' ? vencimiento: undefined,
      estadoDocs: typeof estadoDocs === 'string' ? estadoDocs : undefined,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/gestion-documental/:recordId
router.get('/:recordId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getOrCreateGD(String(req.params.recordId));
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/gestion-documental/:recordId
router.put('/:recordId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await upsertGD(String(req.params.recordId), req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
