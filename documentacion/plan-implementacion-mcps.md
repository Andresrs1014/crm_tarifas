# Plan de Implementación — MCPs CRM ZYMO

> Generado: 02 junio 2026
> Stack: Python · FastMCP · Transporte streamable HTTP · PostgreSQL

---

## Resumen ejecutivo

5 MCPs a construir de forma incremental. Cada uno expone herramientas consumibles por agentes IA (Claude, n8n, WhatsApp bot, etc.) sin necesidad de entrar al CRM manualmente.

| # | MCP | Prioridad | Complejidad |
|---|-----|-----------|-------------|
| 1 | `crm-cotizaciones-mcp` | Alta | Media |
| 2 | `crm-analytics-mcp` | Alta | Baja |
| 3 | `crm-sac-mcp` | Alta | Alta |
| 4 | `crm-import-mcp` | Media | Alta |
| 5 | `biblioteca-tarifas-mcp` | Media | Baja |

---

## Arquitectura común

```
agente IA / n8n / bot
        │
        ▼ HTTP streamable
  ┌─────────────┐
  │  FastMCP    │  (Python)
  │  server.py  │
  └──────┬──────┘
         │ psycopg2 / SQLAlchemy
         ▼
   PostgreSQL crm_tarifas
```

**Estructura de carpetas por MCP:**

```
mcps/
└── crm-cotizaciones-mcp/
    ├── server.py          # FastMCP + herramientas
    ├── db.py              # Conexión PostgreSQL
    ├── requirements.txt
    ├── Dockerfile
    └── .env.example
```

**Variables de entorno comunes:**
```env
DATABASE_URL=postgresql://crm_user:crm_pass@crm-db:5432/crm_tarifas
MCP_PORT=8010
MCP_SECRET=...
```

---

## MCP 1 — `crm-cotizaciones-mcp`

**Propósito:** Ciclo completo de cotizaciones sin entrar al CRM.
**Puerto sugerido:** 8011

### Herramientas

| Herramienta | Parámetros | Descripción |
|-------------|-----------|-------------|
| `get_cotizacion` | `numero: str` | Devuelve cotización completa con líneas y snapshot |
| `crear_cotizacion` | `datos: dict` | Genera COT-XXX atómico (usa el counter de BD) |
| `enviar_cotizacion` | `id: str, email: str` | Envía PDF adjunto por email via SMTP |
| `actualizar_tarifas` | `id: str, pct: float` | Incremento porcentual — crea nueva versión |
| `get_estado_pipeline` | — | Resumen de cotizaciones agrupadas por estado |

### Flujo `crear_cotizacion`
```
1. BEGIN TRANSACTION
2. SELECT valor FROM cot_numero_counter FOR UPDATE
3. valor += 1 → numero = f"COT-{valor:03d}"
4. INSERT INTO cotizaciones (...)
5. UPDATE cot_numero_counter SET valor = valor
6. COMMIT
```

### Caso de uso principal
Agente de WhatsApp recibe solicitud → llama `crear_cotizacion` → llama `enviar_cotizacion` → cliente recibe PDF sin intervención humana.

---

## MCP 2 — `crm-analytics-mcp`

**Propósito:** KPIs y alertas en tiempo real para reportes automáticos.
**Puerto sugerido:** 8012

### Herramientas

| Herramienta | Parámetros | Descripción |
|-------------|-----------|-------------|
| `get_kpis` | `mes?: str, comercialId?: str` | Stats consolidadas del Dashboard |
| `get_ranking_comerciales` | — | Tabla clasificatoria con prospectos, clientes, visitas, facturado |
| `get_pipeline_funnel` | — | Prospectos por etapa (conteo + días promedio por etapa) |
| `get_alertas` | — | Sin actividad >30 días + cumpleaños próximos 7 días |

### Caso de uso principal
Cron cada lunes 8am → llama `get_ranking_comerciales` + `get_kpis` → formatea reporte → envía por Slack/WhatsApp al equipo comercial.

---

## MCP 3 — `crm-sac-mcp`

**Propósito:** Automatización completa del flujo SAC — cumpleaños, regalos, tarjetas y registro fotográfico.
**Puerto sugerido:** 8013

### Herramientas

| Herramienta | Parámetros | Descripción |
|-------------|-----------|-------------|
| `get_cumpleanos_mes` | `mes: int` | Contactos con cumpleaños en el mes, con empresa y estado cartera |
| `get_pendientes_sac` | — | Contactos aptos (cartera al día) sin regalo registrado en el mes actual |
| `registrar_entrega_regalo` | `contacto_id: str, fotos: list[str]` | Sube fotos base64 al campo `fotos_entrega` del contacto + marca `fda_entregado=true` |
| `enviar_tarjeta_cumpleanos` | `contacto_id: str` | Envía tarjeta personalizada via Outlook SMTP al email del contacto |
| `solicitar_compra_regalos` | `mes: int` | Genera email a Contabilidad + Administrativo con lista de regalos pendientes |
| `validar_cartera` | `record_id: str` | Consulta estado de cartera del cliente (campo `estadoCliente` + `facturado`) |

### Flujo completo del proceso SAC

```
Día 1 del mes (cron)
  └─► get_cumpleanos_mes(mes)
        └─► validar_cartera por cada contacto
              └─► Lista aprobados (cartera al día)
                    └─► solicitar_compra_regalos → email a Contabilidad + Administrativo
                          (Lista: empresa, contacto, categoría, regalo sugerido)

30 días antes del cumpleaños (cron diario)
  └─► get_pendientes_sac()
        └─► Notificación interna al comercial asignado

1 día antes del cumpleaños (cron diario)
  └─► enviar_tarjeta_cumpleanos(contacto_id)
        └─► Email Outlook personalizado con nombre del contacto + firma ZYMO

Día de entrega física
  └─► registrar_entrega_regalo(contacto_id, fotos[])
        └─► fotos base64 → guardar en contactos.fotos_entrega (JSON array)
        └─► fda_entregado = true
        └─► Confirmación al CRM
```

### Configuración requerida
```env
OUTLOOK_SMTP=smtp.office365.com
OUTLOOK_PORT=587
OUTLOOK_USER=sac@zymo.com.co
OUTLOOK_PASS=...
PLANTILLA_TARJETA_HTML=./templates/tarjeta_cumpleanos.html
```

### Template tarjeta cumpleaños (`tarjeta_cumpleanos.html`)
- Personalizada con nombre del contacto
- Logo ZYMO
- Firma del comercial asignado
- Enviada desde cuenta Outlook oficial SAC

---

## MCP 4 — `crm-import-mcp`

**Propósito:** Migración masiva desde Excel o CRM anterior (Python/SQLite).
**Puerto sugerido:** 8014

### Herramientas

| Herramienta | Parámetros | Descripción |
|-------------|-----------|-------------|
| `validate_excel` | `file_path: str` | Valida estructura del Excel antes de importar — devuelve errores por fila |
| `import_records` | `file_path: str` | Importa registros con reporte de éxitos/errores |
| `get_import_status` | `job_id: str` | Progreso en tiempo real (% completado, filas procesadas) |
| `rollback_import` | `job_id: str` | Revierte importación completa por job_id |

### Columnas esperadas en Excel
```
empresa | nit | ciudad | comercial | tipo | estado | servicios | observaciones | fecha
```

### Mecanismo rollback
Cada job de importación registra los IDs creados en una tabla temporal `import_jobs`. El rollback hace `DELETE WHERE id IN (...)`.

---

## MCP 5 — `biblioteca-tarifas-mcp`

**Propósito:** Gestión de tarifas sin entrar al CRM — actualización masiva auditable.
**Puerto sugerido:** 8015

### Herramientas

| Herramienta | Parámetros | Descripción |
|-------------|-----------|-------------|
| `get_biblioteca_completa` | — | Árbol completo: líneas → grupos → items con tarifas |
| `actualizar_tarifa` | `item_id: str, valor: str` | Actualiza tarifa específica (formato string — nunca número) |
| `incremento_masivo` | `linea_id: str, pct: float` | Sube todas las tarifas de una línea un % (respeta formato `$` y `%`) |
| `export_biblioteca_excel` | — | Exporta todas las tarifas a Excel para revisión externa |

### Regla crítica de tarifas
Las tarifas se almacenan **siempre como string** (`"$559.900"` o `"0,36%"`). El MCP debe parsear, calcular y formatear de vuelta al mismo formato antes de guardar.

---

## Orden de implementación recomendado

```
Sprint 1 (valor inmediato):
  ├── MCP 2 — Analytics (más simple, alto valor para reportes)
  └── MCP 5 — Biblioteca (operación diaria, bajo riesgo)

Sprint 2 (automatización comercial):
  ├── MCP 1 — Cotizaciones (integración WhatsApp/email)
  └── MCP 3 — SAC (flujo cumpleaños completo)

Sprint 3 (migración):
  └── MCP 4 — Import (solo si hay migración pendiente)
```

---

## Docker Compose — agregar a `docker-compose.yml`

```yaml
crm-mcps:
  build: ./mcps/crm-cotizaciones-mcp
  ports:
    - "8011:8011"
  environment:
    DATABASE_URL: ${DATABASE_URL}
  depends_on:
    - crm-db
  restart: unless-stopped
```

---

## Dependencias Python

```txt
fastmcp>=0.1.0
psycopg2-binary>=2.9
python-dotenv>=1.0
openpyxl>=3.1          # MCP 4 y 5 — Excel
jinja2>=3.1            # MCP 3 — plantilla tarjeta
```
