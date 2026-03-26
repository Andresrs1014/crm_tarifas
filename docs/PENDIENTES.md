# Pendientes de implementación

## Carga masiva de registros (Fase 9)

**Estado:** No implementado — ni backend ni frontend tienen nada de esto.

### Backend (por hacer)
- Endpoint `POST /api/records/import` que reciba un archivo Excel/CSV
- Dependencia a agregar en `requirements.txt`: `openpyxl`
- Validar columnas mínimas: `empresa`, `tipo` (prospecto/cliente)
- Retornar resumen: cuántos creados, cuántos con error y por qué

### Frontend (por hacer)
- Dependencia: `xlsx` (SheetJS) — `npm install xlsx`
- Wizard de 3 pasos:
  1. **Subir archivo** — drag & drop o selector, previsualizar primeras filas
  2. **Mapear columnas** — relacionar columna Excel → campo del sistema
  3. **Confirmar e importar** — mostrar resumen de resultados

### Dónde integrarlo
- Botón "Importar" en las páginas `/prospectos` y `/clientes` (junto al botón "Nuevo Registro")
- Ruta sugerida: `/registro/importar`

---

## Gestión de usuarios (Fase 9)

**Estado:** No implementado en frontend. El backend tiene el modelo `User` y autenticación, pero no hay UI.

- Ruta: `/admin/usuarios`
- Solo visible para `is_superadmin = true`
- CRUD básico: listar usuarios, crear, cambiar contraseña, desactivar
