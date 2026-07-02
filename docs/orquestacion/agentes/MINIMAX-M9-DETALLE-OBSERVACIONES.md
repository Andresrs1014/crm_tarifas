# M9 — Edición inline de Observaciones en Detalle CRM

**Agente:** Minimax  
**ID tarea:** **M9**  
**Tipo:** Implementación frontend pequeña  
**Prioridad:** Alta (pedido humano directo)  
**Entregable:** Código + nota breve en `docs/orquestacion/reportes/REPORTE-MINIMAX.md` (sección M9)

---

## Comando para el humano (pegar en chat Minimax)

```
Ejecuta lo que tenga tu nombre — tarea M9 observaciones en Detalle.
```

---

## Problema

En `/detalle/:id` (pestaña **Información**), la sección **📝 Observaciones** muestra el texto en solo lectura. Para editarlo hay que pulsar **Editar** en el header y entrar al modo edición global de todo el registro.

El humano quiere **editar las observaciones ya existentes** directamente en esa sección, como en el HTML v6 (textarea visible y usable sin activar edición completa del ficha).

---

## Comportamiento esperado

1. En la sección `detalle-observaciones`, el usuario ve un **textarea** con el contenido actual (o vacío con placeholder).
2. Puede modificar texto **sin** pulsar "Editar" del header.
3. Al guardar:
   - Botón dedicado **"Guardar observaciones"** (recomendado), o
   - Autoguardado con debounce + toast (aceptable si es claro en UX).
4. Persistencia vía API existente: `PUT /api/records/:id` con `{ observaciones: string }`.
5. Toast éxito/error (usar `toastStore`, no `alert()`).
6. Tras guardar, invalidar query `['record', id]` (y opcionalmente `['records']`).

**No romper:** modo edición global ("Editar" del header) debe seguir funcionando; evitar doble fuente de verdad conflictiva (sincronizar estado local con `record.observaciones` al cargar/refetch).

---

## Archivos clave

| Archivo | Qué tocar |
|---------|-----------|
| `frontend/src/components/detalle/DetalleCrmPanel.tsx` | UI observaciones + handler guardado |
| `frontend/src/pages/Detalle.tsx` | Opcional: mutation dedicada o reutilizar `updateMut` |
| `frontend/src/api/records.ts` | Ya tiene `updateRecord` — no cambiar contrato |
| `frontend/src/styles/html-v6.css` | Ajustes mínimos si hace falta (botón/textarea compacto) |

Referencia layout compacto reciente: clases `detalle-observaciones`, `detalle-observaciones-text`, `detalle-inline-input`.

---

## Referencia HTML v6

- HTML: textarea de observaciones accesible en la ficha de detalle, no bloqueada detrás de un modo edición global.
- Comparar en monolito: campos `f-obs-prospecto` / `f-obs-cliente` en flujo de guardado (`docs/_html-extract/saveRecord.js`).

---

## Restricciones

| Prohibido | Permitido |
|-----------|-----------|
| Docker / `.env` / backend nuevo endpoint | Solo frontend + CSS |
| Refactor masivo de `DetalleCrmPanel` | Cambio acotado a observaciones |
| `alert()` bloqueante | `toast.success` / `toast.error` |
| Hardcodear URLs o secretos | Reutilizar `updateRecord` |

---

## Criterios de Done

- [ ] Textarea editable con observaciones existentes cargadas
- [ ] Guardar persiste en backend y se ve al recargar
- [ ] Feedback visual (loading/disabled en botón mientras guarda)
- [ ] `npm run build` en `frontend/` pasa
- [ ] Nota en reporte Minimax con archivos tocados y cómo probar en `:82`

---

## Cómo probar (Docker :82)

1. Login `admin_local` / `AdminLocal2026!`
2. Abrir un prospecto con observaciones en `/detalle/:id`
3. Editar texto en sección Observaciones **sin** pulsar Editar global
4. Guardar → recargar → texto persistido

---

## Coordinación

- **Codex** sigue en B1–B6 + X9–X12 — no tocar esos archivos salvo conflicto en Detalle.
- **Cursor** documentó la tarea; integrará tras tu reporte si hace falta.
