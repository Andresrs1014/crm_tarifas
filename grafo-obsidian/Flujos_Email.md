#flujo #email

# Flujos de Email

> **Tipo:** Nodo de comunicaciones automatizadas
> **Dependencias:** [[Alertas_y_Triggers]] · [[Actores_y_Roles]] · [[Estados_del_Proceso]]

---

## Flujos de email definidos

### 1. Cotización enviada al cliente
- **Trigger:** `estadoCotizacion → "enviada"`
- **Destinatario:** `contacto.email` del registro vinculado
- **Asunto:** `Propuesta comercial Grupo ZYMO — COT-XXX`
- **Cuerpo:** Enlace público `https://crm.zymointranet.com/cot/:numero`
- **Estado:** Pendiente de implementar (backend tiene endpoint, UI no lo dispara)

### 2. Seguimiento vencido — recordatorio interno
- **Trigger:** [[Alertas_y_Triggers]] `proximoSeguimiento < hoy`
- **Destinatario:** Email del comercial asignado
- **Asunto:** `Seguimiento pendiente — [Empresa]`
- **Cuerpo:** Nombre del prospecto/cliente, último estado, días vencidos
- **Estado:** Candidato a implementar con job diario

### 3. Cumpleaños SAC — recordatorio interno
- **Trigger:** Día del cumpleaños del contacto
- **Destinatario:** Email del comercial que gestiona la cuenta
- **Asunto:** `🎂 Cumpleaños hoy — [Nombre Contacto] de [Empresa]`
- **Cuerpo:** Nombre, empresa, si recibe regalo, estado FDA
- **Estado:** Candidato a automatizar con cron job

### 4. Cotización aprobada — notificación interna
- **Trigger:** `estadoCotizacion → "aprobada"`
- **Destinatario:** Comercial + superadmin
- **Asunto:** `✅ Cotización aprobada — COT-XXX [Empresa]`
- **Cuerpo:** Resumen de líneas, comercial, fecha
- **Estado:** Candidato a implementar

---

## Plantillas de email (candidatas)

```
PLANTILLA: seguimiento_vencido
Hola [nombre_comercial],

Tienes un seguimiento pendiente con [empresa] desde hace [N] días.
Estado actual: [estado_prospecto]
Próxima acción sugerida: [accion]

Accede al registro: https://crm.zymointranet.com/detalle/[id]

— Grupo ZYMO CRM
```

---

## Infraestructura email requerida

| Componente | Estado |
|-----------|--------|
| Servicio SMTP | Pendiente — usar nodemailer + SMTP Grupo ZYMO |
| Templates HTML | Pendiente — diseñar con paleta CRM |
| Job diario (cron) | Pendiente — backend worker |
| Unsubscribe / control | Opcional |

---

## Conexiones

- [[Alertas_y_Triggers]] — qué dispara los emails
- [[Actores_y_Roles]] — quién los recibe
- [[Estados_del_Proceso]] — estados que generan emails
- [[SAC_Cumpleanos]] — emails de cumpleaños
- [[KPIs_Tiempos]] — tiempo de respuesta medido desde email enviado
