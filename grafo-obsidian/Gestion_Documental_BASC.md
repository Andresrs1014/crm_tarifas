#modulo #basc

# Gestión Documental BASC

> **Tipo:** Módulo de cumplimiento documental
> **Ruta:** `/gestion-documental`
> **Dependencias:** [[Motores_de_Datos]] · [[Matriz_de_Riesgos]] · [[Reglas_de_Negocio]]

---

## Propósito

Gestiona el cumplimiento de los 18 documentos BASC requeridos por cliente. Calcula automáticamente el porcentaje de cumplimiento, el vencimiento del ciclo, y alerta sobre documentos vencidos o próximos a vencer.

---

## Lógica de Cumplimiento

### Tipos de cliente
- **Directo**: aplican los 18 documentos (pond_di)
- **Referido/Intermediario**: aplican solo los documentos con aplica='todos' (pond_ref)

### Cálculo
```
cumplimiento = Σ (peso_doc × factor_estado) / Σ pesos_aplicables
factor_estado: completo=1.0, incompleto=0.5, pendiente=0
```

### Vencimiento del ciclo
- Referencia: fecha del documento **FR-001-GC**
- Vence: FR-001-GC + 1 año
- Alertas: `vencido` (<0 días), `por-vencer` (≤60 días), `con-tiempo` (>60 días), `sin-fecha` (sin FR-001-GC)

---

## 18 Documentos BASC

Cada documento tiene: id, nombre, aplica ('todos'|'directo'), pond_di, pond_ref

Ejemplos clave:
- FR-001-GC: Formulario registro de cliente (peso alto, aplica=todos)
- FR-002: Hoja de vida empresa (peso alto)
- FR-003: Declaración BASC
- FR-036: Certificado BASC (si aplica)
- Cámara de Comercio, RUT, documentos financieros, etc.

---

## UI

- **4 KPI cards**: total / completos / por vencer / vencidos
- **Alertas banner**: rojo para vencidos, ámbar para por-vencer
- **Tabla**: progress bar de cumplimiento, estado vencimiento, estado docs global
- **DocModal**: panel lateral slide-in con edición por documento (estado/fecha/observación), recalcula en tiempo real, selector de ciclo

---

## Modelo de datos

```prisma
model GestionDocumental {
  id          String  @id @default(cuid())
  recordId    String  @unique
  docs        Json    @default("{}")  // { "FR-001-GC": { estado, fecha, obs }, ... }
  cicloActual Int     @default(2025)
  record      Record  @relation(...)
}
```

---

## Conexiones

- [[Motores_de_Datos]] — endpoints `GET/PUT /api/gestion-documental`
- [[Matriz_de_Riesgos]] — complemento de evaluación BASC
- [[Reglas_de_Negocio]] — requisitos documentales por tipo de cliente
