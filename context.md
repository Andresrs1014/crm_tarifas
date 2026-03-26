# CRM Tarifas — Grupo ZYMO
## Contexto del Proyecto
CRM comercial para seguimiento de prospectos, clientes y cotizaciones de tarifas logísticas.
Basado en un prototipo HTML+JS (crm_oscar.html) que se está convirtiendo en sistema de producción.

## Stack
- **Backend:** FastAPI + SQLModel + SQLite + Alembic + JWT (python-jose + passlib bcrypt)
- **Frontend:** React + Vite + TypeScript + Tailwind + Zustand + TanStack Query + React Router v6
- **Deploy:** Docker + docker-compose

## Estructura del Proyecto
```
crm-tarifas/
├── backend/
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── database.py
│       ├── auth/ (router, service, dependencies)
│       ├── models/
│       ├── routers/
│       └── schemas/
├── frontend/
├── docker-compose.yml
└── .env
```

## Roles de Usuario
- **superadmin:** Acceso total + puede crear/eliminar usuarios vía API
- **usuario normal:** Acceso completo al CRM, sin gestión de usuarios
- El primer superadmin se crea automático al levantar la app desde variables FIRST_SUPERADMIN_USERNAME y FIRST_SUPERADMIN_PASSWORD en .env

## Fases
- [x] Fase 0 — Setup: estructura, docker-compose, FastAPI base, SQLite
- [x] Fase 1 — Auth: modelo users, JWT, endpoints /token /register /me, superadmin automático
- [ ] Fase 2 — Core Backend: modelos y CRUD de comerciales, records, contactos, actividades
- [ ] Fase 3 — Biblioteca: líneas, grupos, ítems, observaciones, seed data
- [ ] Fase 4 — Cotizaciones: wizard, numeración atómica, duplicar, actualizar tarifas, link público
- [ ] Fase 5 — Dashboard: agregaciones SQL para KPIs y gráficos
- [ ] Fase 6 — Frontend Base: login, routing protegido, layout
- [ ] Fase 7 — Páginas Core: dashboard, prospectos, clientes, equipo, registro, detalle
- [ ] Fase 8 — Cotizaciones FE: wizard 5 pasos, biblioteca UI, export PDF
- [ ] Fase 9 — Polish: carga masiva, EmailJS, responsive, toasts

## Decisiones Técnicas Importantes
- **SQLite sobre PostgreSQL:** proyecto pequeño, monousuario en producción, sin overhead de servicio separado
- **items_snapshot en cotizaciones:** deep clone JSON de tarifas al momento de guardar — las cotizaciones pasadas nunca se modifican aunque cambien las tarifas de la biblioteca
- **Numeración cotizaciones:** tabla singleton `cot_numero_counter` con operación atómica para generar COT-001, COT-002 sin duplicados
- **Zustand para cotWizard:** el wizard de 5 pasos tiene estado complejo — se diseña el store antes de tocar UI en Fase 8
- **TipTap:** reemplaza el contenteditable manual del prototipo para observaciones ricas
- **Tarifas como VARCHAR:** pueden ser '559.900' (moneda) o '0,36%' (porcentaje), no como número

## Módulos del CRM
Dashboard · Registro · Prospectos · Clientes · Detalle/Edición · Equipo Comercial · Cotizaciones · Biblioteca de Servicios · Actualización de Tarifas · Carga Masiva

## PARA TENER MUY EN CUENTA
En la raíz de la carpeta, hay un archivo que se llama crm_oscar.html, esta es la base de lo que tenemos que construir, estamos construyendo el backend para ese archivo y luego lo cambiaremos a las tecnologias mencionadas en **Frontend**

## Servicios Logísticos (constantes del sistema)
Zona Franca · Depósito Aduanero · CEDI · Transporte · Paqueteo · Aduana

