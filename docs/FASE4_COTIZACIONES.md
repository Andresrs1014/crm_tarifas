# Fase 4 — Cotizaciones

## Descripción
Módulo central del CRM. Wizard de 5 pasos para crear cotizaciones de tarifas.
Cada cotización guarda un snapshot de los ítems con sus tarifas al momento de guardar.

## Tabla: cotizaciones
- id: UUID PK
- numero: str UNIQUE NOT NULL — formato COT-001, COT-002...
- empresa: str NOT NULL
- nit: str nullable
- record_id: UUID FK → records nullable — vinculación opcional a empresa del CRM
- contacto: str nullable
- cargo: str nullable
- email: str nullable
- telefono: str nullable
- comercial_id: UUID FK → comerciales nullable
- fecha: date NOT NULL
- vigencia: date NOT NULL
- estado: str NOT NULL — 'borrador'|'enviada'|'negociacion'|'aprobada'|'rechazada'
- asunto: text nullable
- lineas: JSON NOT NULL — ['Zona Franca', 'Transporte', ...]
- items_snapshot: JSON NOT NULL — deep clone de grupos/items seleccionados con tarifas
- obs_plantillas: JSON default {} — {servicio: [obs_id, ...], ...}
- obs_libre: text nullable
- created_at: datetime
- updated_at: datetime

## Tabla: cot_numero_counter
Singleton para numeración atómica. Solo existe fila con id=1.
- id: int PK always 1
- counter: int NOT NULL default 1

## Estructura items_snapshot
{
  "Zona Franca": {
    "g1": {
      "sel": true,
      "items": [
        {
          "sel": true,
          "nombre": "Ad Valorem",
          "tarifa": "0,36%",
          "tipo_tarifa": "porcentaje",
          "obs": "Del valor CIF",
          "extra_cols": {}
        }
      ]
    }
  }
}

## Endpoints
GET    /api/cotizaciones — filtros: estado, comercial_id, search, fecha
POST   /api/cotizaciones — genera número automático con counter atómico
GET    /api/cotizaciones/{id}
PUT    /api/cotizaciones/{id}
DELETE /api/cotizaciones/{id}
POST   /api/cotizaciones/{id}/duplicar — copia como borrador con número nuevo
POST   /api/cotizaciones/{id}/actualizar-tarifas — body: {porcentaje, items_keys[]}
GET    /api/cotizaciones/public/{numero} — público, sin auth — para links ?ZYMO=COT001

## Lógica crítica

### Numeración atómica
Al crear cotización:
UPDATE cot_numero_counter SET counter = counter + 1 WHERE id = 1
Usar el valor anterior para generar 'COT-001'
Esto evita duplicados si dos usuarios crean cotizaciones simultáneamente.

### items_snapshot — REGLA MÁS IMPORTANTE
Al guardar una cotización hacer deep clone (json.dumps + json.loads) de los items.
NUNCA guardar referencias a la biblioteca — solo copias.
Esto garantiza que editar tarifas futuras no modifica cotizaciones pasadas.

### Actualizar tarifas
Recibe cotización base + porcentaje + lista de items a incrementar.
Crea una NUEVA cotización (no modifica la original).
Solo aplica incremento a items con tipo_tarifa='moneda' — excluir 'porcentaje'.
Fórmula: nuevo_valor = valor_actual * (1 + porcentaje/100)

### Link público
GET /api/cotizaciones/public/{numero} no requiere auth.
Normalizar número: COT001 → COT-001 antes de buscar.
Devuelve el HTML renderizado o los datos para que el frontend lo renderice.

## Notas
- items_snapshot es el campo más importante — diseñarlo bien desde el inicio
- cot_numero_counter debe inicializarse con seed: INSERT ... ON CONFLICT DO NOTHING
- El estado 'borrador' es el default al crear
- duplicar siempre crea en estado 'borrador' con fecha de hoy