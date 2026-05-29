#modulo #herramienta

# Preliquidador

> **Tipo:** Herramienta de cálculo de tarifas
> **Ruta:** `/preliquidador`
> **Dependencias:** [[Motores_de_Datos]] · [[Biblioteca_Tarifas]] · [[Pipeline_Cotizaciones]]

---

## Propósito

Calcula el costo estimado de servicios logísticos a partir de una cotización aprobada y datos operativos reales (peso, valor mercancía, m², días, etc.). Permite al equipo comercial simular liquidaciones antes de cotizar formalmente.

---

## Flujo de uso

1. **Paso 1**: Buscar cotización por empresa o número → seleccionar ítems a preliquidar (checkboxes por línea→grupo→ítem)
2. **Paso 2**: Ingresar datos variables — el sistema detecta automáticamente qué campos mostrar según los ítems seleccionados
3. **Paso 3**: Ver tabla de resultados con concepto, base, nota y valor; total consolidado; botón imprimir

---

## Motor de cálculo

Portado del engine original JS. Lógica por tipo de cargo:

- **Ad Valorem**: `valor_mercancia × porcentaje`
- **Seguro**: `valor_mercancia × rate_seguro`
- **Almacenamiento**: `m2_ocupados × dias × tarifa_diaria` con mínimos
- **Manipulación/Kg**: `kilos × tarifa`, MIN(calculado, mínima)
- **Despacho**: tarifa fija o por rangos de peso
- **Otros**: tarifa directa de la biblioteca

Regla general: `resultado = MAX(calculado, mínima)`

---

## Detección automática de campos

`detectFields()` inspecciona los nombres/grupos de los ítems seleccionados:
- Keywords "almacenamiento" → muestra campo días y m²
- Keywords "peso", "kg" → muestra campo kilos
- Keywords "valor", "mercancía" → muestra campo valor mercancía
- Keywords "despacho" → muestra campo despachos

---

## Frontend only

Sin endpoint propio. Lee datos de `/api/cotizaciones` (existente). Cálculo completamente client-side con la librería `xlsx` para exportar.

---

## Conexiones

- [[Biblioteca_Tarifas]] — tarifas base y mínimas
- [[Pipeline_Cotizaciones]] — fuente de datos para preliquidar
- [[Motores_de_Datos]] — consume endpoint `/api/cotizaciones`
