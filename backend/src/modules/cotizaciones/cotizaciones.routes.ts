import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, param } from '../../middleware/auth';
import {
  listCotizaciones,
  getCotizacionById,
  createCotizacion,
  updateCotizacion,
  deleteCotizacion,
  duplicarCotizacion,
  actualizarTarifas,
} from './cotizaciones.service';

const router = Router();
router.use(authenticate);

const CotizacionSchema = z.object({
  recordId: z.string().uuid().optional(),
  empresa: z.string().min(1),
  nit: z.string().optional(),
  ciudad: z.string().optional(),
  contacto: z.string().optional(),
  cargo: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().optional(),
  comercial: z.string().min(1),
  paqueteadora: z.string().optional(),
  tarifaTipo: z.string().optional(),
  tarifaTipoPorLinea: z.record(z.string()).optional(),
  tarifaEspecialIdPorLinea: z.record(z.string()).optional(),
  tarifaEspecialGrupos: z.record(z.unknown()).optional(),
  estado: z.string().optional(),
  fecha: z.string().optional(),
  vigencia: z.string().optional(),
  asunto: z.string().optional(),
  lineas: z.array(z.unknown()).optional(),
  itemsSnapshot: z.record(z.unknown()).optional(),
  obsHtml: z.record(z.unknown()).optional(),
  obsLibre: z.string().optional(),
  htmlPreview: z.string().optional(),
});

// GET /api/cotizaciones
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await listCotizaciones({
      estado: req.query.estado as string | undefined,
      search: req.query.search as string | undefined,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/cotizaciones
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CotizacionSchema.parse(req.body);
    const cot = await createCotizacion(body);
    res.status(201).json(cot);
  } catch (err) {
    next(err);
  }
});

// GET /api/cotizaciones/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cot = await getCotizacionById(param(req.params.id));
    res.json(cot);
  } catch (err) {
    next(err);
  }
});

// PUT /api/cotizaciones/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CotizacionSchema.partial().parse(req.body);
    const cot = await updateCotizacion(param(req.params.id), body);
    res.json(cot);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cotizaciones/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteCotizacion(param(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/cotizaciones/:id/duplicar
router.post('/:id/duplicar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cot = await duplicarCotizacion(param(req.params.id));
    res.status(201).json(cot);
  } catch (err) {
    next(err);
  }
});

// POST /api/cotizaciones/:id/actualizar-tarifas
router.post(
  '/:id/actualizar-tarifas',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { incremento } = z.object({ incremento: z.number() }).parse(req.body);
      const result = await actualizarTarifas(param(req.params.id), incremento);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
