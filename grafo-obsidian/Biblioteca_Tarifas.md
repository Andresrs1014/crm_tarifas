#motor #tarifa

# Biblioteca de Tarifas

> **Tipo:** Nodo de motor de datos de tarifas
> **Dependencias:** [[Motores_de_Datos]] · [[Reglas_de_Negocio]] · [[Pipeline_Cotizaciones]]

---

## Estructura del árbol

```
BibliotecaLinea (ej: "Zona Franca")
  └── BibliotecaGrupo (ej: "Almacenamiento")
        └── BibliotecaItem (ej: "Posición mensual" → "$559.900")
        └── BibliotecaItem (ej: "Manejo de entrada" → "0,36%")
  └── BibliotecaGrupo (ej: "Servicios adicionales")
        └── ...
  └── BibliotecaObs (ej: "Condiciones generales" → HTML)
```

---

## Tipos de tarifa

| Tipo | Ejemplo | Nota |
|------|---------|------|
| `moneda` | `"$559.900"` | Precio fijo en COP |
| `porcentaje` | `"0,36%"` | Porcentaje sobre valor |
| Libre | `"USD 12 / kg"` | String arbitrario |

**Regla:** Las tarifas son siempre strings — ver [[Reglas_de_Negocio]] R1.

---

## CRUD disponible

| Entidad | Crear | Leer | Actualizar | Eliminar |
|---------|-------|------|-----------|---------|
| Línea | `POST /api/biblioteca/lineas` | `GET /api/biblioteca` | `PUT .../lineas/:id` | `DELETE .../lineas/:id` |
| Grupo | `POST .../lineas/:id/grupos` | incluido en GET | `PUT .../grupos/:id` | `DELETE .../grupos/:id` |
| Item | `POST .../grupos/:id/items` | incluido en GET | `PUT .../items/:id` | `DELETE .../items/:id` |
| Obs | `POST .../lineas/:id/obs` | `GET .../lineas/:id/obs` | `PUT .../obs/:id` | `DELETE .../obs/:id` |

---

## Comportamiento en cotizaciones

1. Wizard Paso 2 → el comercial selecciona qué **líneas** incluir
2. Wizard Paso 3 → selecciona **items** específicos por grupo
3. Al guardar → se hace **snapshot** de los items seleccionados en `itemsSnapshot`
4. La cotización queda **inmutable** aunque la biblioteca cambie después

---

## Columnas extra

Cada línea puede tener `columnas: string[]` para columnas adicionales de los items (ej: "Unidad", "Nota"). Se almacenan en `item.extraCols` como `{ [columna]: valor }`.

---

## Conexiones

- [[Pipeline_Cotizaciones]] — la biblioteca alimenta el wizard
- [[Reglas_de_Negocio]] — tarifas como strings, snapshot
- [[Motores_de_Datos]] — endpoint `GET /api/biblioteca`
- [[ZYMO_CRM_AGENT]] — el agente puede consultar tarifas
