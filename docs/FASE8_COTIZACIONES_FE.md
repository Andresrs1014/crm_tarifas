# Fase 8 — Cotizaciones Frontend

## IMPORTANTE — Leer antes de codear
Esta es la fase más compleja. El cotWizardStore debe diseñarse
ANTES de tocar UI. Ver sección Store abajo.

## cotWizardStore (Zustand)
Estado completo del wizard de 5 pasos:
{
  id: string | null,          -- null si es nueva, uuid si es edición
  paso: 1 | 2 | 3 | 4 | 5,
  empresa: string,
  nit: string,
  record_id: string | null,   -- vinculación opcional a registro del CRM
  contacto: string,
  cargo: string,
  email: string,
  telefono: string,
  comercial_id: string,
  fecha: string,              -- YYYY-MM-DD
  vigencia: string,           -- YYYY-MM-DD
  estado: string,
  asunto: string,
  lineas: string[],           -- servicios seleccionados
  items: ItemsMap,            -- estructura igual a items_snapshot
  obs_plantillas: Record<string, string[]>,
  obs_libre: string,

  -- acciones
  setPaso: (n) => void,
  setDatosGenerales: (data) => void,
  setLineas: (lineas) => void,
  toggleLinea: (svc) => void,
  setItems: (items) => void,
  toggleGrupo: (svc, gid, checked) => void,
  toggleItem: (svc, gid, idx, checked) => void,
  updateItemField: (svc, gid, idx, field, val) => void,
  toggleObsPlantilla: (svc, obsId) => void,
  setObsLibre: (text) => void,
  resetWizard: () => void,
  loadFromCotizacion: (cot) => void  -- para edición
}

## Wizard — 5 pasos

### Paso 1: Datos Generales
Campos: empresa (selector de existentes o nueva), NIT, contacto, cargo, email,
teléfono, comercial, fecha, vigencia, estado, asunto

### Paso 2: Seleccionar Líneas
Grid de chips con los 6 servicios. Toggle selección.
Solo las líneas seleccionadas aparecen en Paso 3.

### Paso 3: Configurar Ítems
Por cada línea seleccionada mostrar sus grupos e ítems de la biblioteca.
Checkbox por grupo (selecciona todos sus ítems) y por ítem individual.
Campos editables: nombre, tarifa ($ o %), observación, columnas extra.
IMPORTANTE: editar aquí NO modifica la biblioteca — solo el wizard state.

### Paso 4: Observaciones
Por cada línea mostrar sus plantillas de observaciones (de biblioteca).
Checkbox para seleccionar cuáles incluir.
Campo de texto libre adicional.

### Paso 5: Vista Previa
Renderizar HTML de la cotización igual al prototipo.
Botones: Guardar borrador, Guardar y enviar, Exportar PDF (window.print()).

## Otras páginas del módulo

### Lista de Cotizaciones
Tabla con filtros: search, estado, comercial
Acciones por fila: ver, editar, duplicar, copiar link, PDF, eliminar

### Vista Pública (/cot/:numero)
Sin navbar. Solo lectura. Misma vista previa del wizard.
Al cargar notificar apertura via EmailJS.

### Actualizar Tarifas
1. Buscar cotización base (autocomplete)
2. Seleccionar % de incremento
3. Marcar ítems a incrementar (excluye tipo=porcentaje automáticamente)
4. Preview antes/después
5. Confirmar → crea nueva cotización

## Funciones a migrar del prototipo (src/utils/cotizacion.ts)
- buildCotHTML(wizard, biblioteca): genera HTML completo para preview/print
- fmtTarifa(val, tipo): formatea tarifa para display
- parseTarifaNum(str): string → número
- formatTarifaNum(num): número → string formato COP

## Notas
- buildCotHTML es la función más larga — migrarla completa desde el prototipo
- El PDF se hace con window.print() + CSS @media print (igual que el prototipo)
- EmailJS config va en variables de entorno: VITE_EMAILJS_SERVICE_ID, etc.
- Link público formato: /cot/COT001 (normalizar COT-001 → COT001 en la URL)