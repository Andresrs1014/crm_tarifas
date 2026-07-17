import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { authenticate, param } from '../../middleware/auth';
import { listGD, getRow, getOrCreateGD, upsertGD, addArchivos, findArchivo, removeArchivo, iniciarCiclo, getHistorial, GD_DOCS } from './gestion-documental.service';
import { upload, archivoFilePath, docDir, matchesMagicBytes } from './gestion-documental.upload';

const router = Router();
router.use(authenticate);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** docId viene de una lista fija (GD_DOCS) y recordId/archivoId deben ser UUID — evita path traversal en las rutas de archivos. */
function validateArchivoParams(req: Request, res: Response, next: NextFunction): void {
  const { recordId, archivoId } = req.params;
  const docId = param(req.params.docId);
  if (!UUID_RE.test(String(recordId))) {
    res.status(400).json({ error: 'recordId inválido' });
    return;
  }
  if (!GD_DOCS.some(d => d.id === docId)) {
    res.status(400).json({ error: 'Documento no reconocido' });
    return;
  }
  if (archivoId !== undefined && !UUID_RE.test(String(archivoId))) {
    res.status(400).json({ error: 'archivoId inválido' });
    return;
  }
  next();
}

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

// GET /api/gestion-documental/:recordId/detalle — fila enriquecida (para la página de detalle)
router.get('/:recordId/detalle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getRow(param(req.params.recordId));
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

// GET /api/gestion-documental/:recordId/historial
router.get('/:recordId/historial', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getHistorial(param(req.params.recordId));
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/gestion-documental/:recordId/iniciar-ciclo
router.post('/:recordId/iniciar-ciclo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await iniciarCiclo(param(req.params.recordId));
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/gestion-documental/:recordId/docs/:docId/archivos
router.post(
  '/:recordId/docs/:docId/archivos',
  validateArchivoParams,
  (req: Request, res: Response, next: NextFunction) => {
    upload.array('archivos', 10)(req, res, (err: unknown) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Error al subir archivo' });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const recordId = param(req.params.recordId);
      const docId = param(req.params.docId);
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      if (files.length === 0) {
        res.status(400).json({ error: 'Se requiere al menos un archivo' });
        return;
      }
      // El contenido real debe coincidir con la extensión declarada — nombre/mimetype del cliente no son confiables.
      for (const f of files) {
        if (!matchesMagicBytes(f.originalname, f.buffer)) {
          res.status(400).json({ error: `El archivo "${f.originalname}" no coincide con el tipo declarado` });
          return;
        }
      }
      // El registro debe existir como cliente ANTES de escribir cualquier archivo a disco.
      await getOrCreateGD(recordId);

      const dir = docDir(recordId, docId);
      fs.mkdirSync(dir, { recursive: true });
      const nuevos = files.map(f => {
        const id = crypto.randomUUID();
        const ext = path.extname(f.originalname).toLowerCase();
        fs.writeFileSync(path.join(dir, `${id}${ext}`), f.buffer);
        return { id, nombre: f.originalname, size: f.size, mime: f.mimetype, uploadedAt: new Date().toISOString() };
      });
      const data = await addArchivos(recordId, docId, nuevos);
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/gestion-documental/:recordId/docs/:docId/archivos/:archivoId
router.get('/:recordId/docs/:docId/archivos/:archivoId', validateArchivoParams, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recordId = param(req.params.recordId);
    const docId = param(req.params.docId);
    const archivoId = param(req.params.archivoId);
    const archivo = await findArchivo(recordId, docId, archivoId);
    if (!archivo) {
      res.status(404).json({ error: 'Archivo no encontrado' });
      return;
    }
    const filePath = archivoFilePath(recordId, docId, archivoId, archivo.nombre);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Archivo no encontrado en disco' });
      return;
    }
    res.setHeader('Content-Type', archivo.mime);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(archivo.nombre)}"`);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/gestion-documental/:recordId/docs/:docId/archivos/:archivoId
router.delete('/:recordId/docs/:docId/archivos/:archivoId', validateArchivoParams, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recordId = param(req.params.recordId);
    const docId = param(req.params.docId);
    const archivoId = param(req.params.archivoId);
    const { updated, archivo } = await removeArchivo(recordId, docId, archivoId);
    if (archivo) {
      fs.promises.unlink(archivoFilePath(recordId, docId, archivoId, archivo.nombre)).catch(() => {});
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
