#preferencia

# Preferencias de Usuario y Fluctuaciones del Proceso

> **Tipo:** Nodo de comportamiento adaptativo
> **Dependencias:** [[Actores_y_Roles]] · [[ZYMO_CRM_AGENT]] · [[Mente_ZYMO_SUBAGENT]]

---

## Preferencias conocidas del equipo ZYMO

### Vista preferida por rol

| Actor | Vista principal | Razón |
|-------|----------------|-------|
| Superadmin | Dashboard → Ranking comerciales | Visión gerencial |
| Comercial | Prospectos → Kanban | Gestión diaria del pipeline |
| Comercial SAC | SAC → Filtro mes actual | Seguimiento cumpleaños |

### Flujo natural del comercial
1. Entrar al sistema (SSO desde Intranet)
2. Ver Dashboard — revisar KPIs del día
3. Revisar Kanban para mover prospectos
4. Registrar actividades del día anterior
5. Crear/actualizar cotizaciones pendientes
6. Antes de salir: revisar próximos seguimientos

---

## Fluctuaciones del proceso (el "depende de")

### Depende del tamaño del cliente
- Clientes `categoría A` → visita presencial obligatoria antes de propuesta
- Clientes `categoría C` → propuesta por email es suficiente
- La categoría A/B/C no está automatizada — la asigna el comercial manualmente

### Depende del servicio solicitado
- **Zona Franca / Aduana** → requiere documentación legal (no gestionada en CRM)
- **Transporte / Paqueteo** → cotización más rápida, tarifa por volumen
- **CEDI** → requiere visita de reconocimiento físico del espacio

### Depende del tipo de cliente
- `directo` → negociación directa con la empresa
- `intermediario` → hay un tercero (firma de consultoría, agente aduanero)
- `referido` → vino recomendado por otro cliente → mayor probabilidad de cierre

### Depende del comercial
- Cada comercial tiene su estilo de seguimiento — el CRM registra pero no impone
- El agente adapta sugerencias al historial de actividades del comercial específico

---

## Comportamiento adaptativo del agente

El [[Mente_ZYMO_SUBAGENT]] debe considerar:

```
SI usuario.role === "superadmin"
  → responder con visión de equipo + KPIs globales

SI usuario.role === "usuario" (comercial)
  → filtrar datos a los registros asignados a ese comercial
  → priorizar alertas propias, no del equipo

SI el prospecto tiene categoria === "A"
  → sugerir visita presencial antes de propuesta
  → mencionar tiempos más largos en el ciclo

SI tipoCliente === "referido"
  → mencionar que la probabilidad de cierre es mayor
  → sugerir contactar al referidor para contexto
```

---

## Conexiones

- [[Actores_y_Roles]] — base del comportamiento por actor
- [[ZYMO_CRM_AGENT]] — aplica preferencias en el system prompt
- [[Mente_ZYMO_SUBAGENT]] — razonamiento adaptativo
- [[Reglas_de_Negocio]] — restricciones que no cambian
- [[KPIs_Tiempos]] — fluctúan según el tipo de proceso
