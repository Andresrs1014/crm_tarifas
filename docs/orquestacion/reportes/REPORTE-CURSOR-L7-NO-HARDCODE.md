# REPORTE CURSOR L7 — Auditoría anti-hardcode

**Fecha:** 2026-06-25  
**Tarea:** Revisar que no quede hardcode disperso tras regla `06-no-hardcode.mdc`

---

## Resultado: 🟡 Parcial — críticos resueltos, deuda documentada

### ✅ Sin problemas (OK)

| Área | Estado |
|------|--------|
| Secretos / passwords en código | ✅ No encontrados en `frontend/` ni `backend/src/` |
| URLs `localhost` en TSX | ✅ No encontradas |
| Datos empresas/comerciales en UI | ✅ Vienen de API (`getRecords`, `getComercialesApi`) |
| Servicios logísticos | ✅ Unificados: `types/SERVICIOS` → re-export de `HTML_SERVICES` |

### ✅ Centralizado en esta auditoría

Nuevo módulo **`frontend/src/lib/htmlV6/domainConfig.ts`**:

| Antes (duplicado) | Ahora |
|-------------------|-------|
| `ESTADOS[]` en Prospectos, Registro, Detalle | `PROSPECTO_FILTER_OPTIONS`, `PROSPECTO_FORM_OPTIONS` |
| `ESTADO_BADGE` × 6 archivos | `PROSPECTO_BADGE`, `CLIENTE_BADGE`, `COTIZACION_BADGE` |
| `ESTADOS_ACTIVOS` inline CRMKanban | `constants.ESTADOS_ACTIVOS` |
| `STAGES` colores CRM Kanban | `CRM_KANBAN_STAGES` |
| `SVC_COLORS` duplicado Preliquidador | import desde `domainConfig` |
| Colores Recharts en Dashboard | `chartTheme.ts` (`CHART_DONUT_TIPO`, etc.) |
| Pipeline cotizaciones Dashboard | `COT_PIPELINE_CHART` |
| `estadoBadge.tsx` maps inline | `PROSPECTO_LABEL`, `PROSPECTO_BADGE` |

**Build:** `npm run build` ✅

### 🟡 Deuda aceptable / Fase 2+

| Ubicación | Qué queda | Acción futura |
|-----------|-----------|---------------|
| `GestionDocumental.tsx`, `MatrizRiesgos.tsx` | Mapas estado → color hex | Mover a `domainConfig` cuando Codex toque esos módulos (X8+) |
| `Login.tsx` | Gradientes decorativos | OK como diseño; opcional tokens en `html-v6.css` |
| `Detalle.tsx` | `TIPO_ACT_ICON`, `ESTADOS_COT`, labels emoji cliente | UI copy; mover a domainConfig en refactor Detalle |
| `backend/app/seed.py` | Seed biblioteca Zona Franca | Seed de arranque, no UI — documentado |
| `migrate_backup.js` | Script one-shot migración | OK — no es runtime app |

### ❌ Prohibido que vuelva a pasar

- Arrays de estados pipeline en páginas nuevas → usar `domainConfig`
- `#00c2ff` sueltos en páginas → `SVC_COLORS` / `chartTheme` / CSS vars
- Listas de servicios distintas a `HTML_SERVICES`

---

## Verificación

```powershell
cd frontend && npm run build
```

---

## Parada

Auditoría L7 completada. Fase 2 puede continuar con Claude C5–C7 y Codex X6 usando `domainConfig` como fuente única.
