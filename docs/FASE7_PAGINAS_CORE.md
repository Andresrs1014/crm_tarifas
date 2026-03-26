# Fase 7 — Páginas Core

## Páginas a construir
Dashboard, Prospectos, Clientes, Equipo Comercial, Registro, Detalle/Edición

## Dashboard
Componentes: StatCard x6, gráficos Recharts, tabla cotizaciones recientes
Datos: GET /api/dashboard/stats + /api/dashboard/charts
Filtros: comercial, mes, tipo
StatCards: Total Records, Prospectos, Clientes, Facturación Total, Cotizaciones, Aprobadas

## Prospectos
Tabla filtrable por: search, estado, comercial
Columnas: Empresa, Contacto, Ciudad, Comercial, Servicios, Visita, Estado, Facturado, Valor, Próximo seguimiento, Acciones
Acción: Ver/Editar → navega a /prospectos/:id

## Clientes
Tabla filtrable por: search, estado, facturado
Columnas: Empresa, Contacto, Tipo Cliente, Comercial, Servicios, Visita, Nuevo Servicio, Facturado, Estado, Acciones

## Registro (Nuevo Record)
Formulario con:
- Toggle Prospecto / Cliente
- Datos empresa: nombre, NIT, ciudad, fecha, comercial
- Clasificación: directo/indirecto/referido (con campos condicionales)
- Servicios de interés: chips seleccionables (los 6 servicios)
- Multi-contacto: lista dinámica, el primero es principal
- Facturación por línea: inputs COP por servicio seleccionado (si facturado=si)
- Campos según tipo: estado, visita, próximo seguimiento, observaciones

## Detalle / Edición (/prospectos/:id o /clientes/:id)
Mismos campos del formulario de registro pero pre-poblados.
Panel lateral o inferior con:
- Timeline de actividades (visit, service, invoice, note)
- Botón agregar actividad
- Resumen facturación por línea

## Equipo Comercial
Tabla CRUD: nombre, cargo, email, teléfono, prospectos asignados, clientes asignados, visitas
Formulario inline para crear/editar
Ranking por total de records

## Componentes reutilizables necesarios
- Badge: colores por estado (verde/rojo/gold/gris/azul/purple)
- StatCard: valor grande + label + color accent top
- ServiceChip: chip seleccionable con checkbox hidden
- ContactosList: lista dinámica de contactos con add/remove
- BillingLines: inputs COP por servicio seleccionado
- ActividadesTimeline: lista cronológica de actividades
- ConfirmModal: modal de confirmación para eliminar
- Toast: notificación temporal (éxito/error/warning)

## Notas
- Todos los formularios usan React Hook Form + Zod para validación
- Las llamadas a la API usan TanStack Query (useQuery, useMutation)
- Al guardar exitoso: invalidar query correspondiente + toast de éxito
- Campos condicionales (ej: cliente_indirecto_id solo si tipo=referido) con watch() de RHF