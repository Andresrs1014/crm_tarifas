# Grafo Obsidian — CRM Comercial Grupo ZYMO

> Vault de conocimiento del agente IA del CRM.
> Indexar con **LightRAG** → disponible como context en **zymo-intranet**.

---

## Cómo usar este vault

1. Abrir esta carpeta como vault en Obsidian
2. Activar vista de Grafo (`Ctrl+G`) para visualizar las conexiones
3. El nodo central es [[ZYMO_CRM_AGENT]]

## Cómo indexar con LightRAG

```bash
# Desde el servidor de zymo-intranet
lightrag-index \
  --input-dir ./grafo-obsidian/ \
  --output-dir ./lightrag-index/ \
  --model claude-sonnet-4-6
```

## Mapa de nodos

| Nodo | Tag | Descripción |
|------|-----|-------------|
| [[ZYMO_CRM_AGENT]] | #agente | Nodo raíz — System Prompt |
| [[Mente_ZYMO_SUBAGENT]] | #agente | Subagente de razonamiento |
| [[Actores_y_Roles]] | #actor | Usuarios del sistema |
| [[Alertas_y_Triggers]] | #alerta | Qué dispara acciones |
| [[Flujos_Email]] | #flujo | Comunicaciones automatizadas |
| [[Estados_del_Proceso]] | #estado | Máquinas de estado |
| [[KPIs_Tiempos]] | #kpi | Métricas de desempeño |
| [[Motores_de_Datos]] | #motor | APIs y base de datos |
| [[Reglas_de_Negocio]] | #regla | Restricciones del dominio |
| [[Preferencias_Usuario]] | #preferencia | Comportamiento adaptativo |
| [[Conexion_Sistema_Gerencial]] | #gerencia | Integración zymo dormido |
| [[Pipeline_Prospectos]] | #estado | Kanban y flujo |
| [[Pipeline_Cotizaciones]] | #estado | Wizard 5 pasos |
| [[Biblioteca_Tarifas]] | #motor | Árbol de tarifas |
| [[SAC_Cumpleanos]] | #alerta | Cumpleaños y FDA |
| [[SSO_Flow]] | #motor | Autenticación federada |

---

*Creado: 2026-05-28 — Área de Desarrollo e Innovación, Grupo ZYMO*
