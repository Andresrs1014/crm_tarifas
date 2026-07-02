# Roadmap — Paridad módulo a módulo

## Leyenda

- ⬜ Pendiente
- 🟡 En progreso / parcial
- ✅ Validado visual + funcional vs HTML

## Módulos

| # | Módulo | Ruta | Visual | Funcional backend | Agente |
|---|--------|------|--------|------------------|--------|
| 0 | Design system | `html-v6.css`, Layout | ✅ | ✅ | Codex X1–X3 |
| 1 | Dashboard | `/dashboard` | ✅ | 🟡 `actividad_por_comercial` vacío → B6 | Codex X4 + Cursor |
| 2 | Nuevo Registro | `/registro` | ✅ | 🟡 No crea CrmMeta → B3 | Codex X4 |
| 3 | Prospectos | `/prospectos` | ✅ | ✅ | Codex X6 |
| 4 | CRM Pipeline | `/crm` | ✅ | 🟡 Prospectos nuevos sin CrmMeta → B3 | Cursor X7 |
| 5 | Clientes | `/clientes` | ✅ | ✅ | Cursor X8b |
| 5b | Detalle | `/detalle/:id` | ✅ | 🟡 GD no se crea en conversión → B2 | Cursor + Codex X9 |
| 6 | Equipo | `/equipo` | ✅ | ✅ | C16 + Minimax M5 |
| 7 | **Cotizaciones** (lista) | `/cotizaciones` | ✅ | 🟡 Aprobar no avanza pipeline → B4 | C13 |
| 7b | **Cotizaciones** (wizard paso 3) | `/cotizaciones/nueva` | 🟡 Transporte/Paqueteo schema | 🟡 | Codex X10 |
| 8 | **Biblioteca** (estándar) | `/biblioteca` | 🟡 `table-card`, col1/col2/col3 | ✅ | Codex X11 |
| 8b | **Biblioteca Transporte** | `/biblioteca` | ⬜ TRANSP_SCHEMA ausente | ⬜ | Codex X11 |
| 8c | **Biblioteca Paqueteo** | `/biblioteca` | ⬜ PAQUETEO_SCHEMA / tabs | ⬜ | Codex X11 |
| 9 | Matriz Riesgos | `/matriz-riesgos` | ✅ | ✅ | C16 |
| 10 | Gestión Documental | `/gestion-documental` | ✅ | 🟡 No auto-crea en conversión → B2 | C16 |
| 11 | Preliquidador | `/preliquidador` | ✅ | ✅ | C16 |
| 12 | Calendario | `/calendario` | ✅ | 🟡 Endpoint duplicado /vencidas → B1 | C16 + Minimax M6 |
| 13 | Cotizador Paqueteo | `/cotizador` | ✅ | ✅ (solo FE) | C16 |
| 14 | Fichas de Cliente | `/fichas` | ✅ | ✅ | C16 |
| 14b | FichaDetalle (tabs) | `/fichas/:id` | 🟡 Por QA tab por tab | ✅ | Cursor QA |
| 15 | SAC | `/sac` | ✅ | ✅ | C16 + Minimax M7 |
| — | **Integración backend** | — | — | ⬜ B1–B6 pendientes | Cursor |

---

## Fase 1 — ✅ Cerrada

- [x] Dashboard + Registro HTML v6 (Codex X1–X4)
- [x] Hover/tooltips gráficas
- [x] Eje pipeline legible
- [x] Aval humano

## Fase 2 — ✅ Cerrada (visual)

- [x] Prospectos, CRM Pipeline, Clientes (Codex X6, Cursor X7/X8)
- [x] Detalle formulario completo (Codex X9)
- [x] L5 Aval humano pendiente → depende de QA :82

## Fase 3 — ✅ Visual cerrada · Backend pendiente

- [x] C13 — Cotizaciones lista visual
- [x] C16 — Matriz, GD, Equipo, Herramientas, Calendario, SAC visual
- [x] Cursor — Biblioteca línea colapsable, grupos visibles; Detalle servicios/facturación
- [ ] **C17** — Auditoría + specs (esta sesión) ✅ docs
- [ ] **X10** — Wizard paso 3 Transporte/Paqueteo (SPEC-BIBLIOTECA-WIZARD § 5)
- [ ] **X11** — Biblioteca Transporte + Paqueteo + col1/col2/col3 (SPEC-BIBLIOTECA-WIZARD §2–4)
- [ ] **B1–B6** — Integraciones backend (SPEC-INTEGRACION-M8)
- [ ] **L5** — QA integración en :82 post-backend

