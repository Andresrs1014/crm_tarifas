import prisma from '../../database';

interface DashboardParams {
  comercialId?: string;
  mes?: string;
  tipo?: string;
}

export async function getDashboardStats({ comercialId, mes, tipo }: DashboardParams) {
  const whereRecord: Record<string, unknown> = {};
  if (comercialId) whereRecord.comercialId = comercialId;
  if (tipo) whereRecord.tipo = tipo;
  if (mes) {
    const [year, month] = mes.split('-').map(Number);
    whereRecord.fecha = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    };
  }

  const [
    totalProspectos,
    totalClientes,
    totalCotizaciones,
    records,
    cotizaciones,
  ] = await Promise.all([
    prisma.record.count({ where: { ...whereRecord, tipo: 'prospecto' } }),
    prisma.record.count({ where: { ...whereRecord, tipo: 'cliente' } }),
    prisma.cotizacion.count(),
    prisma.record.findMany({
      where: whereRecord,
      include: { comercial: true, actividades: true },
    }),
    prisma.cotizacion.findMany(),
  ]);

  // Facturación total
  const facturacionTotal = records.reduce((sum, r) => {
    const v = r.tipo === 'cliente' ? (r.valor || 0) : (r.valorP || 0);
    return sum + v;
  }, 0);

  // Prospectos por estado
  const prospectosPorEstado: Record<string, number> = {};
  records
    .filter((r) => r.tipo === 'prospecto')
    .forEach((r) => {
      const e = r.estadoProspecto || 'prospecto';
      prospectosPorEstado[e] = (prospectosPorEstado[e] || 0) + 1;
    });

  // Registros por mes (últimos 12 meses)
  const now = new Date();
  const registrosPorMes = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const label = d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
    const monthRecords = records.filter((r) => {
      const rd = new Date(r.fecha);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
    });
    return {
      mes: label,
      prospectos: monthRecords.filter((r) => r.tipo === 'prospecto').length,
      clientes: monthRecords.filter((r) => r.tipo === 'cliente').length,
    };
  });

  // Servicios más frecuentes
  const servicioCount: Record<string, number> = {};
  records.forEach((r) => {
    const servicios = Array.isArray(r.servicios) ? r.servicios : JSON.parse(r.servicios as string || '[]');
    servicios.forEach((s: string) => {
      servicioCount[s] = (servicioCount[s] || 0) + 1;
    });
  });
  const serviciosFrecuentes = Object.entries(servicioCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([servicio, count]) => ({ servicio, count }));

  // Facturación por línea
  const facturacionPorLinea: Record<string, number> = {};
  records.forEach((r) => {
    const lineas = typeof r.facturacionLineas === 'string'
      ? JSON.parse(r.facturacionLineas || '{}')
      : r.facturacionLineas as Record<string, number>;
    Object.entries(lineas).forEach(([k, v]) => {
      facturacionPorLinea[k] = (facturacionPorLinea[k] || 0) + (v as number);
    });
  });

  // Cotizaciones por estado
  const cotizacionesPorEstado: Record<string, number> = {};
  cotizaciones.forEach((c) => {
    cotizacionesPorEstado[c.estado] = (cotizacionesPorEstado[c.estado] || 0) + 1;
  });

  // Líneas más cotizadas
  const lineaCount: Record<string, number> = {};
  cotizaciones.forEach((c) => {
    const lineas = Array.isArray(c.lineas) ? c.lineas : JSON.parse(c.lineas as string || '[]');
    lineas.forEach((l: string) => {
      lineaCount[l] = (lineaCount[l] || 0) + 1;
    });
  });
  const lineasMasCotizadas = Object.entries(lineaCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([linea, count]) => ({ linea, count }));

  return {
    total_prospectos: totalProspectos,
    total_clientes: totalClientes,
    total_cotizaciones: totalCotizaciones,
    facturacion_total: facturacionTotal,
    cotizaciones_en_curso: cotizacionesPorEstado['enviada'] || 0,
    cotizaciones_aprobadas: cotizacionesPorEstado['aprobada'] || 0,
    cotizaciones_rechazadas: cotizacionesPorEstado['rechazada'] || 0,
    cotizaciones_negociacion: cotizacionesPorEstado['negociacion'] || 0,
    prospectos_por_estado: prospectosPorEstado,
    registros_por_mes: registrosPorMes,
    servicios_frecuentes: serviciosFrecuentes,
    facturacion_por_linea: facturacionPorLinea,
    cotizaciones_por_estado: cotizacionesPorEstado,
    lineas_mas_cotizadas: lineasMasCotizadas,
    actividad_por_comercial: [],
  };
}

export async function getRanking() {
  const comerciales = await prisma.comercial.findMany({
    where: { activo: true },
    include: {
      records: {
        include: { actividades: true },
      },
    },
  });

  return comerciales.map((c) => {
    const prospectos = c.records.filter((r) => r.tipo === 'prospecto').length;
    const clientes = c.records.filter((r) => r.tipo === 'cliente').length;
    const visitas = c.records.filter(
      (r) => r.visita === 'si' || r.visita === 'virtual' || r.visitaCliente === 'si'
    ).length;
    const facturado = c.records.reduce((sum, r) => {
      return sum + (r.tipo === 'cliente' ? r.valor || 0 : r.valorP || 0);
    }, 0);
    return { id: c.id, nombre: c.nombre, cargo: c.cargo, prospectos, clientes, visitas, facturado };
  }).sort((a, b) => b.clientes + b.prospectos - (a.clientes + a.prospectos));
}

export async function getRecientes() {
  const [records, cotizaciones] = await Promise.all([
    prisma.record.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { comercial: { select: { nombre: true } }, contactos: { take: 1, orderBy: { orden: 'asc' } } },
    }),
    prisma.cotizacion.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  return { records, cotizaciones };
}
