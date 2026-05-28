import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import prisma from '../../database';

const router = Router();
router.use(authenticate);

const ActividadSchema = z.object({
  tipo: z.enum(['llamada', 'reunion', 'email', 'visita', 'tarea', 'seguimiento']),
  descripcion: z.string().min(1),
  fecha: z.string(),
  hora: z.string().optional(),    // "14:30" — solo para visita
  lugar: z.string().optional(),   // dirección/lugar — solo para visita
  origen: z.string().optional(),  // "gestion-documental" | null
  hecho: z.boolean().optional(),
});

const ActividadUpdateSchema = ActividadSchema.partial();

// POST /api/records/:recordId/actividades
router.post(
  '/records/:recordId/actividades',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = ActividadSchema.parse(req.body);
      const actividad = await prisma.actividad.create({
        data: {
          recordId: String(req.params.recordId),
          tipo: body.tipo,
          descripcion: body.descripcion,
          fecha: new Date(body.fecha),
          hora: body.hora,
          lugar: body.lugar,
          origen: body.origen,
          hecho: body.hecho ?? false,
        },
      });
      res.status(201).json(actividad);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/actividades/:id
router.put('/actividades/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = ActividadUpdateSchema.parse(req.body);
    const updateData: Record<string, unknown> = {};
    if (body.tipo !== undefined) updateData.tipo = body.tipo;
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
    if (body.fecha !== undefined) updateData.fecha = new Date(body.fecha);
    if (body.hora !== undefined) updateData.hora = body.hora;
    if (body.lugar !== undefined) updateData.lugar = body.lugar;
    if (body.origen !== undefined) updateData.origen = body.origen;
    if (body.hecho !== undefined) updateData.hecho = body.hecho;

    const actividad = await prisma.actividad.update({
      where: { id: String(req.params.id) },
      data: updateData,
    });
    res.json(actividad);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/actividades/:id
router.delete('/actividades/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.actividad.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
