# Codex — Fase 3 Ejecución (X9–X12 + X8)

**Agente:** Codex  
**Fase:** 3 — Implementación visual + funcional alineada a GAP  
**Estado:** **PREPARADO** — ejecutar **módulo a módulo** tras GAP Claude + aval humano Fase 2  
**Leer siempre:** `CODEX-BRIEF-EJECUCION.md`, `06-no-hardcode.mdc`, GAP del módulo

---

## Comando para el humano (pegar en Codex)

```
Ejecuta Fase 3 Codex — módulo asignado (X9, X10, X11 o X12).

Lee docs/orquestacion/agentes/CODEX-FASE3-EJECUCION.md.
Usa el GAP Claude correspondiente en docs/orquestacion/referencia/.
Tras cada módulo: npm run build en frontend + reporte en REPORTE-CODEX-EJECUCION.md.

⛔ No re-hacer X6/X7/X8b (Prospectos/CRM/Clientes) salvo bug P0 documentado.
⛔ No tocar docker-compose salvo build verify.
Esperar GAP Claude antes de empezar cada X*.
```

---

## Contexto

| Fase 2 | Responsable | Estado |
|--------|-------------|--------|
| X6 Prospectos | Codex | ✅ |
| X7 CRM | Cursor | ✅ |
| X8b Clientes | Cursor | ✅ |
| Detalle + convert | Cursor | ✅ sin GAP formal → **X9 usa C8** |

**Bloqueo blando:** Se recomienda **aval humano L5** (Fase 2 en :82) antes de X9. Si el humano autoriza paralelo, Codex puede avanzar **solo lectura GAP + prep** (listar archivos, no commit).

---

## Reglas de ejecución (heredadas + Fase 3)

1. **Solo clases HTML reales** — ver lista en `CODEX-BRIEF-EJECUCION.md`
2. Catálogos → `frontend/src/lib/htmlV6/domainConfig.ts` o `constants.ts` (nunca arrays duplicados en pages)
3. `fmtMoney` / `fmtEstado` → utils compartidos (`utils/fmtMoney.ts`, `fmtEstado.ts`)
4. CSS nuevo → `frontend/src/styles/html-v6.css` (prefijos por página: `.detalle-*`, `.page-cot-*`, etc.)
5. Tras cada X*: `cd frontend && npm run build` **debe pasar**
6. Documentar en `reportes/REPORTE-CODEX-EJECUCION.md` + captura QA opcional
7. Código ajeno mal → `OBJECIONES-CODEX.md`, no arreglar fuera de scope
8. **No revertir** trabajo Cursor en CRM/Detalle salvo GAP C8 lo marque 🔴 explícito

---

## X9 — Detalle unificado

| Campo | Valor |
|-------|-------|
| **Depende** | **C8** `GAP-DETALLE.md` + aval L5 recomendado |
| **Archivos** | `Detalle.tsx`, `DetalleCrmPanel.tsx`, `html-v6.css` |
| **Prioridad** | 🔴 Primera tarea Fase 3 |

### Checklist implementación (anticipado — validar contra C8)

- [ ] section-title / header acciones alineado HTML
- [ ] Grid 2 cols info contacto + comercial
- [ ] Pipeline prospecto: etapa activa azul sólido, pasadas con ✓
- [ ] Observaciones + actividades en misma vista (sin tab actividades)
- [ ] btn-green “+ Nueva actividad” + form inline
- [ ] Botón convertir: solo prospecto, modal confirmación (Cursor ya lo tiene — verificar paridad C8)
- [ ] Tab cotizaciones: table-card + link wizard
- [ ] Vista cliente post-conversión: campos facturación, sin pipeline prospecto
- [ ] **Opcional si C8 lo pide:** stageHistory / “Tiempos en etapas”
- [ ] Quitar Tailwind genérico donde GAP marque 🔴

### No tocar sin GAP

- Lógica mutations (convert, actividades) — solo UI/layout salvo bug P0

---

## X10 — Cotizaciones

| Campo | Valor |
|-------|-------|
| **Depende** | **C9** `GAP-COTIZACIONES.md` |
| **Archivos** | `Cotizaciones.tsx`, wizard components, `CotPublica.tsx`, `api/cotizaciones.ts` |
| **Prioridad** | 🔴 |

### Checklist (validar contra C9)

- [ ] Lista: `section-title`, `table-card`, `table-header-2row`, filtros dentro del card
- [ ] Badges estado desde `COTIZACION_BADGE` / `domainConfig`
- [ ] Acciones fila: paridad HTML (PDF, duplicar, estados)
- [ ] Wizard 5 pasos: labels, navegación, validación por paso
- [ ] Vista pública `/cot/:numero`: branding y totales
- [ ] Modal actualizar tarifas % si GAP lo incluye
- [ ] Conexión `?recordId=` desde Detalle
- [ ] CSS `page-cotizaciones` en html-v6.css

---

## X11 — Biblioteca de Tarifas

| Campo | Valor |
|-------|-------|
| **Depende** | **C10** `GAP-BIBLIOTECA.md` |
| **Archivos** | `Biblioteca.tsx`, `html-v6.css` |
| **Prioridad** | 🟡 |

### Checklist (validar contra C10)

- [ ] section-title + layout árbol HTML
- [ ] Expand/collapse líneas/grupos
- [ ] CRUD inline estilo HTML (no cards Tailwind genéricas)
- [ ] Columnas dinámicas por línea
- [ ] Observaciones por línea
- [ ] Build OK

---

## X12 — Matriz Riesgos + Gestión Documental

| Campo | Valor |
|-------|-------|
| **Depende** | **C11** `GAP-MATRIZ-RIESGOS.md` + `GAP-GESTION-DOCUMENTAL.md` |
| **Archivos** | `MatrizRiesgos.tsx`, `GestionDocumental.tsx`, `domainConfig.ts` |
| **Prioridad** | 🟡 |

### Checklist (validar contra C11)

- [ ] Listados: table-card, filtros, badges riesgo/cumplimiento
- [ ] **Mover hardcode** estado→color a `domainConfig` (deuda L7)
- [ ] Detalle scoring matriz: 6 variables + pesos visibles
- [ ] Gestión doc: 18 ítems, ciclo, vencimiento UI
- [ ] Filtros search / completa / vencida
- [ ] Build OK

---

## X8 — chartTheme (paralelo, baja prioridad)

| Campo | Valor |
|-------|-------|
| **Depende** | Ningún GAP nuevo |
| **Referencia** | `GAP-DASHBOARD-HOVER.md`, `chartTheme` existente |
| **Cuándo** | Entre módulos o si humano pide |

- [ ] Extraer tema Recharts compartido para Gerencial u otros módulos con gráficas
- [ ] No romper Dashboard hover ya avalado

---

## Orden recomendado

```
Esperar C8 ──► X9 Detalle
Esperar C9 ──► X10 Cotizaciones
Esperar C10 ─► X11 Biblioteca
Esperar C11 ─► X12 Matriz + Gestión Doc
X8 en paralelo cuando haya slack
```

**Minimax M5–M7 (Equipo, Calendario, SAC)** — Codex **no** implementa; solo documentar objeciones si GAP futuro lo pide.

---

## Verificación obligatoria por entrega

```bash
cd frontend && npm run build
# Opcional Docker (Codex sí puede):
docker compose build frontend
```

Reporte mínimo por X*:

```markdown
## X9 Detalle — YYYY-MM-DD
- Archivos tocados: ...
- GAP items cerrados: D-01, D-02, ...
- Build: OK / FAIL
- Captura: reportes/codex-detalle-x9.png (opcional)
- Objeciones / fuera de scope: ...
```

---

## Criterios de Done (Codex Fase 3)

| ID | Done cuando |
|----|-------------|
| X9 | C8 existe + build OK + Detalle paridad 🔴 del GAP |
| X10 | C9 + build OK + lista + wizard + pública |
| X11 | C10 + build OK |
| X12 | C11 + hardcode matriz/gestion movido a domainConfig |
| X8 | chartTheme documentado y aplicado donde aplique |

---

## Qué NO es Fase 3 Codex

- ❌ X6/X7/X8b de nuevo (Fase 2 cerrada)
- ❌ Equipo, Calendario, SAC (Minimax)
- ❌ M8 conexiones (Minimax investigación)
- ❌ Commits (humano / Cursor L4)
- ❌ Cambios backend salvo bug P0 acordado con Cursor

---

*Autor: Cursor (líder) · 2026-06-22*
