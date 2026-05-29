#modulo #basc

# Matriz de Riesgos BASC

> **Tipo:** Módulo de gestión de riesgo
> **Ruta:** `/matriz-riesgos`
> **Dependencias:** [[Motores_de_Datos]] · [[Actores_y_Roles]] · [[Reglas_de_Negocio]]

---

## Propósito

Evalúa el nivel de riesgo BASC de cada prospecto/cliente mediante un scoring ponderado de 6 variables. Genera un nivel automático (BAJO/MEDIO/ALTO/CRÍTICO) y sugiere controles preventivos.

---

## Algoritmo de Scoring

| Variable | Peso | Escala |
|----------|------|--------|
| Mercancía | 45% | 1–5 |
| Facturación | 25% | 1–5 |
| Frecuencia | 15% | 1–5 |
| Tipo Persona | 5% | 1–5 |
| Tiempo en sector | 5% | 1–5 |
| Capital | 5% | 1–5 |

**Puntaje** = Σ (valor × peso)

**Ajustadores** (no ponderados, binarios):
- `cert`: tiene certificación BASC → reduce riesgo
- `anFin`: análisis financiero hecho → reduce riesgo

### Niveles de Riesgo
| Puntaje | Nivel |
|---------|-------|
| = 0 | PENDIENTE |
| > 0 | BAJO |
| ≥ 3 | MEDIO |
| ≥ 4 | ALTO |
| ≥ 5 | CRÍTICO |

---

## UI

- **KPI row**: conteo de registros por nivel (CRÍTICO / ALTO / MEDIO / BAJO / PENDIENTE)
- **Alerta banner**: si hay pendientes sin evaluar
- **Tabla inline-editable**: 8 campos editables por fila con InlineSelect
- **RiesgoBadge**: color-coded (rojo/naranja/amarillo/verde/gris)
- **Panel de controles**: sugerencias automáticas según nivel

---

## Modelo de datos

```prisma
model MatrizRiesgo {
  id          String  @id @default(cuid())
  recordId    String  @unique
  companias   Json    // { "Logimat": true, "IMC Cargo": false, ... }
  mercancia   Int?
  tipoPersona Int?
  tiempo      Int?
  capital     Int?
  frecuencia  Int?
  facturacion Int?
  cert        Boolean?
  anFin       Boolean?
  puntaje     Float   @default(0)
  riesgo      String  @default("PENDIENTE")
  control     String?
  frecControl String?
  record      Record  @relation(...)
}
```

---

## Conexiones

- [[Motores_de_Datos]] — endpoints `GET/PUT /api/matriz-riesgos`
- [[Reglas_de_Negocio]] — criterios BASC y ponderación
- [[Gestion_Documental_BASC]] — módulo complementario de cumplimiento
