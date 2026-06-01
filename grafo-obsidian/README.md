# Grafo Obsidian — CRM Comercial Grupo ZYMO

> Vault de conocimiento del agente IA del CRM.
> Indexar con **LightRAG** → disponible como context en **zymo-intranet**.

---

## Propósito

Este vault es el **cerebro de conocimiento** del agente IA de ZYMO. Cada archivo `.md` es un nodo que documenta un aspecto del sistema: reglas de negocio, flujos, actores, endpoints, módulos. Los wikilinks `[[NombreNodo]]` son las aristas del grafo.

El agente de la intranet consulta este grafo vía LightRAG para responder preguntas sobre el CRM sin necesidad de leer el código fuente.

---

## Cómo usar este vault

1. Abrir esta carpeta como vault en Obsidian
2. Activar vista de Grafo (`Ctrl+G`) para ver las conexiones
3. El nodo central es [[ZYMO_CRM_AGENT]]
4. El nodo más importante para mantener actualizado: [[Motores_de_Datos]]

---

## Cómo indexar con LightRAG

```bash
# Desde el servidor de zymo-intranet
lightrag-index \
  --input-dir ./grafo-obsidian/ \
  --output-dir ./lightrag-index/ \
  --model claude-sonnet-4-6
```

---

## Mapa de nodos (21 nodos)

### Agentes
| Nodo | Tag | Descripción |
|------|-----|-------------|
| [[ZYMO_CRM_AGENT]] | #agente | Nodo raíz — System Prompt del agente |
| [[Mente_ZYMO_SUBAGENT]] | #agente | Subagente de razonamiento |

### Actores y proceso
| Nodo | Tag | Descripción |
|------|-----|-------------|
| [[Actores_y_Roles]] | #actor | Usuarios del sistema y sus permisos |
| [[Estados_del_Proceso]] | #estado | Máquinas de estado del pipeline |
| [[Pipeline_Prospectos]] | #estado | Kanban y flujo de prospectos |
| [[Pipeline_Cotizaciones]] | #estado | Wizard 5 pasos de cotizaciones |
| [[Reglas_de_Negocio]] | #regla | Restricciones y reglas del dominio |

### Motores de datos
| Nodo | Tag | Descripción |
|------|-----|-------------|
| [[Motores_de_Datos]] | #motor | **CRÍTICO** — tablas DB, endpoints REST, motores de exportación |
| [[Biblioteca_Tarifas]] | #motor | Árbol de tarifas: líneas → grupos → ítems |
| [[SSO_Flow]] | #motor | Autenticación federada intranet ↔ CRM |
| [[Conexion_Sistema_Gerencial]] | #gerencia | Integración con sistema gerencial |

### KPIs y alertas
| Nodo | Tag | Descripción |
|------|-----|-------------|
| [[KPIs_Tiempos]] | #kpi | Métricas de desempeño comercial |
| [[Alertas_y_Triggers]] | #alerta | Qué dispara acciones automáticas |
| [[Flujos_Email]] | #flujo | Comunicaciones automatizadas |
| [[SAC_Cumpleanos]] | #alerta | Cumpleaños y FDA de contactos |
| [[Preferencias_Usuario]] | #preferencia | Comportamiento adaptativo del agente |

### Módulos BASC y herramientas comerciales
| Nodo | Tag | Descripción |
|------|-----|-------------|
| [[Matriz_de_Riesgos]] | #modulo | Scoring BASC ponderado (6 variables, 4 niveles) |
| [[Gestion_Documental_BASC]] | #modulo | 18 docs BASC, cumplimiento ponderado y vencimiento |
| [[Preliquidador]] | #herramienta | Simulador de tarifas client-side (MAX calculado vs mínima) |
| [[Calendario_Visitas]] | #seguimiento | Calendario mensual de visitas comerciales |

---

## Convenciones de los archivos

Cada nodo sigue esta estructura:

```markdown
#tag1 #tag2

# Nombre del Nodo

> **Tipo:** descripción corta
> **Ruta:** /ruta-frontend (si aplica)
> **Dependencias:** [[Nodo1]] · [[Nodo2]]

---

## Propósito
## Lógica / Algoritmo
## UI (si aplica)
## Modelo de datos (si aplica)
## Conexiones
- [[OtroNodo]] — por qué están conectados
```

---

## Regla de mantenimiento

**Cuando se agrega un módulo nuevo:**
1. Crear `NombreModulo.md` con tag, propósito, lógica, modelo de datos y conexiones
2. Actualizar `Motores_de_Datos.md` — nuevas tablas DB y endpoints
3. Actualizar este `README.md` — agregar fila al mapa de nodos
4. Si el módulo cambia estados de pipeline → actualizar `Estados_del_Proceso.md`

**Nodos que siempre deben estar actualizados:**
- `Motores_de_Datos.md` — fuente de verdad de la API
- `ZYMO_CRM_AGENT.md` — prompt del agente principal
- `README.md` — índice del grafo

---

*Creado: 2026-05-28 — Área de Desarrollo e Innovación, Grupo ZYMO*
*Actualizado: 2026-05-29 — Módulos BASC + Herramientas comerciales + guía de mantenimiento*
