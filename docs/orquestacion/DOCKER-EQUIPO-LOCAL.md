# Docker — solo en ESTE equipo

Todo el trabajo del reinicio CRM ocurre **en tu PC**. Docker aquí para:

- Probar rápido sin instalar Node/Postgres sueltos
- Ver **logs en terminal** (`docker compose logs -f`)
- Usar **agent browser** contra http://localhost:82

**No hay despliegue remoto en este proyecto.**

---

## Setup (una vez)

PowerShell, desde la raíz del repo:

```powershell
Copy-Item .env.docker.local .env
docker compose up --build -d
```

Linux/macOS:

```bash
cp .env.docker.local .env
docker compose up --build -d
```

---

## URLs en tu máquina

| Qué | URL |
|-----|-----|
| **App (abrir en browser / agent browser)** | http://localhost:82 |
| **API health** | http://localhost:3003/api/health |
| **PostgreSQL** | localhost:5435 |

Login seed (pruebas): `admin_local` / `AdminLocal2026!`

---

## Logs en vivo

```powershell
docker compose logs -f
docker compose logs -f frontend
docker compose logs -f backend
```

---

## Referencia visual HTML

Abre en el navegador (archivo local, no Docker):

`Ultima_versión/seguimiento-zymo-v6 (88).html`

Compara lado a lado con http://localhost:82

---

## Reset rápido de BD

```powershell
docker compose down -v
docker compose up --build -d
```

---

## Troubleshooting

| Problema | Qué hacer |
|----------|-----------|
| Build frontend falla | Ver logs build; revisar `tailwind.config.js` |
| Backend no arranca | `docker compose logs backend`; revisar `DATABASE_URL` en `.env` |
| Login falla | Reset volumen; seed crea `admin_local` al inicio |
| Puerto ocupado | Cambiar puertos en `docker-compose.yml` o liberar 82/3003/5435 |
