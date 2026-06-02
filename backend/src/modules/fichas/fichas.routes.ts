import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import prisma from '../../database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonInput = any;

const router = Router();
router.use(authenticate);

// GET /api/fichas/analistas — list analysts (must be before /:id)
router.get('/analistas', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const analistas = await prisma.analista.findMany({ orderBy: { nombre: 'asc' } });
    res.json(analistas);
  } catch (err) { next(err); }
});

// POST /api/fichas/analistas — create analyst
router.post('/analistas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre, email, tel } = req.body as { nombre: string; email?: string; tel?: string };
    const analista = await prisma.analista.create({ data: { nombre, email, tel } });
    res.status(201).json(analista);
  } catch (err) { next(err); }
});

// DELETE /api/fichas/analistas/:id — delete analyst
router.delete('/analistas/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.analista.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// GET /api/fichas — list all fichas with record info
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { estado, comercialId } = req.query as { estado?: string; comercialId?: string };
    const fichas = await prisma.fichaCliente.findMany({
      where: {
        ...(estado ? { estado } : {}),
        record: comercialId ? { comercialId } : undefined,
      },
      include: {
        record: {
          select: { id: true, empresa: true, ciudad: true, tipoCliente: true, comercial: { select: { nombre: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(fichas);
  } catch (err) { next(err); }
});

// GET /api/fichas/record/:recordId — get or create ficha for a record
router.get('/record/:recordId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recordId } = req.params;
    let ficha = await prisma.fichaCliente.findUnique({ where: { recordId: String(recordId) } });
    if (!ficha) {
      ficha = await prisma.fichaCliente.create({ data: { recordId: String(recordId) } });
    }
    res.json(ficha);
  } catch (err) { next(err); }
});

// PUT /api/fichas/:id — update ficha
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { estado, pct, data } = req.body as { estado?: string; pct?: number; data?: Record<string, unknown> };
    const updated = await prisma.fichaCliente.update({
      where: { id: String(req.params.id) },
      data: {
        ...(estado !== undefined && { estado }),
        ...(pct !== undefined && { pct }),
        ...(data !== undefined && { data: data as JsonInput }),
      },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

export default router;
