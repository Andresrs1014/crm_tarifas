import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import prisma from '../../database';

const router = Router();
router.use(authenticate);

// GET /api/sac/contactos?mes=1..12
router.get('/contactos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mes } = req.query as { mes?: string };

    const contactos = await prisma.contacto.findMany({
      where: mes
        ? {
            cumpleanos: {
              not: null,
              contains: `-${mes.padStart(2, '0')}-`,
            },
          }
        : { cumpleanos: { not: null } },
      include: {
        record: {
          select: {
            empresa: true,
            categoria: true,
            tipoCliente: true,
            comercial: { select: { nombre: true } },
          },
        },
      },
      orderBy: { cumpleanos: 'asc' },
    });

    const result = contactos.map((c) => ({
      ...c,
      empresa: c.record.empresa,
      comercial: c.record.comercial.nombre,
      categoria: (c.record as unknown as Record<string, unknown>).categoria ?? null,
      tipoCliente: (c.record as unknown as Record<string, unknown>).tipoCliente ?? null,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/sac/fda → todos los contactos con recibeRegalos=true (para sección Fin de Año)
router.get('/fda', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contactos = await prisma.contacto.findMany({
      where: { recibeRegalos: true },
      include: {
        record: {
          select: {
            empresa: true,
            categoria: true,
            tipoCliente: true,
            comercial: { select: { nombre: true } },
          },
        },
      },
      orderBy: [{ fdaEntregado: 'asc' }, { cumpleanos: 'asc' }],
    });
    const result = contactos.map((c) => ({
      ...c,
      empresa: c.record.empresa,
      comercial: c.record.comercial.nombre,
      categoria: (c.record as unknown as Record<string, unknown>).categoria ?? null,
      tipoCliente: (c.record as unknown as Record<string, unknown>).tipoCliente ?? null,
    }));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/sac/contactos/:id/datos → edita cargo, telefono, email del contacto
router.patch('/contactos/:id/datos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cargo, telefono, email, direccion } = req.body as {
      cargo?: string; telefono?: string; email?: string; direccion?: string;
    };
    const updated = await prisma.contacto.update({
      where: { id: String(req.params.id) },
      data: {
        ...(cargo     !== undefined && { cargo }),
        ...(telefono  !== undefined && { telefono }),
        ...(email     !== undefined && { email }),
        ...(direccion !== undefined && { direccion }),
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/sac/contactos/:id/fotos
router.patch('/contactos/:id/fotos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fotos, fdaEntregado } = req.body as {
      fotos?: string[];
      fdaEntregado?: boolean;
    };

    const updated = await prisma.contacto.update({
      where: { id: String(req.params.id) },
      data: {
        ...(fotos !== undefined && { fotosEntrega: fotos }),
        ...(fdaEntregado !== undefined && { fdaEntregado }),
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
