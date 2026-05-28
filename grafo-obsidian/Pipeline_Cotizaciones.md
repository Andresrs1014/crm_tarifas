#estado #proceso

# Pipeline de Cotizaciones

> **Tipo:** Nodo de sub-proceso
> **Dependencias:** [[Estados_del_Proceso]] · [[Biblioteca_Tarifas]] · [[Reglas_de_Negocio]]

---

## Wizard de 5 pasos

La creación de una cotización sigue un wizard secuencial:

```
Paso 1: Datos básicos
    empresa, NIT, ciudad, contacto, email, comercial, paqueteadora, vincular registro CRM
    ↓
Paso 2: Líneas de servicio
    Tipo de tarifa (biblioteca / especial)
    Selección de líneas: Zona Franca, Aduana, CEDI, etc.
    ↓
Paso 3: Selección de items
    Por cada línea: grupos → items con checkbox
    Se guarda en itemsSnapshot (snapshot inmutable)
    ↓
Paso 4: Observaciones
    Obs. predefinidas de la línea (de la Biblioteca)
    Obs. adicionales por línea
    Obs. generales de la cotización
    ↓
Paso 5: Resumen y confirmación
    Vista previa de todos los datos
    Guardar como borrador
```

---

## Numeración atómica

| Campo | Valor ejemplo |
|-------|--------------|
| Número | `COT-001` |
| Generado en | `POST /api/cotizaciones` |
| Mecanismo | Transacción en tabla `CotNumeroCounter` |
| Garantía | Nunca se repite, incluso con usuarios concurrentes |

---

## Vista pública de cotización

- URL: `https://crm.zymointranet.com/cot/:numero`
- **Sin autenticación** — el cliente puede ver su cotización desde el link
- Muestra: datos empresa, líneas, items con tarifas, observaciones
- El campo `htmlPreview` puede almacenar un render HTML pre-generado

---

## Acciones por estado

| Estado | Editar | Eliminar | Avanzar | Rechazar | Duplicar |
|--------|--------|----------|---------|---------|---------|
| borrador | ✅ | ✅ | ✅ | ✅ | ✅ |
| enviada | ❌ | ❌ | ✅ | ✅ | ✅ |
| negociacion | ❌ | ❌ | ✅ | ✅ | ✅ |
| aprobada | ❌ | ❌ | — | — | ✅ |
| rechazada | ❌ | ❌ | — | — | ✅ |

---

## Conexiones

- [[Biblioteca_Tarifas]] — fuente de items en Paso 3
- [[Estados_del_Proceso]] — máquina de estados
- [[Reglas_de_Negocio]] — snapshot, numeración, solo borrador eliminable
- [[Flujos_Email]] — email al enviar cotización
- [[KPIs_Tiempos]] — tiempo enviada → respuesta del cliente
