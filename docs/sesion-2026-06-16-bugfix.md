# Sesión de Corrección de Bugs — 16 de Junio 2026

**Rama:** `soylabumba`  
**Responsable:** andres.quintero@imccargo.com  
**Estado del deploy:** ✅ Desplegado en producción — a la espera de prueba de usuarios

---

## Contexto

Se realizó una auditoría completa de funcionalidad del CRM usando browser automation (agent-browser) con el usuario de prueba `andres.quintero@imccargo.com`. Se revisaron todas las secciones: Dashboard, Prospectos, CRM Pipeline, Clientes Activos, Cotizaciones, SAC, Fichas de Cliente, Cotizador Paqueteo, Preliquidador y Calendario.

Se identificaron 4 bugs, se corrigieron uno por uno con revisión de spec y calidad de código en cada uno.

---

## Bugs corregidos

### Bug 1 — Labels de estado mostraban valor raw (Prospectos, Cotizaciones, Detalle)

**Problema:** Los badges de estado mostraban el valor crudo de la base de datos (ej. `aceptacion_propuesta`) que con CSS `text-transform: uppercase` aparecía como `ACEPTACION_PROPUESTA` en lugar de un label legible como "🤝 Aceptación Propuesta".

**Commits:**

- `3cd2d99` — `fix: labels legibles en badges de estado — Prospectos, Cotizaciones, Detalle`  
  Se añadió helper `fmtEstado()` en cada página y se usaron los labels del array `ESTADOS` existente.

- `3b1bbe7` — `fix: extraer fmtEstado a utils, sincronizar EstadoProspecto`  
  Se extrajo `fmtEstado` a `src/utils/fmtEstado.ts` (eliminando duplicación en 3 archivos). Se sincronizó el tipo `EstadoProspecto` en `types/index.ts` eliminando 3 estados que no existen en el backend (`resolucion`, `aceptacion_alcance`, `firma_contrato`). Se corrigieron además los `<select>` del modo edición en `Detalle.tsx` para mostrar labels formateados.

**Archivos modificados:**
- `frontend/src/pages/Prospectos.tsx`
- `frontend/src/pages/Cotizaciones.tsx`
- `frontend/src/pages/Detalle.tsx`
- `frontend/src/utils/fmtEstado.ts` *(nuevo)*
- `frontend/src/types/index.ts`

---

### Bug 2 — FichaCliente: filtro por defecto incorrecto y KPIs calculados sobre datos filtrados

**Problema:** La página de Fichas de Cliente abría con el filtro `'pendiente'` activo, mostrando "Sin fichas" cuando no había fichas pendientes. Adicionalmente, los KPIs (Total, Pendientes, En Proceso, Completadas, Progreso) calculaban sobre la lista ya filtrada, por lo que "En Proceso" y "Completadas" siempre aparecían en 0 al entrar a la página.

**Commits:**

- `b7e6ca7` — `fix: FichaCliente — filtro default todos y KPIs sobre totales reales`  
  Se cambió `useState('pendiente')` a `useState('')`. Se agregó una segunda query `fichasAll` sin filtro de estado para calcular los KPIs con totales reales del sistema.

- `2271790` — `fix: FichaCliente — renombrar queryKey fichas-all para evitar colisión`  
  Se renombró el query key de `['fichas', 'all', ...]` a `['fichas-all', ...]` para evitar colisión con una futura entrada de estado con valor `'all'` en el caché de React Query.

**Archivos modificados:**
- `frontend/src/pages/FichaCliente.tsx`

---

### Bug 3 — SQL raw string interpolation en records.py

**Problema:** En el endpoint `GET /api/records`, los UUIDs se interpolaban directamente en una query SQL con un f-string (`f"WHERE record_id IN ({placeholders})"`). Aunque los UUIDs son generados por el sistema (riesgo real bajo), es una práctica insegura.

**Commit:**

- `777fbce` — `fix: reemplazar SQL raw interpolation con ORM query en records.py`  
  Se reemplazó la query raw SQL con una subquery SQLAlchemy ORM parametrizada usando `func.min(Contacto.orden)` y un join. Se eliminó el import local `from sqlalchemy import text as _text` y se agregó `from sqlalchemy import func` a nivel de módulo.

**Archivos modificados:**
- `backend/app/routers/records.py`

---

### Bug 4 — CORS wildcard con credenciales en main.py

**Problema:** `allow_origins=["*"]` con `allow_credentials=True` viola la especificación CORS. Los browsers rechazan requests con credenciales cuando el origen es wildcard. Funcionaba únicamente porque el JWT se envía en el header `Authorization` (no en cookies).

**Commit:**

- `86f6d67` — `fix: CORS — reemplazar wildcard con orígenes específicos de producción`  
  Se reemplazó `["*"]` con los orígenes reales: `https://crm.zymointranet.com`, `http://localhost:5173`, `http://localhost:4173`.

**Archivos modificados:**
- `backend/app/main.py`

---

## Deploy

Los 6 commits fueron pusheados a la rama `soylabumba` y desplegados exitosamente en el servidor de producción Ubuntu (`crm.zymointranet.com`) mediante:

```bash
git pull
docker compose up --build -d
```

**Estado:** ✅ Producción actualizada — a la espera de prueba y validación por parte de los usuarios.

---

## Notas para seguimiento

- Los datos de facturación de clientes siguen en $0 (migración de datos pendiente de revisión aparte).
- El Calendario muestra 0 visitas en Junio — las 38 visitas importadas son de Febrero 2026 (comportamiento correcto, no es un bug).
- SAC muestra 0 cumpleaños en Junio — los datos de prueba no incluyen contactos con cumpleaños en este mes.
