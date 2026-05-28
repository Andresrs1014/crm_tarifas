#agente #subagente

# Mente ZYMO_SUBAGENT

> **Tipo:** Subagente especializado en razonamiento comercial
> **Dependencias:** [[ZYMO_CRM_AGENT]] · [[Reglas_de_Negocio]] · [[Motores_de_Datos]]

---

## Propósito

ZYMO_SUBAGENT es la "mente interna" del agente: el módulo que razona sobre datos del CRM antes de generar una respuesta al usuario. Procesa contexto, aplica reglas y decide qué acción proponer.

---

## Capacidades del subagente

### 1. Análisis de pipeline
- Lee el estado actual de todos los prospectos
- Identifica cuellos de botella por etapa
- Sugiere qué prospectos tienen mayor probabilidad de cierre
- Detecta prospectos "fríos" (sin actividad > 30 días)

### 2. Generación de seguimientos
- Cruza `proximoSeguimiento` con fecha actual
- Genera lista priorizada de llamadas/visitas pendientes
- Redacta mensajes de seguimiento personalizados por tipo de cliente

### 3. Soporte a cotizaciones
- Consulta tarifas en [[Biblioteca_Tarifas]]
- Aplica [[Reglas_de_Negocio]] de cotización
- Valida coherencia de líneas seleccionadas con el perfil del cliente

### 4. Alertas SAC
- Cruza cumpleaños del mes con [[SAC_Cumpleanos]]
- Prioriza contactos con `recibeRegalos: true` y `fdaEntregado: false`
- Genera lista de acción con nombre, empresa y fecha

---

## Flujo de razonamiento interno

```
INPUT: pregunta del usuario
  ↓
¿Requiere datos del CRM?
  → Sí: [[Motores_de_Datos]] → consulta API
  → No: responde con conocimiento del grafo
  ↓
¿Aplica alguna regla de negocio?
  → [[Reglas_de_Negocio]] → filtra respuesta
  ↓
¿Hay alertas activas que contextualicen?
  → [[Alertas_y_Triggers]] → añade contexto
  ↓
Genera respuesta estructurada
  ↓
OUTPUT: respuesta al usuario
```

---

## Conexiones

- [[ZYMO_CRM_AGENT]] ← orquestador padre
- [[Motores_de_Datos]] — fuente de datos en tiempo real
- [[Reglas_de_Negocio]] — restricciones aplicadas
- [[Alertas_y_Triggers]] — contexto de urgencia
- [[KPIs_Tiempos]] — métricas de evaluación
- [[Conexion_Sistema_Gerencial]] — escalamiento a gerencia
