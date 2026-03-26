# Correcciones UI — Pendientes

## 1. Renombrar "Biblioteca" → "Servicios" en navegación
El tab en el navbar ya dice "SERVICIOS" (correcto en la foto).
Verificar que en TODOS los archivos donde aparezca "Biblioteca" 
como label visible al usuario cambie a "Servicios".
El nombre interno del componente/archivo puede quedarse igual.

## 2. Layout general — contenido muy apretado a la izquierda
PROBLEMA: El contenido de todas las páginas (Prospectos, Clientes, 
Equipo, Cotizaciones, Servicios) aparece pegado a la izquierda.
SOLUCIÓN: El contenedor principal de cada página debe tener:
  - max-width: 1400px
  - margin: 0 auto
  - padding: 28px 32px
Esto centra el contenido y le da respiro en pantallas grandes,
igual que se ve en la foto de referencia.

## 3. Colores por servicio en las tarjetas de Servicios
Replicar EXACTAMENTE estos colores del prototipo original:
  Zona Franca      → color: #00c2ff  (azul cyan)
  Depósito Aduanero→ color: #f5a623  (gold/naranja)
  CEDI             → color: #f5a623  (gold/naranja)
  Transporte       → color: #00e676  (verde)
  Paqueteo         → color: #a855f7  (purple)
  Aduana           → color: #ff4444  (rojo)

Cada tarjeta de servicio debe mostrar el nombre en su color 
correspondiente, igual que en la foto (Zona Franca en cyan, 
Depósito Aduanero en gold, CEDI en gold, etc.)

## 4. Fecha y hora en el header
El header debe mostrar en la esquina superior derecha:
  - Fecha: formato largo en español — "jueves, 26 de marzo de 2026"
  - Hora: formato 12h — "04:08 p. m."
  - Fecha en color: #00c2ff (accent cyan)
  - Hora en color: #8899b4 (text2)
Actualizar en tiempo real (setInterval cada segundo).

## 5. Ancho de tarjetas en página Servicios
Las tarjetas de cada servicio deben ocupar el ancho completo 
del contenedor (igual que en la foto), con:
  - background: #1a2235 (surface2)
  - border: 1px solid #1e3050
  - border-radius: 12px
  - padding: 16px 20px
  - gap entre tarjetas: 16px
NO deben estar comprimidas ni tener ancho fijo pequeño.

## 6. Servicios de interés en Nuevo Registro
En el formulario de Nuevo Registro, la sección 
"Servicios de interés" debe mostrar los servicios 
que vienen del backend (GET /api/biblioteca) 
y NO una lista hardcodeada.
Cada servicio se muestra como chip seleccionable 
con el color correspondiente de la lista del punto 3.

## Referencia visual
Ver screenshot adjunto: la foto muestra el estado 
CORRECTO que debe quedar. El layout usa todo el ancho 
disponible, las tarjetas son amplias, los colores son 
los del design system original.