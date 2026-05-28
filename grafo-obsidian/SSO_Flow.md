#motor #autenticacion

# SSO Flow — Autenticación Federada

> **Tipo:** Nodo de flujo de autenticación
> **Dependencias:** [[Motores_de_Datos]] · [[Actores_y_Roles]] · [[Conexion_Sistema_Gerencial]]

---

## Flujo completo SSO

```
1. Usuario autenticado en zymo-intranet.com
   ↓
2. Clic en enlace "CRM Comercial" en la intranet
   Genera URL: https://crm.zymointranet.com?sso_token=<JWT_INTRANET>
   ↓
3. Frontend CRM (useSSOToken.ts) detecta ?sso_token en la URL
   ↓
4. POST /api/auth/sso { token: "<JWT_INTRANET>" }
   ↓
5. Backend CRM verifica JWT con JWT_SECRET compartido
   → Extrae username del payload
   → Busca usuario en tabla `User` del CRM
   → Si no existe: lo crea con role: "usuario"
   ↓
6. Backend emite NUEVO JWT del CRM
   { id, username, role } — expira en 8 horas
   ↓
7. Frontend guarda token CRM en localStorage
   → Redirige a /dashboard
   → No muestra pantalla de login
```

---

## Flujo login manual (fallback)

```
POST /api/auth/login
{ username: "andres", password: "***" }
  ↓
Verifica contraseña (bcrypt)
  ↓
Emite JWT CRM
  ↓
/dashboard
```

---

## Variables de entorno críticas

| Variable | Dónde | Descripción |
|----------|-------|-------------|
| `JWT_SECRET` | `backend/.env` | **Debe ser idéntico** al de zymo-intranet |
| `INTRANET_URL` | `backend/.env` | URL base de la intranet |
| `VITE_API_URL` | `frontend/.env` | URL del backend CRM |

---

## Conexiones

- [[Actores_y_Roles]] — quién se autentica
- [[Conexion_Sistema_Gerencial]] — la intranet es la fuente del SSO
- [[Motores_de_Datos]] — el backend gestiona tokens
- [[Reglas_de_Negocio]] R9 — JWT_SECRET debe ser idéntico
