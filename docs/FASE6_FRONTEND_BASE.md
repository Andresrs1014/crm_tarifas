# Fase 6 — Frontend Base

## Stack
- React 18 + Vite + TypeScript
- Tailwind CSS
- React Router v6
- Zustand (estado global)
- TanStack Query (fetching + cache)
- Axios (HTTP client)

## Setup inicial
1. Crear proyecto: npm create vite@latest frontend -- --template react-ts
2. Instalar: tailwindcss, react-router-dom, zustand, @tanstack/react-query, axios
3. Configurar Tailwind con el design system del prototipo (ver tokens abajo)

## Design System — tokens CSS
Replicar exactamente del prototipo crm_oscar.html:
--bg: #0a0e1a
--surface: #111827
--surface2: #1a2235
--surface3: #1e2d45
--accent: #00c2ff
--accent2: #0077ff
--gold: #f5a623
--green: #00e676
--red: #ff4444
--purple: #a855f7
--text: #e8edf5
--text2: #8899b4
--border: #1e3050

## Tipografía
Google Fonts: Barlow Condensed (400,600,700,800) + Barlow (300,400,500,600)

## Estructura src/
src/
├── api/           -- funciones axios por módulo (auth.ts, records.ts, etc.)
├── components/    -- componentes reutilizables (Badge, StatCard, Table, Modal)
├── pages/         -- una carpeta por página
├── store/         -- zustand stores (authStore, cotWizardStore)
├── hooks/         -- custom hooks
├── types/         -- interfaces TypeScript
└── utils/         -- fmtTarifa, fmtCOP, parseTarifaNum (migrados del prototipo)

## Rutas
/ → redirect a /dashboard si autenticado, si no a /login
/login
/dashboard
/registro
/prospectos
/prospectos/:id
/clientes
/clientes/:id
/equipo
/cotizaciones
/cotizaciones/nueva
/cotizaciones/:id
/cotizaciones/:id/editar
/cotizaciones/actualizar-tarifas
/biblioteca
/cot/:numero → vista pública sin navbar (link ?ZYMO=COT001)

## authStore (Zustand)
{
  user: UserRead | null,
  token: string | null,
  login: (token, user) => void,
  logout: () => void,
  isAuthenticated: boolean
}
Token se persiste en localStorage.

## Funciones utilitarias a migrar del prototipo
- fmtCOP(valor): formatea número como COP → '$1.200.000'
- fmtTarifa(val, tipo): '559.900' + 'moneda' → '$559.900' | '0,36%' + 'porcentaje' → '0,36%'
- parseTarifaNum(str): '559.900' → 559900
- formatTarifaNum(num): 559900 → '559.900'
- fmtDate(str): 'YYYY-MM-DD' → '15 de marzo de 2026' (locale es-CO)

## Criterio de éxito Fase 6
- npm run dev levanta sin errores
- /login muestra formulario con el design system aplicado
- Login exitoso redirige a /dashboard
- Rutas protegidas redirigen a /login si no hay token
- Layout con navbar lateral o superior visible en rutas autenticadas