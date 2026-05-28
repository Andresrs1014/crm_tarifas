# CRM ZYMO — Task Tracker

> Actualizado: 28 mayo 2026  
> Objetivo: Producción antes del lunes 2 de junio de 2026

---

## ✅ Backend (Node.js + Express + TypeScript + Prisma)

- [x] Limpiar archivos Python del backend anterior
- [x] Crear estructura de carpetas (`src/middleware/`, `src/modules/`)
- [x] `package.json` con todas las dependencias (dotenv, express, prisma, jwt, bcryptjs, zod, exceljs, multer, cors)
- [x] `tsconfig.json` configurado (noImplicitAny: false para Express v5)
- [x] `prisma/schema.prisma` — todos los modelos (User, Comercial, Record, Contacto, Actividad, BibliotecaLinea/Grupo/Item/Obs, Cotizacion, CotNumeroCounter)
- [x] `src/config.ts` — variables de entorno
- [x] `src/database.ts` — Prisma client singleton
- [x] `src/server.ts` — punto de entrada con `$connect`
- [x] `src/app.ts` — Express + cors + todos los routers montados
- [x] `src/seed.ts` — seed inicial (superadmin + biblioteca lineas + counter)
- [x] `middleware/auth.ts` — JWT verify + helper `param()` para Express v5
- [x] `middleware/requireRole.ts` — autorización por rol
- [x] `middleware/errorHandler.ts` — manejo centralizado de errores
- [x] `modules/auth/` — SSO (`/api/auth/sso`) + login directo (`/api/auth/login`) + `/api/auth/me`
- [x] `modules/comerciales/` — CRUD completo
- [x] `modules/records/` — CRUD + filtros + import Excel (multer)
- [x] `modules/actividades/` — CRUD por record
- [x] `modules/cotizaciones/` — CRUD + duplicar + actualizar tarifas (nueva versión incremental)
- [x] `modules/biblioteca/` — árbol completo lineas → grupos → items → obs
- [x] `modules/dashboard/` — KPIs + ranking comerciales + recientes
- [x] `modules/sac/` — contactos por mes + patch fotos entrega
- [x] `modules/usuarios/` — gestión usuarios (solo superadmin)
- [x] `Dockerfile` backend — multi-stage Node 20 Alpine + Prisma generate
- [x] `npm install` completado (220 paquetes)
- [x] **TypeScript check: 0 errores** ✅

---

## 🔄 Frontend (React 19 + Vite + TypeScript + TailwindCSS)

### Fundación
- [x] `package.json` — React 19, Vite, TailwindCSS, Zustand, TanStack Query, Recharts, @dnd-kit, axios, react-router-dom, react-hook-form
- [x] `tsconfig.json` + `tsconfig.node.json` — configurados
- [x] `vite.config.ts` — ESM con `fileURLToPath`, proxy `/api → :3003`
- [x] `tailwind.config.ts` — design system ZYMO dark (colores, tipografía, animaciones)
- [x] `postcss.config.js`
- [x] `index.html` — DM Sans + DM Mono de Google Fonts
- [x] `src/index.css` — capa de componentes Tailwind (`.btn-primary`, `.card`, `.badge-*`, `.input`, `.table-card`, `.step-dot`)
- [x] `src/main.tsx`
- [x] `src/App.tsx` — routing completo + RequireAuth + RequireSuperadmin + SSOHandler
- [x] `src/vite-env.d.ts`

### Tipos y Estado
- [x] `src/types/index.ts` — CRMRecord, Cotizacion, BibliotecaLinea/Grupo/Item, DashboardStats, User, Comercial, Contacto, Actividad, SAC
- [x] `src/store/authStore.ts` — Zustand persist (token + user)
- [x] `src/store/toastStore.ts` — toast auto-dismiss + helpers `toast.success()`, `toast.error()`

### API y Hooks
- [x] `src/hooks/useSSOToken.ts` — **CORREGIDO**: valida via `/api/auth/sso` en backend (no client-side)
- [x] `src/api/client.ts` — Axios + JWT header + auto-logout en 401
- [x] `src/api/auth.ts` — login, sso, me
- [x] `src/api/records.ts` — CRUD + import
- [x] `src/api/comerciales.ts` — CRUD
- [x] `src/api/dashboard.ts` — stats + ranking + recientes
- [x] `src/api/cotizaciones.ts` — CRUD + duplicar + actualizar tarifas + pública
- [x] `src/api/biblioteca.ts` — árbol completo CRUD

### Componentes Layout y UI
- [x] `components/layout/Layout.tsx` — header + sidebar + outlet
- [x] `components/layout/Header.tsx` — reloj en vivo + logo ZYMO + usuario + logout
- [x] `components/layout/Sidebar.tsx` — navegación con estado activo + sección admin
- [x] `components/ui/ToastContainer.tsx` — notificaciones slide-up animadas

### Páginas
- [x] `pages/Login.tsx` — glassmorphism premium, spinner loading, hint SSO
- [x] `pages/CotPublica.tsx` — vista pública por número COT-xxx (sin auth)
- [ ] `pages/Dashboard.tsx` — KPIs en cards + gráficas Recharts
- [ ] `pages/Prospectos.tsx` — tabla con filtros estado/comercial + paginación
- [ ] `pages/Clientes.tsx` — tabla con facturación y estado
- [ ] `pages/Detalle.tsx` — ficha completa: info + contactos + actividades + cotizaciones
- [ ] `pages/Registro.tsx` — formulario nuevo prospecto/cliente con contactos
- [ ] `pages/CRMKanban.tsx` — pipeline Kanban drag & drop por estado
- [ ] `pages/Equipo.tsx` — tabla comerciales con CRUD
- [ ] `pages/Cotizaciones.tsx` — lista con filtros + cambio de estado
- [ ] `pages/wizard/WizardLayout.tsx` — wizard 5 pasos nueva cotización
- [ ] `pages/Biblioteca.tsx` — editor árbol de tarifas inline
- [ ] `pages/SAC.tsx` — cumpleaños del mes + registro fotos regalo
- [ ] `pages/Usuarios.tsx` — CRUD usuarios (solo superadmin)
- [ ] `pages/ImportWizard.tsx` — carga masiva Excel
- [ ] **Build Vite** — pendiente fix CSS Tailwind (custom colors en @apply)

---

## 🏗️ Infraestructura Docker

- [x] `docker-compose.yml` — servicios: `crm-db` (PostgreSQL :5435), `backend` (:3003), `frontend` (:82)
- [x] `.env.example` — todas las variables documentadas
- [x] `backend/Dockerfile` — multi-stage Node 20 Alpine
- [x] `frontend/Dockerfile` — multi-stage Vite build + nginx serve
- [x] `frontend/nginx.conf` — SPA fallback + proxy `/api` a backend

---

## ⏳ Pendiente Crítico

| # | Tarea | Prioridad | Bloqueado por |
|---|-------|-----------|---------------|
| 1 | Fix CSS build (custom Tailwind colors en `@apply`) | 🔴 URGENTE | — |
| 2 | Dashboard con Recharts | 🔴 Alta | Fix CSS |
| 3 | Prospectos tabla | 🔴 Alta | Fix CSS |
| 4 | Clientes tabla | 🔴 Alta | Fix CSS |
| 5 | Detalle (ficha completa) | 🔴 Alta | Fix CSS |
| 6 | Registro (formulario) | 🔴 Alta | Fix CSS |
| 7 | Cotizaciones lista | 🟡 Media | Fix CSS |
| 8 | Wizard cotización | 🟡 Media | Fix CSS |
| 9 | Biblioteca editor | 🟡 Media | Fix CSS |
| 10 | CRM Kanban | 🟡 Media | Fix CSS |
| 11 | Equipo, SAC, Usuarios | 🟢 Baja | Fix CSS |
| 12 | Migración Prisma + seed en producción | 🔴 Alta | PostgreSQL disponible en servidor |

---

## 🔑 Notas Críticas de Seguridad

1. **`JWT_SECRET`** en `backend/.env` **DEBE** ser el mismo valor que usa `zymo-intranet`
2. Nunca commitear `.env` (está en `.gitignore`)
3. La ruta `/api/cot/:numero` es **pública** (sin auth) — intencional para compartir cotizaciones
4. El superadmin inicial se crea con el seed — cambiar contraseña después del primer login

---

## 📋 Comandos Útiles

```bash
# Desarrollo local (backend)
cd backend && npm run dev

# Desarrollo local (frontend)
cd frontend && npm run dev

# Producción
docker-compose up -d --build

# Migración BD (primera vez)
docker-compose exec backend npx prisma migrate dev --name init

# Seed inicial
docker-compose exec backend npx tsx src/seed.ts

# Logs
docker-compose logs -f backend
docker-compose logs -f frontend
```
