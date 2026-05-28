import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { getDashboardStats, getRanking, getRecientes } from './dashboard.service';

const router = Router();

router.use(authenticate);

// GET /api/dashboard?comercialId=&mes=&tipo=
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { comercialId, mes, tipo } = req.query as Record<string, string | undefined>;
    const stats = await getDashboardStats({ comercialId, mes, tipo });
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/ranking
router.get('/ranking', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const ranking = await getRanking();
    res.json(ranking);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/recientes
router.get('/recientes', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getRecientes();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
