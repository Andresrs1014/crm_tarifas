#herramienta #modulo

# Cotizador Paqueteo

> **Tipo:** Herramienta de simulación de envíos
> **Ruta:** `/cotizador`
> **Dependencias:** [[Reglas_de_Negocio]] · [[Biblioteca_Tarifas]] · [[Motores_de_Datos]]

---

## Propósito

Simulador client-side que calcula el costo de envío paqueteo por las 3 mensajeradoras principales (Coordinadora, TCC, Servientrega) según destino, tamaño y peso del paquete.

**Sin endpoint propio** — todo el cálculo es en frontend, sin persistencia en BD.

---

## Lógica de zonas

Colombia se divide en 3 zonas para tarifas:

| Zona | Descripción | Ejemplos |
|------|-------------|---------|
| Zona 1 | Capitales principales | Bogotá, Medellín, Cali, Barranquilla, Cartagena, Bucaramanga, Pereira, Manizales, Ibagué, Cúcuta |
| Zona 2 | Ciudades intermedias | Palmira, Bello, Itagüí, Montería, Valledupar, Sincelejo, Santa Marta, Armenia, Popayán... (25 ciudades) |
| Zona 3 | Resto del país | Todas las demás municipalidades |

**Descuento local:** Si origen y destino son el mismo municipio → **30% de descuento** sobre tarifa base.

---

## Cálculo de peso cobrable

```
pesoVolumetrico = (largo × ancho × alto) / 5000   [kg]
pesoCobrable    = MAX(pesoReal, pesoVolumetrico)
```

---

## Tamaños estándar disponibles

| Tamaño | Dimensiones (cm) |
|--------|-----------------|
| Sobre / Pequeño | 20 × 15 × 10 |
| Mediano | 35 × 25 × 15 |
| Grande | 60 × 40 × 30 |
| Extra Grande | 100 × 100 × 120 |

También acepta dimensiones personalizadas (modo "Personalizado").

---

## Mensajeradoras y colores

| Mensajera | Color |
|-----------|-------|
| Coordinadora | `#e8001c` (rojo) |
| TCC | `#005baa` (azul) |
| Servientrega | `#f7941d` (naranja) |

---

## UI

- Selector cascadado Departamento → Municipio (33 departamentos colombianos)
- Toggle Estándar / Personalizado para dimensiones
- Tabla de resultados ordenada de menor a mayor precio
- Badge **MEJOR PRECIO** en la primera fila

---

## Modelo de datos (solo en memoria, no persiste)

```typescript
interface Resultado {
  mensajera: string
  color: string
  trayecto: 'LOCAL' | 'NACIONAL'
  zona: 1 | 2 | 3
  pesoReal: number
  pesoVolumetrico: number
  pesoCobrable: number
  tarifa: number
}
```

---

## Conexiones

- [[Biblioteca_Tarifas]] — misma lógica de tarifas, aplicada a paqueteo
- [[Reglas_de_Negocio]] — regla de peso cobrable = MAX(real, vol)
- [[Motores_de_Datos]] — no tiene endpoint, es frontend-only
