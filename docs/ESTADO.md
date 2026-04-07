# ESTADO DEL PROYECTO — CRM Tarifas ZYMO

_Última actualización: 2026-04-04_

---

## Resumen general

El CRM está en producción vía Docker. Login, autenticación JWT, navegación, todas las páginas principales, cotizaciones y SAC están operativos.

**Stack:** FastAPI (backend) + React/Vite/Tailwind (frontend) + PostgreSQL + Docker Compose.

---

## Lo que está implementado

### Backend
- Modelos: `Record`, `Contacto`, `Cotizacion`, `TarifaEspecial`, `User`
- Campos añadidos en esta iteración: `direccion`, `categoria` (Record); `cumpleanos`, `recibe_regalos`, `fotos_entrega`, `fotos_fda`, `fda_entregado`, `direccion` (Contacto); `paqueteadora`, `tarifa_tipo`, `tarifa_especial_id` (Cotizacion)
- Routers activos: `/api/records`, `/api/contactos`, `/api/cotizaciones`, `/api/biblioteca`, `/api/tarifas-especiales`, `/api/sac`
- Autenticación JWT HS256, 8 h de expiración
- Dashboard: `/api/dashboard/stats`, `/api/dashboard/charts`

### Frontend
- Layout con sidebar fijo, reloj en vivo (fecha/hora en español, formato 12h)
- Páginas: Dashboard, Prospectos, Clientes, Equipo, Cotizaciones, Servicios (Biblioteca), SAC, Registro, Detalle
- Logo transparente (`/logo_transparent.png`) sin fondo blanco, tamaño `h-14`
- Sidebar: "Nuevo Registro" destacado, separador, nav principal, enlace Admin solo para superadmin
- Auth store (Zustand persist) con interceptor 401 → logout automático

### Infraestructura
- Docker Compose con servicios: `db` (Postgres), `backend`, `frontend` (nginx)
- Variables de entorno en `.env` (no en código)
- Proxy Vite configurado para dev local (`/api → http://localhost:8000`)
  > **Nota:** Reiniciar `npm run dev` después de cambiar `vite.config.ts` para que el proxy aplique.

---

## Pendientes — Prioridad Alta (UX crítica)

Estos cambios son pequeños pero visibles al usuario.

### P1 — Layout centrado en todas las páginas
Todas las páginas (Prospectos, Clientes, Equipo, Cotizaciones, Servicios) tienen el contenido pegado a la izquierda.
```
max-width: 1400px  |  margin: 0 auto  |  padding: 28px 32px
```
Envolver con un `PageContainer` o aplicar clases directamente en cada página.

### P2 — Colores de servicio correctos
Las tarjetas/chips de servicio deben usar estos colores exactos:

| Servicio | Color |
|---|---|
| Zona Franca | `#00c2ff` (cyan) |
| Depósito Aduanero | `#f5a623` (gold) |
| CEDI | `#f5a623` (gold) |
| Transporte | `#00e676` (verde) |
| Paqueteo | `#a855f7` (purple) |
| Aduana | `#ff4444` (rojo) |

### P3 — Tarjetas de Servicios (Biblioteca) ancho completo
Cada tarjeta debe ocupar el ancho total del contenedor:
- `background: #1a2235`, `border: 1px solid #1e3050`, `border-radius: 12px`, `padding: 16px 20px`, `gap: 16px`

### P4 — Servicios de interés en Nuevo Registro desde backend
La sección "Servicios de interés" en `/registro` debe consumir `GET /api/biblioteca` en lugar de una lista hardcodeada. Cada servicio se muestra como chip seleccionable con su color (ver P2).

### P5 — StatCard número en blanco
El número grande en StatCard usa color neón. Cambiar a blanco. El color de acento solo en la barra superior y el label.
- Archivo: `frontend/src/components/StatCard.tsx`

### P6 — Header: título dinámico de página a la izquierda
El espacio izquierdo del header está vacío. Agregar el nombre de la página actual a la izquierda (o quitar el header y dar espacio al contenido).
- Archivo: `frontend/src/components/Layout.tsx`

### P7 — Botón "Nuevo" en Prospectos y Clientes
Agregar botón "Nuevo Registro" en el header de `/prospectos` y `/clientes` que navegue a `/registro`.
- Archivos: `Prospectos.tsx`, `Clientes.tsx`

### P8 — Loading state: skeleton con animate-pulse
Reemplazar el texto de carga por un skeleton de filas con `animate-pulse`.
- Archivos: `Prospectos.tsx`, `Clientes.tsx`, `Cotizaciones.tsx`

### P9 — Empty state: ícono + mensaje centrado
Cuando no hay registros, mostrar un ícono + texto centrado (actualmente es texto plano gris).
- Mismos archivos que P8.

### P10 — Detalle.tsx: usar PageContainer
`Detalle.tsx` usa `p-6 max-w-4xl` directo. Envolver en `PageContainer` para consistencia.

---

## Pendientes — Funcionalidades grandes

### Carga masiva de registros
**Estado:** No implementado.

**Backend:**
- Endpoint `POST /api/records/import` — recibe Excel/CSV, valida columnas mínimas (`empresa`, `tipo`), retorna resumen de creados/errores
- Dependencia: `openpyxl` en `requirements.txt`

**Frontend:**
- Dependencia: `xlsx` (SheetJS) — `npm install xlsx`
- Wizard 3 pasos:
  1. Subir archivo (drag & drop, preview primeras filas)
  2. Mapear columnas (Excel → campo del sistema)
  3. Confirmar e importar (mostrar resumen)
- Botón "Importar" en `/prospectos` y `/clientes`
- Ruta sugerida: `/registro/importar`

### Gestión de usuarios (`/admin/usuarios`)
**Estado:** Backend tiene modelo `User` y auth. Frontend no tiene UI.

- Solo visible para `is_superadmin = true`
- CRUD: listar, crear, cambiar contraseña, desactivar usuario
- Ruta: `/admin/usuarios` (ya existe el NavLink en Layout.tsx)

---

## Archivos clave de referencia

| Archivo | Propósito |
|---|---|
| `docs/DATA_MODEL.md` | Modelo de datos completo con todos los campos |
| `docs/CHANGELOG.md` | Historial detallado de cambios por fase |
| `backend/app/models/` | Modelos SQLAlchemy |
| `frontend/src/types/index.ts` | Tipos TypeScript del frontend |
| `frontend/src/components/Layout.tsx` | Sidebar + header |
| `frontend/src/store/authStore.ts` | Auth Zustand store |
| `frontend/src/api/client.ts` | Axios con interceptor 401 |
