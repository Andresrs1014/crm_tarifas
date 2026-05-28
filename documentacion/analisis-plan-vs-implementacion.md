# Análisis: Plan Original vs Implementación Actual
> CRM ZYMO — Comparativo para deadline 2 de junio de 2026

---

## Resumen ejecutivo

El plan original (`zymo-crm-plan.md`) fue elaborado por el comercial que construyó la v1 en
Python/FastAPI. Es referencia muy valiosa — especialmente los módulos de Gestión Documental,
Calendario y Matriz de Riesgos, que **no existen en la implementación actual Node.js**.

El backend Node.js ya tiene una base sólida. Lo que falta es un conjunto de módulos de mediana-alta
complejidad. Hay que decidir cuáles van antes del 2 de junio y cuáles son fase 2.

---

## 1. MÓDULOS — Estado comparativo

### Implementados (backend + stubs frontend)

| Módulo | Backend | Frontend | Notas |
|--------|---------|----------|-------|
| Auth / SSO | OK | OK Login | Corrección SSO server-side |
| Records (prospectos/clientes) | OK | Stub | Falta form completo |
| Contactos | OK | en Detalle | |
| Actividades | OK | en Detalle | **Faltan campos hora y lugar** |
| Comerciales | OK | Stub Equipo | |
| Cotizaciones (CRUD) | OK | Stub | |
| Biblioteca de tarifas | OK | Stub | |
| Dashboard (KPIs básicos) | OK | Stub | Faltan 6 gráficas Recharts |
| SAC (cumpleaños) | OK | Stub | |
| Usuarios / admin | OK | Stub | |
| Import Excel | OK | Stub | |
| CotPublica (pública) | OK | OK | |

### NO implementados — Del plan original

| Módulo | Complejidad | Prioridad |
|--------|-------------|-----------|
| CRM Pipeline / Kanban con CrmMeta | Media | ALTA — core del CRM |
| Actividades vencidas + alertas | Baja | ALTA — crítico para visitas |
| Calendario de visitas (mes + día) | Alta | MEDIA |
| Gestión Documental completa | Muy Alta | Post-2-junio |
| Matriz de Riesgos | Media | Post-2-junio |
| Cotizador Paqueteo | Media | Post-2-junio |
| Preliquidador | Media | Post-2-junio |

---

## 2. GAPS CRÍTICOS en el backend actual

### 2.1 Actividad — faltan campos (URGENTE)

El plan requiere hora y lugar para actividades tipo visita. El schema actual los omite.

```prisma
// AÑADIR al model Actividad en schema.prisma:
hora    String?   // "14:30" — solo para tipo visita
lugar   String?   // dirección/nombre del lugar
origen  String?   // "gestion-documental" | null
```

### 2.2 CRMMeta — tabla faltante (URGENTE para Kanban)

El plan separa los metadatos del CRM del Record base. Sin esta tabla el Kanban no puede
registrar tiempos por estado ni notas CRM independientes.

```prisma
model CrmMeta {
  id             String  @id @default(uuid())
  recordId       String  @unique @map("record_id")
  record         Record  @relation(fields:[recordId], references:[id], onDelete: Cascade)
  estadoPipeline String? @map("estado_pipeline")
  ingresosCrm    Int?    @map("ingresos_crm")
  obs            String?
  tiempos        Json    @default("{}")  // {estado: {entrada: iso, salida: iso}}
  @@map("crm_meta")
}
```

### 2.3 Modelos GD — post-2-junio pero diseñar ya

DocumentoGD, CicloGD, HistorialGD, MatrizRiesgo — se agregan en la siguiente migración.

### 2.4 Roles — diferencia con el plan

| Plan original | Implementación actual | Decisión |
|--------------|-----------------------|---------|
| admin | superadmin | Conservar superadmin |
| comercial | usuario | Ampliar a comercial cuando sea necesario |
| documental | no existe | Para cuando se implemente GD |

---

## 3. ENDPOINTS faltantes para el 2 de junio

### Urgentes (desbloquean frontend Kanban)

```
GET  /api/crm/pipeline           → registros agrupados por estado_pipeline
PUT  /api/crm/:id/estado         → cambia estado_pipeline, registra tiempo
GET  /api/crm/:id/meta           → get CrmMeta
PUT  /api/crm/:id/meta           → update notas/ingresos CRM
GET  /api/actividades/vencidas   → tipo=visita, fecha<=hoy, hecho=false
```

### Diferidos (post-2-junio)

```
GET/PUT /api/gd/:recordId
POST    /api/gd/:recordId/iniciar-ciclo
GET/POST/DELETE /api/gd/:recordId/archivo/:docId
GET     /api/calendario
GET     /api/calendario/dia
GET     /api/matriz-riesgos
GET     /api/cotizaciones/:id/pdf
GET     /api/export/records/excel
GET     /api/export/gd/excel
```

---

## 4. MÓDULOS FRONTEND — Antes del 2 de junio

### CRÍTICOS

1. Dashboard — KPIs cards + 6 gráficas Recharts
2. Prospectos — tabla filtrable + pipeline visual
3. Clientes — tabla con estado, facturación
4. Detalle — ficha completa (tabs: Info, Actividades con hora/lugar, Cotizaciones)
5. Registro — formulario nuevo prospecto/cliente con contactos
6. CRM Kanban — drag-and-drop por estado pipeline + banner alerta vencidas

### MEDIOS

7. Cotizaciones — lista + wizard 5 pasos
8. Biblioteca — editor árbol inline
9. Equipo — CRUD comerciales

### POST-2-JUNIO

- SAC, Usuarios, ImportWizard
- Calendario de visitas (mes + timeline día)
- Gestión Documental completa
- Matriz de Riesgos
- Cotizador Paqueteo + Preliquidador

---

## 5. LO QUE SÍ TOMAMOS del plan original

### Lógica de negocio a conservar exactamente

| Regla | Status |
|-------|--------|
| Categoría A/B/C por facturación (>50M / >10M) | Implementar en frontend |
| Tarifas nunca como número | Ya implementado |
| Número cotización atómico COT-001... | Ya implementado |
| items_snapshot en cotizaciones | Ya implementado |
| Banner rojo visitas vencidas | Falta endpoint + frontend |
| Tiempos en pipeline (historial por estado) | Falta CrmMeta |
| Cumpleaños solo en contactos de clientes | Ya en schema |

### Algoritmo GD (para cuando se implemente)

Del plan §7.1 — conservar exactamente:
- Si cicloActual < añoSistema → siempre 0%
- Referidos: excluir docs con aplica === directo
- Factor: completo=1.0, incompleto=0.5, pendiente=0

---

## 6. LO QUE NO TOMAMOS del plan original

| Item | Razón |
|------|-------|
| Stack Python/FastAPI/SQLModel | Migrado a Node.js/Express/Prisma |
| SQLite | Migrado a PostgreSQL |
| Pydantic schemas | Migrado a Zod |
| Alembic migrations | Migrado a Prisma Migrate |
| WeasyPrint (PDF) | Pendiente: usar puppeteer en Node.js |
| shadcn/ui | No instalado — usamos design system ZYMO propio con Tailwind |

---

## 7. PLAN DE ACCIÓN — Días restantes

### Hoy (build CSS ya desbloqueado)
- Añadir campos hora, lugar, origen a Actividad en Prisma
- Añadir modelo CrmMeta en Prisma
- Endpoint /api/actividades/vencidas
- Endpoints /api/crm/pipeline, /api/crm/:id/estado, /api/crm/:id/meta

### 30-31 mayo
- Dashboard completo (KPIs + Recharts)
- Prospectos tabla
- Clientes tabla
- Formulario Registro

### 1 junio
- Detalle completo (tabs)
- Kanban con alertas

### 2 junio (entrega)
- Cotizaciones lista + wizard
- Docker verify en producción

---

## 8. GRAFO DEL AGENTE CRM — Estructura (se construye al final)

El grafo se diseña en Obsidian y se indexa con LightRAG para el agente IA del intranet.
Se completa a medida que se implementan los módulos.

### Contenido mínimo requerido (del plan_trabajo.md)

- [ ] Actores y roles — superadmin, comercial, documental
- [ ] Alertas y triggers — SI tiene: visitas vencidas, cumpleaños, ciclo GD expirado
- [ ] Flujos de email — cotizaciones enviadas, alertas SAC
- [ ] Estados del proceso — pipeline (6 etapas), cotización (5 estados), GD (3 estados)
- [ ] KPIs y tiempos — facturación, conversión, tiempo por estado pipeline
- [ ] Motores de datos — SI tiene: dashboard queries, GD compliance calc, risk matrix
- [ ] Preferencias de usuario — filtros por comercial/mes/tipo, vistas Kanban/tabla
- [ ] Reglas de negocio — categoría A/B/C, ponderación GD, numeración atómica, snapshot
- [ ] System Prompt del agente — se define cuando el grafo esté completo

### Nodos adicionales (más allá del mínimo)

- MCPs expuestos al agente (cotizaciones, analytics, SAC, import, biblioteca)
- Decisiones técnicas: tarifas como string, roles, SSO compartido con intranet
- Flujo de conversión prospecto a cliente
- Ciclo anual GD con historial y archivado
- Matriz de riesgos (FR-002-GC) y su relación con GD
- Integración LightRAG: cómo se indexan los nodos del grafo al servidor
