# MiniMax M13 — Shell paridad HTML v6 (Sidebar + Header + Layout)

**Autorizado · Cursor orquestador · 2026-06-30**  
**Paralelo a Claude C16** — sin solapamiento de archivos de módulos.

## Comando humano

```
Ejecuta lo que tenga tu nombre — tarea M13 Shell paridad HTML v6.
Brief: docs/orquestacion/agentes/MINIMAX-M13-SHELL-PARIDAD.md
```

---

## Objetivo

El **marco** de la app (sidebar, header, área main) debe verse igual al HTML v6. Si el shell falla, todos los módulos se ven “distintos” aunque estén bien por dentro.

## Fuente de verdad

- HTML: `Ultima_versión/seguimiento-zymo-v6 (88).html`
- GAP shell: `docs/orquestacion/referencia/GAP-DASHBOARD-REGISTRO.md` § Layout global (G-02, G-03, G-13…)
- CSS: `docs/orquestacion/referencia/html-v6-styles.css` (bloques `.sidebar`, `.header`, `.nav-tab`)
- React: `frontend/src/styles/html-v6.css`

## Archivos (SOLO estos)

| Archivo | Qué |
|---------|-----|
| `frontend/src/components/layout/Sidebar.tsx` | Ancho 200px, nav-tab HTML, secciones, fuentes |
| `frontend/src/components/layout/Header.tsx` | Alto 60px, bg `var(--surface)`, logo/usuario |
| `frontend/src/components/layout/Layout.tsx` | `marginTop: 60px`, `marginLeft: 200px` alineado |
| `frontend/src/styles/html-v6.css` | Reglas `.sidebar`, `.header`, `.nav-tab` si faltan |

**No tocar:** páginas de módulos, wizard, Docker, `.env`, backend.

---

## Checklist (prioridad 🔴 del GAP)

- [ ] **Header altura 60px** (no 70px) — `Header.tsx`
- [ ] **Header background** sólido `var(--surface)` (sin gradiente distinto al HTML)
- [ ] **Sidebar ancho 200px** (no 220px) — `Sidebar.tsx` + `Layout.tsx`
- [ ] **Sidebar** `top: 60px`, fondo `#0e1320` / `var(--surface)` según HTML
- [ ] **Nav items:** fuente **Barlow Condensed**, uppercase, ~14px, letter-spacing como HTML (`.nav-tab`)
- [ ] **Main** padding/márgenes coherentes con `.main` en html-v6.css
- [ ] Item activo sidebar: mismo estilo HTML (borde/accent)
- [ ] Label sidebar **Biblioteca** → en HTML puede decir **Servicios** (línea 39 Sidebar: `'Servicios'` — verificar vs HTML y alinear texto)

---

## Funcional

- **No romper** rutas, permisos `superadmin`, logout, NavLink activo.
- Lucide icons pueden quedar; prioridad es **medidas, tipografía y colores**.

---

## Entregable

Actualizar `docs/orquestacion/reportes/REPORTE-MINIMAX.md` § **M13** con:
- Checklist marcado
- Antes/después (medidas clave)
- Archivos tocados

`npm run build` en `frontend/` debe pasar.

---

## Reglas

- Cambios pequeños y acotados al shell
- Si necesitas tocar `index.css` global, documenta por qué; preferir `html-v6.css`
- Cursor hace Docker rebuild cuando el humano lo pida
