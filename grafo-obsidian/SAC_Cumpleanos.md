#alerta #sac

# SAC — Seguimiento a Contactos (Cumpleaños)

> **Tipo:** Nodo de proceso SAC
> **Dependencias:** [[Alertas_y_Triggers]] · [[Flujos_Email]] · [[Actores_y_Roles]]

---

## Propósito del módulo SAC

SAC gestiona el seguimiento de cumpleaños de contactos clave para fortalecer relaciones comerciales con regalos y detalles de parte de Grupo ZYMO.

---

## Flujo del proceso SAC

```
1. Contacto creado con fecha de cumpleaños (YYYY-MM-DD)
   + recibeRegalos: true/false

2. Cada mes: filtrar por mes actual
   GET /api/sac/contactos?mes=N

3. Alerta en la UI:
   - Tabla "Reciben regalo" con días restantes
   - Alerta FDA pendiente (amarilla) si recibeRegalos && !fdaEntregado

4. El comercial entrega el regalo y registra:
   - PATCH /api/sac/contactos/:id/fotos
     { fdaEntregado: true, fotos: ["url1", "url2"] }

5. El registro queda en estado "Entregado" — visible como referencia histórica
```

---

## Campos relevantes del contacto

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cumpleanos` | `string` | Formato `YYYY-MM-DD` |
| `recibeRegalos` | `boolean` | Si el contacto recibe regalo de la empresa |
| `fotosEntrega` | `string[]` | Fotos en base64 del momento de entrega (sin servidor de archivos) |
| `fdaEntregado` | `boolean` | Formulario de acuse de entrega |
| `direccion` | `string?` | Dirección física del contacto (editable en modal SAC) |

---

## Priorización de SAC

El [[Mente_ZYMO_SUBAGENT]] prioriza contactos SAC en este orden:
1. Cumpleaños **hoy** — acción inmediata
2. Cumpleaños en los próximos **7 días** — preparar regalo
3. Cumpleaños en los próximos **30 días** — planear
4. Contactos con `recibeRegalos: false` — solo notificación de cortesía

---

## Modal de edición SAC

El modal permite editar directamente desde la tabla SAC:
- Cargo, teléfono, email, **dirección** del contacto → `PATCH /api/sac/datos`
- Fotos de entrega (base64, múltiples) → `PATCH /api/sac/contactos/:id/fotos`
- La info de solo lectura muestra **Tipo de cliente** (directo / intermediario / referido) en lugar de Categoría

## Automatización futura — MCP SAC (`crm-sac-mcp`)

Ver plan en `documentacion/plan-implementacion-mcps.md`:
- Cron día 1 del mes → validar cartera → solicitar compra de regalos (email a Contabilidad + Administrativo)
- Cron 30 días antes → notificación al comercial
- Cron 1 día antes → enviar tarjeta personalizada por Outlook
- Registro automático de fotos con `registrar_entrega_regalo(contacto_id, fotos[])`

---

## Conexiones

- [[Alertas_y_Triggers]] — trigger del cumpleaños del mes
- [[Flujos_Email]] — email recordatorio al comercial + tarjeta Outlook
- [[Actores_y_Roles]] — comercial es el responsable del FDA
- [[Mente_ZYMO_SUBAGENT]] — prioriza y contextualiza alertas SAC
