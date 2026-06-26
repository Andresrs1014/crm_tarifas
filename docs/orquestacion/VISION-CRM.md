# Visión del CRM — Grupo ZYMO

## Qué es

**CRM Proyectos & Negocios** es la herramienta comercial interna de Grupo ZYMO para gestionar el ciclo completo de ventas y relación con empresas:

- Captura de **prospectos** (pipeline comercial)
- Conversión y gestión de **clientes activos**
- **Cotizaciones** multi-línea (Zona Franca, Depósito, CEDI, Transporte, Paqueteo, Aduana)
- Seguimiento de **actividades** (visitas, llamadas, facturación)
- Módulos de soporte: **equipo comercial**, **biblioteca de tarifas**, **matriz de riesgos**, **gestión documental**, **SAC** (regalos/cumpleaños), **calendario**, **preliquidador**, **cotizador paqueteo**, **fichas de cliente**

## Para quién

- **Comerciales:** registran visitas, prospectos, clientes, cotizaciones
- **Superadmin:** usuarios, configuración
- **Operaciones / GD / Financiero:** contactos tipificados, documentación, fichas

## Fuente de verdad actual

El archivo monolito **`seguimiento-zymo-v6 (88).html`** (~448 funciones JS, 15 módulos en sidebar) es la referencia **visual y funcional** aprobada por negocio.

El repo React/Node es una **reimplementación** que debe converger a ese HTML, no al revés.

## Cómo se usa (flujo típico)

1. **Nuevo Registro** → crear prospecto o cliente con contactos, servicios, facturación
2. **Prospectos / CRM Pipeline** → avanzar estados (prospecto → visita → propuesta → … → facturado)
3. **Clientes Activos** → gestión de relación, visitas, nuevos servicios
4. **Cotizaciones** → wizard 5 pasos, PDF, link público
5. **Dashboard** → KPIs operativos filtrados por comercial/mes/tipo
6. Módulos transversales: biblioteca, matriz, GD, SAC, calendario

## Persistencia en HTML (referencia)

- `localStorage['zymo-db']` con: `records`, `cotizaciones`, `comerciales`, `biblioteca`, `tarifasEspeciales`, `matrizRiesgos`, etc.
- En React: PostgreSQL vía Prisma + API REST

## Criterio de éxito del reinicio

Un usuario que conoce el HTML debe poder usar el React **sin notar diferencia** en:

- Layout (sidebar 200px, header 60px, densidad de formularios)
- Tipografía (Barlow / Barlow Condensed)
- Colores y componentes (stat-card, chart-card, form-grid, badges)
- Flujos (mismos campos, mismos filtros, mismas acciones)
