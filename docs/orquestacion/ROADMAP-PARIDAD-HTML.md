# Roadmap — Paridad módulo a módulo

## Leyenda

- ⬜ Pendiente
- 🟡 En progreso
- ✅ Validado visual + funcional vs HTML

## Módulos

| # | Módulo | Ruta | Visual | Agente |
|---|--------|------|--------|--------|
| 0 | Design system | `html-v6.css`, Layout | ✅ | Codex |
| 1 | Dashboard | `/dashboard` | ✅ | Codex + Cursor |
| 2 | Nuevo Registro | `/registro` | ✅ | Codex |
| 3 | **Prospectos** | `/prospectos` | 🟡 | Codex X6 ✅ |
| 4 | CRM Pipeline | `/crm` | 🟡 | Cursor X7 ✅ |
| 5 | Clientes | `/clientes` | 🟡 | Cursor X8b ✅ |
| 5b | **Detalle** | `/detalle/:id` | 🟡 | Cursor + **Claude C8 → Codex X9** |
| 6 | Equipo | `/equipo` | ⬜ | Minimax M5 |
| 7 | **Cotizaciones** | `/cotizaciones` | ⬜ | **Claude C9 → Codex X10** |
| 8 | **Biblioteca** | `/biblioteca` | ⬜ | **Claude C10 → Codex X11** |
| 9 | **Matriz Riesgos** | `/matriz-riesgos` | ⬜ | **Claude C11 → Codex X12** |
| 10 | **Gestión Documental** | `/gestion-documental` | ⬜ | **Claude C11 → Codex X12** |
| 11 | Preliquidador | `/preliquidador` | ⬜ | Claude C12 |
| 12 | Calendario | `/calendario` | ⬜ | Minimax M6 |
| 13 | Cotizador | `/cotizador` | ⬜ | Claude C12 |
| 14 | Fichas | `/fichas` | ⬜ | Claude C12 |
| 15 | SAC | `/sac` | ⬜ | Minimax M7 |

## Fase 1 — ✅ Cerrada

- [x] Dashboard + Registro HTML v6
- [x] Hover/tooltips gráficas
- [x] Eje pipeline legible
- [x] Aval humano

## Fase 2 — Aval humano pendiente

- [x] GAP + implement Prospectos, CRM, Clientes
- [ ] **L5** Aval humano en :82

## Fase 3 — En preparación

- [ ] Claude **C8–C12** GAP (Detalle, Cotizaciones, Biblioteca, BASC, Herramientas)
- [ ] Codex **X9–X12** tras cada GAP (+ X8 chartTheme paralelo)
