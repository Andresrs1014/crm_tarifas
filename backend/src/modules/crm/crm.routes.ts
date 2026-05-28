import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import prisma from '../../database';

const router = Router();
router.use(authenticate);

const ESTADOS_PIPELINE = [
  'prospecto',
  'reconocimiento',
  'propuesta',
  'aceptacion_propuesta',
  'creacion_sop',
  'facturado',
] as const;

// GET /api/crm/pipeline — registros agrupados por estado_pipeline con stats
router.get('/pipeline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { comercialId } = req.query;

    const where: Record<string, unknown> = { tipo: 'prospecto' };
    if (comercialId) where.comercialId = comercialId as string;

    const records = await prisma.record.findMany({
      where,
      include: {
        comercial: { select: { id: true, nombre: true } },
        crmMeta: true,
        _count: { select: { actividades: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Agrupar por estado_pipeline
    const pipeline: Record<string, unknown[]> = {};
    for (const estado of ESTADOS_PIPELINE) {
      pipeline[estado] = [];
    }

    for (const record of records) {
      const estado = record.crmMeta?.estadoPipeline ?? 'prospecto';
      if (!pipeline[estado]) pipeline[estado] = [];
      pipeline[estado].push({
        id: record.id,
        empresa: record.empresa,
        ciudad: record.ciudad,
        comercial: record.comercial,
        servicios: record.servicios,
        ingresosEsperados: record.crmMeta?.ingresosCrm ?? record.ingresosEsperados,
        estadoPipeline: estado,
        tiempos: record.crmMeta?.tiempos ?? {},
        actividadesCount: record._count.actividades,
        fecha: record.fecha,
        createdAt: record.createdAt,
      });
    }

    // Stats por columna
    const stats = Object.fromEntries(
      Object.entries(pipeline).map(([estado, items]) => [
        estado,
        {
          count: items.length,
          totalIngresos: (items as { ingresosEsperados?: number }[])
            .reduce((sum, r) => sum + (r.ingresosEsperados ?? 0), 0),
        },
      ])
    );

    res.json({ pipeline, stats });
  } catch (err) {
    next(err);
  }
});

// PUT /api/crm/:id/estado — cambia estado pipeline y registra tiempo
router.put('/:id/estado', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { estado } = z.object({
      estado: z.enum(ESTADOS_PIPELINE),
    }).parse(req.body);

    const now = new Date().toISOString();

    // Buscar o crear CrmMeta
    let meta = await prisma.crmMeta.findUnique({ where: { recordId: req.params.id } });

    if (!meta) {
      meta = await prisma.crmMeta.create({
        data: { recordId: req.params.id, estadoPipeline: estado },
      });
    }

    // Registrar tiempo de salida del estado anterior y entrada al nuevo
    const tiempos = (meta.tiempos as Record<string, { entrada?: string; salida?: string }>) ?? {};
    const estadoAnterior = meta.estadoPipeline;

    if (estadoAnterior && estadoAnterior !== estado) {
      if (!tiempos[estadoAnterior]) tiempos[estadoAnterior] = {};
      tiempos[estadoAnterior].salida = now;
    }

    if (!tiempos[estado]) tiempos[estado] = {};
    tiempos[estado].entrada = now;

    const updated = await prisma.crmMeta.update({
      where: { recordId: req.params.id },
      data: { estadoPipeline: estado, tiempos },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /api/crm/:id/meta
router.get('/:id/meta', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meta = await prisma.crmMeta.findUnique({ where: { recordId: req.params.id } });
    if (!meta) {
      // Auto-crear si no existe
      const created = await prisma.crmMeta.create({
        data: { recordId: req.params.id, estadoPipeline: 'prospecto' },
      });
      res.json(created);
      return;
    }
    res.json(meta);
  } catch (err) {
    next(err);
  }
});

// PUT /api/crm/:id/meta — actualiza notas e ingresos CRM
router.put('/:id/meta', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      obs: z.string().optional(),
      ingresosCrm: z.number().int().optional(),
    }).parse(req.body);

    const meta = await prisma.crmMeta.upsert({
      where: { recordId: req.params.id },
      create: { recordId: req.params.id, ...body },
      update: body,
    });

    res.json(meta);
  } catch (err) {
    next(err);
  }
});

// GET /api/crm/actividades/vencidas — visitas fecha<=hoy y hecho=false
router.get('/actividades/vencidas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { comercialId } = req.query;

    const vencidas = await prisma.actividad.findMany({
      where: {
        tipo: 'visita',
        hecho: false,
        fecha: { lte: new Date() },
        ...(comercialId
          ? { record: { comercialId: comercialId as string } }
          : {}),
      },
      include: {
        record: {
          select: {
            id: true,
            empresa: true,
            comercialId: true,
            comercial: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fecha: 'asc' },
      take: 20,
    });

    res.json(vencidas);
  } catch (err) {
    next(err);
  }
});

export default router;
