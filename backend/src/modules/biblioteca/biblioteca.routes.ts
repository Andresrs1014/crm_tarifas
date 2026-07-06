import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, param } from '../../middleware/auth';
import {
  getFullBiblioteca,
  createLinea,
  updateLinea,
  deleteLinea,
  createGrupo,
  updateGrupo,
  deleteGrupo,
  createItem,
  updateItem,
  deleteItem,
  getObsByLinea,
  createObs,
  updateObs,
  deleteObs,
} from './biblioteca.service';

const router = Router();
router.use(authenticate);

const LineaSchema = z.object({
  nombre: z.string().min(1),
  orden: z.number().int().optional(),
  columnas: z.array(z.unknown()).optional(),
});

const GrupoSchema = z.object({
  nombre: z.string().min(1),
  orden: z.number().int().optional(),
  obsEcommerce: z.string().optional(),
});

const ItemSchema = z.object({
  nombre: z.string().min(1),
  tarifa: z.string().min(1),
  tipoTarifa: z.string().optional(),
  obs: z.string().optional(),
  extraCols: z.record(z.unknown()).optional(),
  orden: z.number().int().optional(),
});

const ObsSchema = z.object({
  nombre: z.string().min(1),
  html: z.string(),
});

// GET /api/biblioteca — full tree
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getFullBiblioteca();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// --- Lineas ---
router.post('/lineas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = LineaSchema.parse(req.body);
    const linea = await createLinea(body);
    res.status(201).json(linea);
  } catch (err) {
    next(err);
  }
});

router.put('/lineas/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = LineaSchema.partial().parse(req.body);
    const linea = await updateLinea(param(req.params.id), body);
    res.json(linea);
  } catch (err) {
    next(err);
  }
});

router.delete('/lineas/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteLinea(param(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --- Grupos ---
router.post('/lineas/:id/grupos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = GrupoSchema.parse(req.body);
    const grupo = await createGrupo(param(req.params.id), body);
    res.status(201).json(grupo);
  } catch (err) {
    next(err);
  }
});

router.put('/grupos/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = GrupoSchema.partial().parse(req.body);
    const grupo = await updateGrupo(param(req.params.id), body);
    res.json(grupo);
  } catch (err) {
    next(err);
  }
});

router.delete('/grupos/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteGrupo(param(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --- Items ---
router.post('/grupos/:id/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = ItemSchema.parse(req.body);
    const item = await createItem(param(req.params.id), body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

router.put('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = ItemSchema.partial().parse(req.body);
    const item = await updateItem(param(req.params.id), body);
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteItem(param(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --- Obs ---
router.get('/lineas/:id/obs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const obs = await getObsByLinea(param(req.params.id));
    res.json(obs);
  } catch (err) {
    next(err);
  }
});

router.post('/lineas/:id/obs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = ObsSchema.parse(req.body);
    const obs = await createObs(param(req.params.id), body);
    res.status(201).json(obs);
  } catch (err) {
    next(err);
  }
});

router.put('/obs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = ObsSchema.partial().parse(req.body);
    const obs = await updateObs(param(req.params.id), body);
    res.json(obs);
  } catch (err) {
    next(err);
  }
});

router.delete('/obs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteObs(param(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
