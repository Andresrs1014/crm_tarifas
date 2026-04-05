# Mejoras Visuales Pendientes

Diagnóstico y cambios acordados — pendientes para después de completar Fase 9.

## Problemas identificados

1. **Jerarquía visual plana** — título, filtros y tabla compiten sin orden claro
2. **Rainbow de colores en Dashboard** — 6 StatCards con 6 colores distintos, se ve disperso - Pero mantengamoslo, para que tengan dinamismo las cards, lo que si toca hacer es que se vea mejor.
3. **Header superior es ruido vacío** — solo muestra fecha/hora, espacio izquierdo completamente vacío
4. **Loading y empty states sin diseño** — solo texto gris flotando, se siente inacabado
5. **Botón de acción principal ausente en listas** — no hay "Nuevo" en /prospectos ni /clientes
6. **Sidebar sin estructura** — "Nuevo Registro" mezclado con páginas de listado, todo pesa igual
7. **StatCard número neón agresivo** — text-3xl en color eléctrico se ve más gaming que CRM corporativo
8. **Detalle no usa PageContainer** — usa p-6 max-w-4xl directo, inconsistente con el resto

## Cambios a implementar

| # | Cambio | Archivos |
|---|---|---|
| 1 | StatCard: número en blanco, acento solo en barra superior y label | `StatCard.tsx` |
| 2 | Dashboard: reducir a 2 colores de acento (azul + verde), tonos del mismo para variación | `Dashboard.tsx` |
| 3 | Header: agregar título dinámico de página a la izquierda (o eliminarlo y dar espacio al contenido) | `Layout.tsx` |
| 4 | Sidebar: separar "Nuevo Registro" del grupo nav con divider sutil | `Layout.tsx` |
| 5 | Prospectos / Clientes: botón "Nuevo" en header que lleve a `/registro` | `Prospectos.tsx`, `Clientes.tsx` |
| 6 | Loading state: skeleton de 5 filas con animate-pulse en lugar de texto | `Prospectos.tsx`, `Clientes.tsx`, `Cotizaciones.tsx` |
| 7 | Empty state: ícono + mensaje centrado en lugar de texto plano | mismo grupo |
| 8 | Detalle: envolver en `PageContainer` | `Detalle.tsx` |
