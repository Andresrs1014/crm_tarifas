#actor

# Actores y Roles

> **Tipo:** Nodo de actores del sistema
> **Dependencias:** [[ZYMO_CRM_AGENT]] · [[Reglas_de_Negocio]] · [[Preferencias_Usuario]]

---

## Actores internos

### Superadmin
- **Acceso:** Todas las funciones del CRM
- **Acciones exclusivas:** Gestión de usuarios, ver todos los comerciales, acceso a `/admin/usuarios`
- **Identificación:** `role: "superadmin"` en JWT
- **Flujo:** Login → Dashboard con KPIs globales → gestión completa

### Usuario (Comercial)
- **Acceso:** Dashboard, Prospectos, Clientes, Cotizaciones, Biblioteca, SAC
- **Acciones:** CRUD de sus registros, crear cotizaciones, registrar actividades
- **Identificación:** `role: "usuario"` en JWT
- **Flujo:** Login / SSO → Dashboard → Pipeline prospectos → Detalle → Registro

### Zymo Intranet (Actor externo)
- **Tipo:** Sistema SSO federado
- **Interacción:** Emite `sso_token` JWT firmado con `JWT_SECRET` compartido
- **Flujo:** [[SSO_Flow]] → valida token → crea sesión CRM
- **URL:** `https://zymointranet.com?sso_token=<JWT>`

### Cliente / Prospecto (Actor externo pasivo)
- **Tipo:** Entidad de datos, no usuario del sistema
- **Representación:** Entidad `CRMRecord` con `tipo: "prospecto" | "cliente"`
- **Interacción indirecta:** Recibe cotizaciones públicas vía URL `/cot/:numero`

---

## Roles de autorización

| Ruta | superadmin | usuario |
|------|-----------|---------|
| `/dashboard` | ✅ | ✅ |
| `/prospectos` | ✅ | ✅ |
| `/clientes` | ✅ | ✅ |
| `/cotizaciones` | ✅ | ✅ |
| `/biblioteca` | ✅ | ✅ |
| `/equipo` | ✅ | ✅ |
| `/sac` | ✅ | ✅ |
| `/admin/usuarios` | ✅ | ❌ |
| `/crm` (Kanban) | ✅ | ✅ |

---

## Conexiones

- [[ZYMO_CRM_AGENT]] — agente que asiste a los actores
- [[Preferencias_Usuario]] — comportamiento adaptativo por actor
- [[Reglas_de_Negocio]] — qué puede hacer cada rol
- [[Alertas_y_Triggers]] — qué notificaciones recibe cada actor
- [[Estados_del_Proceso]] — visibilidad por rol
