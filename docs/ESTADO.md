# ESTADO DEL PROYECTO — CRM Tarifas ZYMO

_Última actualización: 2026-04-08_

---

## Resumen general

CRM operativo en producción vía Docker. Todas las funcionalidades del prototipo original (`crm_nuevo.md`) han sido implementadas y el código está listo para despliegue.

**Stack:** FastAPI + SQLModel (SQLite) · React 18 + Vite + TypeScript + Tailwind · Docker Compose · nginx (proxy)

---

## Funcionalidades implementadas

### Autenticación
- Login JWT (HS256, 8 h de expiración)
- Interceptor automático 401 → logout + redirect
- Roles: `superadmin` / usuario normal
- Gestión de usuarios en `/admin/usuarios` (solo superadmin)

### CRM — Prospectos y Clientes
- CRUD completo con múltiples contactos por empresa
- Campos: empresa, NIT, ciudad, dirección, categoría (A/B/C), comercial, tipo cliente, comisión, servicios, visita, facturación, valor, estado, próximo seguimiento, observaciones
- Contactos con campos SAC: cumpleaños, recibe regalos, dirección
- Filtros: búsqueda, estado, comercial, facturado
- Exportar Excel con todos los campos
- Carga masiva desde Excel (`/registro/importar`)
- Detalle con edición inline y botón "Nueva cotización" (pre-rellena wizard)

### Cotizaciones — Wizard
- **Paso 1 — Datos generales**: autocomplete empresa desde CRM, pre-rellena todos los datos del cliente/contacto automáticamente; selector de contacto cuando hay múltiples
- **Paso 2 — Líneas**: selección de servicios + tipo de tarifa (biblioteca estándar vs. tarifa especial)
- **Paso 3 — Items**: selección y edición de ítems por línea; selector de paqueteadora para servicio Paqueteo
- **Paso 4 — Observaciones**: plantillas por línea + texto libre
- **Paso 5 — Preview**: HTML completo de la cotización + exportar PDF
- Guardar borrador disponible en **todos los pasos (1–5)**
- **Importar desde PDF**: extrae grupos y tarifas automáticamente (pdf.js vía CDN), vista previa editable antes de abrir wizard
- Duplicar cotización
- Actualizar tarifas (incremento porcentual sobre ítems tipo moneda, crea nueva versión)
- Link público de cotización (`/cot/:numero`)

### Dashboard
- KPIs: total prospectos, clientes, cotizaciones, facturación
- Cotizaciones en curso, vencidas, rechazadas, en negociación
- Gráficas: Gestión de Clientes, Registros por Mes, Pipeline de Cotizaciones, Líneas más Cotizadas, Actividad por Comercial
- Filtro por tipo (prospecto/cliente)
- Exportar Excel con registros filtrados
- Estados vacíos con mensaje cuando no hay datos
- Tablas de actividad reciente (últimos registros y cotizaciones)

### Equipo
- Gestión de comerciales (CRUD: nombre, cargo, email, teléfono)
- Ranking de gestión con medallas (prospectos, clientes, visitas, facturado)

### Biblioteca (Tarifas)
- Gestión de líneas de negocio con grupos, ítems y observaciones
- Columnas extra configurables por línea (solo superadmin)
- Tarifas especiales: conjuntos de tarifas personalizadas por servicio

### SAC (Servicio al Cliente)
- Tracking de cumpleaños por mes con KPIs
- Registro de fotos de entrega de regalos
- Sección Fin de Año con control de entregas
- Exportación XLSX

---

## Infraestructura de deploy

```
crm_tarifas/
├── docker-compose.yml         ← Orquesta backend + frontend
├── .env                       ← Variables secretas (NO en repo)
├── .env.example               ← Plantilla con instrucciones
├── backend/
│   ├── Dockerfile
│   └── alembic/versions/      ← Migraciones de BD
└── frontend/
    ├── Dockerfile             ← Build multistage, VITE_API_URL vacío en prod
    └── nginx.conf             ← Proxy /api/ → backend:8000, SPA fallback
```

### Levantar en servidor

```bash
git pull origin frfrbranch
cp .env.example .env
# Editar .env con SECRET_KEY real y credenciales de admin
nano .env

docker compose up -d --build
# Las migraciones corren automáticamente al iniciar el backend
```

### Variables de entorno requeridas (`.env`)

| Variable | Descripción |
|---|---|
| `SECRET_KEY` | Clave JWT — generar con `openssl rand -hex 32` |
| `DATABASE_URL` | `sqlite:///./data/crm_tarifas.db` |
| `FIRST_SUPERADMIN_USERNAME` | Usuario del primer admin (solo aplica en BD vacía) |
| `FIRST_SUPERADMIN_PASSWORD` | Password del primer admin |

---

## Archivos clave

| Archivo | Propósito |
|---|---|
| `docs/DATA_MODEL.md` | Esquema completo de tablas y campos |
| `docs/CHANGELOG.md` | Historial de cambios por sesión |
| `backend/app/models/` | Modelos SQLModel |
| `frontend/src/types/index.ts` | Tipos TypeScript globales |
| `frontend/src/store/cotWizardStore.ts` | Estado del wizard de cotizaciones |
| `frontend/src/utils/exportExcel.ts` | Funciones de exportación Excel |
| `frontend/src/api/client.ts` | Axios con interceptor 401 |
