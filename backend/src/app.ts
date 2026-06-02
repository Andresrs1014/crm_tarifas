import express from 'express';
import cors from 'cors';

import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import comercialesRoutes from './modules/comerciales/comerciales.routes';
import recordsRoutes from './modules/records/records.routes';
import actividadesRoutes from './modules/actividades/actividades.routes';
import cotizacionesRoutes from './modules/cotizaciones/cotizaciones.routes';
import bibliotecaRoutes from './modules/biblioteca/biblioteca.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import sacRoutes from './modules/sac/sac.routes';
import usuariosRoutes from './modules/usuarios/usuarios.routes';
import crmRoutes from './modules/crm/crm.routes';
import matrizRiesgosRoutes from './modules/matriz-riesgos/matriz-riesgos.routes';
import gestionDocumentalRoutes from './modules/gestion-documental/gestion-documental.routes';
import preliqHistorialRoutes from './modules/preliq-historial/preliq-historial.routes';
import fichasRouter from './modules/fichas/fichas.routes';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (no auth)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/comerciales', comercialesRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api', actividadesRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/biblioteca', bibliotecaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sac', sacRoutes);
app.use('/api/admin/usuarios', usuariosRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/matriz-riesgos', matrizRiesgosRoutes);
app.use('/api/gestion-documental', gestionDocumentalRoutes);
app.use('/api/preliq-historial', preliqHistorialRoutes);
app.use('/api/fichas', fichasRouter);

// Public cotizacion by numero
app.get('/api/cot/:numero', async (req, res, next) => {
  try {
    const { prisma } = await import('./database');
    const cot = await prisma.cotizacion.findUnique({
      where: { numero: req.params.numero },
    });
    if (!cot) {
      res.status(404).json({ error: 'Cotizacion no encontrada' });
      return;
    }
    res.json(cot);
  } catch (err) {
    next(err);
  }
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use(errorHandler);

export default app;
