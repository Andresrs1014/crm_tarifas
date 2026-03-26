# Fase 9 — Polish y Features Finales

## Carga Masiva
Endpoint: POST /api/records/import (body: array de records parseados)
Frontend: wizard de 3 pasos
  1. Descargar plantilla Excel (generar con SheetJS, incluye comerciales existentes)
  2. Upload .xlsx → parsear con SheetJS → mapeo flexible de columnas
  3. Preview con validación (verde=ok, rojo=error) → confirmar importación

Mapeo de columnas flexible (igual al prototipo):
  empresa/company/razon → empresa
  nit/identificacion → nit
  contacto/contact → contacto
  comercial/asesor/vendedor → buscar en lista de comerciales
  servicios/services/interes → mapear a servicios del sistema
  estado/status → mapear a estado según tipo

Validaciones requeridas:
  - empresa no puede estar vacía
  - comercial debe existir en el sistema
  - Registros inválidos se omiten, no detienen la importación

## EmailJS — Notificación apertura cotización
Al abrir vista pública (/cot/:numero) enviar notificación.
Variables de entorno necesarias:
  VITE_EMAILJS_PUBLIC_KEY
  VITE_EMAILJS_SERVICE_ID
  VITE_EMAILJS_TEMPLATE_ID

Datos a enviar: numero_cot, empresa, contacto, comercial, fecha_hora, lineas, asunto

## Gestión de Usuarios (UI)
Página /admin/usuarios — solo visible para superadmin
  - Listar usuarios: GET /api/auth/users
  - Crear usuario: POST /api/auth/register
  - Desactivar/activar: PUT /api/auth/users/{id}
  - Eliminar: DELETE /api/auth/users/{id}

## UX Polish
- Loading states en todas las tablas (skeleton loader)
- Empty states con mensaje e ícono (igual al prototipo)
- Toast notifications: éxito (verde), error (rojo), warning (gold)
- Confirmación modal antes de eliminar cualquier registro
- Responsive: navbar colapsable en mobile, tablas con scroll horizontal
- Scrollbar custom (igual al prototipo: thin, dark)

## Variables de entorno frontend (.env)
VITE_API_URL=http://localhost:8000
VITE_EMAILJS_PUBLIC_KEY=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=

## Criterio de éxito final
- Login → Dashboard con datos reales
- Crear prospecto → aparece en tabla
- Crear cotización completa → PDF descargable
- Link público funciona sin login
- Carga masiva desde Excel funciona
- Notificación EmailJS al abrir cotización pública