import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authenticate, param } from '../../middleware/auth';
import {
  listRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  convertProspectToCliente,
} from './records.service';
import { importRecordsFromExcel } from './records.import';

const router = Router();
router.use(authenticate);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const ContactoSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1),
  cargo: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().optional(),
  orden: z.number().int().optional(),
  cumpleanos: z.string().optional(),
  recibeRegalos: z.boolean().optional(),
  tipo: z.string().optional(),
});

const RecordCreateSchema = z.object({
  tipo: z.enum(['prospecto', 'cliente']),
  empresa: z.string().min(1),
  nit: z.string().optional(),
  ciudad: z.string().optional(),
  direccion: z.string().optional(),
  categoria: z.string().optional(),
  comercialId: z.string().uuid(),
  tipoCliente: z.string().optional(),
  clienteIndirectoId: z.string().optional(),
  comision: z.string().optional(),
  fecha: z.string(),
  proximoSeguimiento: z.string().optional(),
  observaciones: z.string().optional(),
  estadoProspecto: z.string().optional(),
  estadoCliente: z.string().optional(),
  visita: z.string().optional(),
  visitaCliente: z.string().optional(),
  fechaVisita: z.string().optional(),
  fechaVisitaCliente: z.string().optional(),
  facturadoP: z.string().optional(),
  facturado: z.string().optional(),
  valorP: z.number().int().optional(),
  valor: z.number().int().optional(),
  nuevoServicio: z.string().optional(),
  servicioNuevo: z.string().optional(),
  ingresosEsperados: z.number().int().optional(),
  servicios: z.array(z.unknown()).optional(),
  facturacionLineas: z.record(z.unknown()).optional(),
  contactos: z.array(ContactoSchema).optional(),
});

const RecordUpdateSchema = RecordCreateSchema.partial();

// GET /api/records
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const records = await listRecords({
      tipo: req.query.tipo as string | undefined,
      estado: req.query.estado as string | undefined,
      comercialId: req.query.comercialId as string | undefined,
      search: req.query.search as string | undefined,
      fecha: req.query.fecha as string | undefined,
    });
    res.json(records);
  } catch (err) {
    next(err);
  }
});

// POST /api/records/import — must be before /:id
router.post(
  '/import',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Se requiere un archivo Excel (.xlsx)' });
        return;
      }
      const result = await importRecordsFromExcel(req.file.buffer);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/records/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await getRecordById(param(req.params.id));
    res.json(record);
  } catch (err) {
    next(err);
  }
});

// POST /api/records
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = RecordCreateSchema.parse(req.body);
    const record = await createRecord(body);
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

// POST /api/records/:id/convert-to-cliente
router.post('/:id/convert-to-cliente', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await convertProspectToCliente(param(req.params.id));
    res.json(record);
  } catch (err) {
    next(err);
  }
});

// PUT /api/records/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = RecordUpdateSchema.parse(req.body);
    const record = await updateRecord(param(req.params.id), body);
    res.json(record);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/records/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteRecord(param(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
