#regla

# Reglas de Negocio

> **Tipo:** Nodo de restricciones del dominio
> **Dependencias:** [[ZYMO_CRM_AGENT]] · [[Mente_ZYMO_SUBAGENT]] · [[Estados_del_Proceso]]

---

## Reglas de tarifas

### R1 — Las tarifas son strings, siempre
- Las tarifas en la Biblioteca son strings: `"$559.900"`, `"0,36%"`, `"USD 12"`
- **Nunca** se almacenan como número flotante
- **Razón:** Permiten formatos mixtos (moneda colombiana, porcentaje, USD, rangos)
- En cotizaciones, el campo `itemsSnapshot` guarda el string tal cual fue seleccionado

### R2 — Snapshot inmutable de cotizaciones
- Al crear/guardar una cotización, se hace deep clone JSON de los items seleccionados
- Las cotizaciones pasadas **no cambian** aunque se actualice la Biblioteca
- **Razón:** Integridad histórica — un cliente no puede ver precios distintos a los que le cotizaron

---

## Reglas de numeración

### R3 — Cotizaciones con numeración atómica
- Formato: `COT-001`, `COT-002`, ... , `COT-999`, `COT-1000`
- Generado con transacción de base de datos en tabla `CotNumeroCounter`
- **Nunca** se reutiliza un número, incluso si la cotización se elimina
- **Razón:** Trazabilidad contable y legal

---

## Reglas del pipeline

### R4 — Estados de prospecto (dirección válida)
- Puede avanzar o retroceder libremente entre etapas (no hay lock)
- `frio` y `perdido` son estados terminales recomendados pero no bloqueantes
- La conversión a cliente es un proceso manual: el comercial crea un registro nuevo `tipo: "cliente"`

### R5 — Solo borradores se pueden eliminar (cotizaciones)
- Cotizaciones en estado `enviada`, `negociacion`, `aprobada`, `rechazada` no se pueden eliminar desde la UI
- **Razón:** Trazabilidad — las cotizaciones enviadas son documentos comerciales

### R6 — Comercial requerido en todo registro
- Todo prospecto y cliente debe tener un `comercialId` asignado
- Si el comercial se elimina del sistema, sus registros quedan huérfanos (dato histórico)

---

## Reglas de servicios

### R7 — Catálogo fijo de servicios logísticos
```
['Zona Franca', 'Depósito Aduanero', 'CEDI', 'Transporte', 'Paqueteo', 'Aduana']
```
- No se pueden agregar nuevos servicios desde la UI (están hardcodeados como constantes)
- Los servicios del registro (`Record.servicios`) son un subconjunto de este catálogo

---

## Reglas de usuarios y acceso

### R8 — Superadmin no se puede eliminar a sí mismo
- El usuario autenticado no puede eliminar su propia cuenta desde `/admin/usuarios`
- **Razón:** Evitar lockout del sistema

### R9 — SSO como única fuente de verdad de identidad
- El `JWT_SECRET` del CRM y de `zymo-intranet` deben ser idénticos
- Si difieren, el SSO falla y los usuarios deben hacer login manual

---

## Reglas SAC

### R10 — FDA solo para contactos que reciben regalos
- El campo `fdaEntregado` solo tiene significado si `recibeRegalos === true`
- El agente solo muestra alerta FDA para contactos con `recibeRegalos: true`

---

## Conexiones

- [[ZYMO_CRM_AGENT]] — el agente aplica estas reglas
- [[Mente_ZYMO_SUBAGENT]] — razona respetando restricciones
- [[Estados_del_Proceso]] — reglas de transición
- [[Biblioteca_Tarifas]] — regla de strings
- [[Pipeline_Cotizaciones]] — reglas de numeración e inmutabilidad
- [[Actores_y_Roles]] — reglas de acceso por rol
