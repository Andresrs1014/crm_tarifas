# CRM Proyectos & Negocios — Plan de Implementación

> **Fecha:** 28 de mayo de 2026  
> **Meta:** Tener el CRM en producción en `crm.zymointranet.com` antes del lunes 2 de junio de 2026  
> **Repo:** `C:\crm_tarifas` (expuesto en `crm.zymointranet.com` en servidor Ubuntu)

---

## 1. Contexto y Problema

El CRM anterior fue construido por un comercial (sin desarrollador) usando Claude sin código. Resultó funcional en partes pero:

- No se alineó al plan técnico del Área de Desarrollo e Innovación.
- El stack era Python/FastAPI en el backend — difícil de mantener y extender.
- El SSO con `zymo-intranet` no funcionaba (token decodificado client-side sin validación real).
- Sin base de datos transaccional real (SQLite plano).

**Decisión:** Reconstruir desde 0 alineando al stack de `zymo-intranet`.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite + TailwindCSS |
| Estado global | Zustand |
| Data fetching | TanStack Query (React Query) |
| Gráficas | Recharts |
| Drag & Drop | @dnd-kit |
| Backend | Node.js 20 + Express 5 + TypeScript |
| ORM | Prisma 5 |
| Base de datos | PostgreSQL 15 (contenedor) |
| Auth | JWT (HS256) — secreto compartido con `zymo-intranet` |
| Containerización | Docker + docker-compose |

### Puertos (sin colisión con zymo-intranet)
| Servicio | Puerto |
|---------|--------|
| Frontend (nginx) | **:82** |
| Backend API | **:3003** |
| PostgreSQL | **:5435** |

---

## 3. Arquitectura SSO — Fix Crítico

### Problema del código anterior
El hook `useSSOToken` original decodificaba el JWT del intranet **en el cliente** sin verificación. Construía un usuario ficticio sin consultar al backend CRM, y usaba el token del intranet directamente para llamadas API del CRM.

### Solución implementada
```
Intranet (zymo-intranet, puerto 8001)
  └── Link CRM con ?sso_token=<JWT_INTRANET>
        │
        ▼
Frontend CRM (useSSOToken.ts — CORREGIDO)
  └── POST /api/auth/sso   { token: <JWT_INTRANET> }
        │
        ▼
Backend CRM (auth.service.ts)
  1. Verifica JWT_INTRANET con JWT_SECRET compartido
  2. Extrae `sub` (username del usuario intranet)
  3. Busca o crea usuario en tabla `users` del CRM
  4. Emite NUEVO token CRM con roles del CRM
        │
        ▼
Frontend: guarda token CRM → accede con permisos correctos
```

**Variable crítica:** `JWT_SECRET` debe ser **IDÉNTICO** en `.env` del intranet y del CRM.

---

## 4. Estructura de Directorios

```
crm_tarifas/
├── plans/                          ← Este directorio
│   ├── implementation_plan.md      ← Este archivo
│   └── task_tracker.md             ← Estado de tareas
│
├── backend/
│   ├── src/
│   │   ├── server.ts               ✅ Creado
│   │   ├── app.ts                  ✅ Creado
│   │   ├── config.ts               ✅ Creado
│   │   ├── database.ts             ✅ Creado
│   │   ├── seed.ts                 ✅ Creado
│   │   ├── middleware/
│   │   │   ├── auth.ts             ✅ Creado (con helper param())
│   │   │   ├── requireRole.ts      ✅ Creado
│   │   │   └── errorHandler.ts     ✅ Creado
│   │   └── modules/
│   │       ├── auth/               ✅ SSO + login directo
│   │       ├── usuarios/           ✅ CRUD superadmin
│   │       ├── comerciales/        ✅ CRUD
│   │       ├── records/            ✅ CRUD + import Excel
│   │       ├── actividades/        ✅ CRUD por record
│   │       ├── cotizaciones/       ✅ CRUD + duplicar + tarifas
│   │       ├── biblioteca/         ✅ Árbol lineas/grupos/items/obs
│   │       ├── dashboard/          ✅ KPIs + ranking + recientes
│   │       └── sac/                ✅ Cumpleaños + fotos entrega
│   ├── prisma/schema.prisma        ✅ Todos los modelos
│   ├── Dockerfile                  ✅ Multi-stage Node 20 Alpine
│   └── package.json                ✅ 0 errores TypeScript
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx                ✅ Creado
│   │   ├── App.tsx                 ✅ Routing completo + guards
│   │   ├── index.css               ✅ Design system ZYMO dark
│   │   ├── vite-env.d.ts           ✅ Creado
│   │   ├── types/index.ts          ✅ Todos los tipos
│   │   ├── store/
│   │   │   ├── authStore.ts        ✅ Zustand persist
│   │   │   └── toastStore.ts       ✅ Notificaciones
│   │   ├── hooks/
│   │   │   └── useSSOToken.ts      ✅ CORREGIDO — valida via backend
│   │   ├── api/
│   │   │   ├── client.ts           ✅ Axios + JWT + 401 auto-logout
│   │   │   ├── auth.ts             ✅
│   │   │   ├── records.ts          ✅
│   │   │   ├── comerciales.ts      ✅
│   │   │   ├── dashboard.ts        ✅
│   │   │   ├── cotizaciones.ts     ✅
│   │   │   └── biblioteca.ts       ✅
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Layout.tsx      ✅ Header + Sidebar + Outlet
│   │   │   │   ├── Header.tsx      ✅ Reloj en vivo + branding
│   │   │   │   └── Sidebar.tsx     ✅ Navegación activa
│   │   │   └── ui/
│   │   │       └── ToastContainer.tsx ✅
│   │   └── pages/
│   │       ├── Login.tsx           ✅ Glassmorphism premium
│   │       ├── Dashboard.tsx       🚧 Stub — pendiente Recharts
│   │       ├── Prospectos.tsx      🚧 Stub — pendiente tabla
│   │       ├── CRMKanban.tsx       🚧 Stub — pendiente Kanban
│   │       ├── Clientes.tsx        🚧 Stub — pendiente tabla
│   │       ├── Detalle.tsx         🚧 Stub — pendiente ficha
│   │       ├── Registro.tsx        🚧 Stub — pendiente formulario
│   │       ├── Equipo.tsx          🚧 Stub — pendiente tabla
│   │       ├── Cotizaciones.tsx    🚧 Stub — pendiente lista
│   │       ├── wizard/
│   │       │   └── WizardLayout.tsx 🚧 Stub — pendiente 5 pasos
│   │       ├── Biblioteca.tsx      🚧 Stub — pendiente editor
│   │       ├── SAC.tsx             🚧 Stub — pendiente lista
│   │       ├── Usuarios.tsx        🚧 Stub — pendiente CRUD
│   │       ├── ImportWizard.tsx    🚧 Stub — pendiente upload
│   │       └── CotPublica.tsx      ✅ Vista pública cotización
│   ├── Dockerfile                  ✅ Multi-stage Vite + nginx
│   ├── nginx.conf                  ✅ SPA + proxy /api
│   └── package.json                ✅ Dependencias instaladas
│
├── docker-compose.yml              ✅ Puertos 82/3003/5435
├── .env.example                    ✅ Variables necesarias
└── plans/                          ✅ Este directorio
```

---

## 5. Variables de Entorno Requeridas

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://crm_user:crm_pass@crm-db:5432/crm_tarifas
JWT_SECRET=<MISMO_SECRETO_QUE_INTRANET>    # ← CRÍTICO para SSO
JWT_EXPIRES_IN=8h
PORT=3003
NODE_ENV=production
FIRST_SUPERADMIN_USERNAME=Analista_Desarrollo
FIRST_SUPERADMIN_PASSWORD=Admin1234!
```

> ⚠️ **`JWT_SECRET` debe ser idéntico al que usa `zymo-intranet`** para que el SSO funcione.

---

## 6. Modelo de Datos (Prisma)

```
User              — usuarios del CRM (superadmin / usuario)
Comercial         — equipo comercial activo
Record            — prospectos y clientes (tipo: prospecto|cliente)
  ├── Contacto    — contactos de cada empresa (cumpleaños, regalos)
  ├── Actividad   — log de actividades (llamadas, visitas, etc.)
  └── Cotizacion  — cotizaciones vinculadas
BibliotecaLinea   — líneas de servicio (Zona Franca, CEDI, etc.)
  ├── BibliotecaGrupo  — agrupaciones dentro de una línea
  │   └── BibliotecaItem — items con tarifa (NUNCA como número)
  └── BibliotecaObs    — observaciones HTML por línea
CotNumeroCounter  — contador atómico para COT-001, COT-002...
```

---

## 7. API Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login directo con credenciales CRM |
| POST | `/api/auth/sso` | Intercambio token intranet → token CRM |
| GET | `/api/auth/me` | Usuario actual |
| GET | `/api/health` | Health check |

### Records (Prospectos y Clientes)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/records` | Lista con filtros (tipo, estado, comercialId, search, fecha) |
| POST | `/api/records` | Crear con contactos |
| GET | `/api/records/:id` | Detalle con contactos + actividades + cotizaciones |
| PUT | `/api/records/:id` | Actualizar |
| DELETE | `/api/records/:id` | Eliminar |
| POST | `/api/records/import` | Importar Excel (multer) |

### Cotizaciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/cotizaciones` | Lista con filtros |
| POST | `/api/cotizaciones` | Crear (genera número atómico) |
| GET | `/api/cotizaciones/:id` | Detalle |
| PUT | `/api/cotizaciones/:id` | Actualizar |
| DELETE | `/api/cotizaciones/:id` | Eliminar |
| POST | `/api/cotizaciones/:id/duplicar` | Duplicar con nuevo número |
| POST | `/api/cotizaciones/:id/actualizar-tarifas` | Incremento % (nueva versión) |
| GET | `/api/cot/:numero` | **Pública** — vista sin auth |

### Biblioteca de Servicios
| Método | Ruta |
|--------|------|
| GET | `/api/biblioteca` |
| POST/PUT/DELETE | `/api/biblioteca/lineas[/:id]` |
| POST/PUT/DELETE | `/api/biblioteca/lineas/:id/grupos`, `/api/biblioteca/grupos[/:id]` |
| POST/PUT/DELETE | `/api/biblioteca/grupos/:id/items`, `/api/biblioteca/items[/:id]` |
| GET/POST/PUT/DELETE | `/api/biblioteca/lineas/:id/obs`, `/api/biblioteca/obs[/:id]` |

### Dashboard
| GET `/api/dashboard` | KPIs + gráficas (filtros: comercialId, mes, tipo) |
| GET `/api/dashboard/ranking` | Ranking comerciales |
| GET `/api/dashboard/recientes` | Últimos registros y cotizaciones |

### SAC
| GET `/api/sac/contactos?mes=` | Cumpleaños del mes |
| PATCH `/api/sac/contactos/:id/fotos` | Fotos de entrega de regalo |

### Admin (solo superadmin)
| GET/POST/PUT/DELETE | `/api/admin/usuarios` |

---

## 8. Diseño Visual

- **Paleta:** Dark mode profundo (`#0a0e1a` base, `#111827` surface)
- **Acento:** Cyan `#00c2ff` / Azul `#0077ff`
- **Gold:** `#f5a623` (clientes premium)
- **Tipografía:** DM Sans (cuerpo) + DM Mono (código/cifras)
- **Componentes CSS:** clases utilitarias en `index.css` (`.btn-primary`, `.card`, `.badge-*`, `.input`, `.table-card`)

---

## 9. Pasos de Despliegue en Producción

### En el servidor Ubuntu (crm.zymointranet.com)

```bash
# 1. Pull del repositorio
cd /ruta/al/repo
git pull origin main

# 2. Crear archivo .env del backend
cp backend/.env.example backend/.env
nano backend/.env   # ← Configurar JWT_SECRET igual al intranet

# 3. Crear migración inicial de Prisma
# (primera vez solamente)
docker-compose run --rm backend npx prisma migrate dev --name init

# 4. Levantar servicios
docker-compose up -d --build

# 5. Correr seed inicial (superadmin + biblioteca lineas)
docker-compose exec backend npx tsx src/seed.ts

# 6. Verificar
curl http://localhost:3003/api/health
```

### Nginx externo (proxy a puerto 82)
```nginx
server {
    listen 80;
    server_name crm.zymointranet.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name crm.zymointranet.com;
    # ... SSL certs ...

    location / {
        proxy_pass http://localhost:82;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 10. Plan de Módulos Pendientes

Los siguientes módulos tienen stubs creados y deben implementarse en este orden de prioridad:

| Prioridad | Módulo | Descripción |
|-----------|--------|-------------|
| 🔴 Alta | **Dashboard** | KPIs en cards + gráficas Recharts (prospectos/mes, estados, servicios) |
| 🔴 Alta | **Prospectos** | Tabla filtrable por estado/comercial/fecha + pipeline visual |
| 🔴 Alta | **Clientes** | Tabla con facturación, estado, visitas |
| 🔴 Alta | **Detalle** | Ficha completa: info + contactos + actividades + cotizaciones |
| 🔴 Alta | **Registro** | Formulario nuevo prospecto/cliente |
| 🟡 Media | **Cotizaciones** | Lista + wizard 5 pasos (datos → líneas → items → obs → preview) |
| 🟡 Media | **Biblioteca** | Editor árbol de tarifas con edición inline |
| 🟡 Media | **CRM Kanban** | Pipeline drag & drop por estado |
| 🟡 Media | **Equipo** | CRUD comerciales |
| 🟢 Baja | **SAC** | Cumpleaños del mes + registro fotos de regalo |
| 🟢 Baja | **Usuarios** | CRUD usuarios (solo superadmin) |
| 🟢 Baja | **Import** | Carga masiva Excel |

---

## 11. Decisiones Técnicas Importantes

### Tarifas NUNCA como número
Las tarifas en `BibliotecaItem.tarifa` se almacenan como `String`, nunca como `Number`. Pueden ser:
- `"$559.900"` (formato colombiano)
- `"0,36%"` (porcentaje)
- Cualquier texto descriptivo

Esto es intencional — la lógica de negocio los formatea.

### Cotizaciones: número atómico
El número `COT-001`, `COT-002`... se genera con una transacción atómica sobre `CotNumeroCounter`. Nunca se elimina el registro de la BD, solo se desactiva (`estado: 'rechazada'`).

### SSO: auto-provision de usuarios
Cuando el intranet redirige al CRM con `?sso_token=...`, si el usuario no existe en la tabla `users` del CRM, se crea automáticamente con rol `usuario`. Un superadmin puede después cambiar su rol.
