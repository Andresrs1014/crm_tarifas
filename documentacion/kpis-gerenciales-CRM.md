# KPIs Gerenciales - Grupo ZYMO CRM

Bloque Markdown generado a partir de `kpis-gerenciales-CRM.html`.

## Objetivo

Panel gerencial para visualizar indicadores clave del CRM relacionados con prospectos, clientes, ingresos, riesgo comercial y seguimientos próximos a vencer.

## Integración en el CRM

### 1. Agregar botón en la barra lateral

Agregar el botón después del botón de Dashboard existente:

```html
<button class="nav-tab" onclick="showPage('kpis-gerenciales')">
  <span>📈</span><span class="nav-label">KPIs Gerenciales</span>
</button>
```

### 2. Insertar bloque HTML

Copiar el bloque HTML del contenedor:

```html
<div id="page-kpis-gerenciales">
```

Pegar este bloque antes del comentario:

```html
<!-- ========== CALENDARIO ========== -->
```

### 3. Insertar estilos

Copiar los estilos relacionados con `kpi-ger-*` dentro del `<style>` global del documento original.

### 4. Insertar script

Copiar el bloque `<script>` completo de la sección KPIs Gerenciales antes del cierre del script principal.

Luego agregar la llamada a la función dentro de `showPage()`:

```javascript
if (page === 'kpis-gerenciales') renderKPIsGerenciales();
```

## Módulo KPIs Gerenciales

El módulo calcula y presenta los siguientes indicadores:

| KPI | Descripción |
|---|---|
| Tasa de conversión de prospectos | Prospectos que alcanzaron el estado `Facturado` sobre el total de prospectos. |
| Tiempo promedio de cierre por etapa | Días promedio que permanece un prospecto en cada estado del pipeline. |
| Ingresos esperados vs. realizados | Comparación entre el potencial proyectado en prospectos activos y la facturación efectiva registrada. |
| Clientes en riesgo | Porcentaje y cantidad de clientes con estado `en-riesgo`. |
| Tasa de abandono por etapa | Porcentaje de prospectos que no avanzan desde cada etapa del pipeline. |
| Prospectos próximos a vencer seguimiento | Prospectos con seguimiento vencido o por vencer en los próximos 7 días. |

## Pipeline Comercial

Las etapas contempladas para los prospectos son:

| Orden | Estado interno | Etiqueta visible |
|---:|---|---|
| 1 | `prospecto` | Prospecto |
| 2 | `reconocimiento` | Visita |
| 3 | `propuesta` | Propuesta |
| 4 | `aceptacion_propuesta` | Aceptación |
| 5 | `creacion_sop` | Ficha Cliente |
| 6 | `facturado` | Facturado |

## Encabezado del Panel

# 📈 KPIs Gerenciales

- Fecha de corte: generada automáticamente.
- Acción disponible: `Actualizar`, ejecutando `renderKPIsGerenciales()`.

## Tarjetas KPI

El panel muestra seis tarjetas numéricas principales:

| Tarjeta | Valor mostrado | Detalle |
|---|---|---|
| Tasa Conversión | `%` de conversión | Convertidos sobre total de prospectos. |
| Tiempo Promedio de Cierre | Días promedio | Calculado con prospectos facturados que tienen fecha de visita y fecha de registro. |
| Ingresos Realizados | Valor COP | Comparado contra ingresos esperados. |
| Clientes en Riesgo | `%` en riesgo | Clientes en riesgo sobre total de clientes. |
| Seguimientos Vencidos | Cantidad | Prospectos con seguimiento vencido. |
| Base Comercial | Total registros | Suma de prospectos y clientes. |

## Tasa de Conversión de Prospectos

Prospectos que alcanzaron estado `Facturado` sobre el total de prospectos.

**Fórmula:**

```text
Tasa de conversión = prospectos facturados / total prospectos * 100
```

## Tiempo Promedio de Cierre por Etapa

Días promedio que permanece un prospecto en cada estado del pipeline.

La visualización original usa una gráfica de barras mediante Chart.js.

## Ingresos Esperados vs. Realizados por Comercial

Comparación entre:

| Serie | Fuente |
|---|---|
| Ingresos Esperados | Prospectos activos con `ingresosEsperados`. |
| Ingresos Realizados | Facturación efectiva registrada en `facturacionLineas`. |

Valores expresados en COP.

## Clientes por Estado de Relación

Distribución del portafolio de clientes activos según estado de riesgo.

| Estado | Descripción |
|---|---|
| Activo | Cliente activo o sin estado definido. |
| En riesgo | Cliente marcado como `en-riesgo`. |
| Inactivo | Cliente marcado como `inactivo`. |

## Tasa de Abandono por Etapa del Pipeline

Porcentaje de prospectos que no avanzan desde cada estado.

**Lectura sugerida:**

| Color | Interpretación |
|---|---|
| Verde | Bajo abandono, menor a 25%. |
| Amarillo | Abandono medio, entre 25% y 50%. |
| Rojo | Alto abandono, mayor a 50%. |

## Prospectos con Seguimiento Vencido o Por Vencer

Tabla para identificar prospectos con seguimiento vencido o próximos a vencer en los siguientes 7 días.

| Empresa | Comercial | Estado | Ingresos Esperados | Fecha Seguimiento | Días de Retraso | Urgencia |
|---|---|---|---:|---|---:|---|
| Pendiente de datos dinámicos | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

### Criterios de urgencia

| Condición | Etiqueta |
|---|---|
| Fecha de seguimiento anterior a hoy | Crítico / vencido |
| Seguimiento vence hoy o en máximo 3 días | Urgente |
| Seguimiento vence entre 4 y 7 días | Próximo |

## Datos de Demostración Incluidos en el HTML

El archivo original incluye datos de demostración para previsualizar el módulo:

| Tipo | Cantidad aproximada |
|---|---:|
| Prospectos demo | 9 |
| Clientes demo | 6 |

Estos datos están dentro del bloque `db.records` y simulan el comportamiento del CRM real.

## Dependencias Técnicas del HTML Original

| Dependencia | Uso |
|---|---|
| Chart.js 4.4.1 | Gráficas de barras, comparativos y dona. |
| Barlow / Barlow Condensed | Tipografías visuales del panel. |
| JavaScript nativo | Cálculo de métricas y renderizado dinámico. |

## Nota

Este Markdown conserva la estructura, contenido e intención funcional del archivo HTML original, pero no ejecuta JavaScript ni renderiza gráficas interactivas. Para mantener la interactividad, se debe usar el archivo HTML original dentro del CRM.
