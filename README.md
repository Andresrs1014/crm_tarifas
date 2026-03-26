# Proyecto CRM Tarifas

Este repositorio contiene el backend (FastAPI + SQLAlchemy), documentación y recursos para el sistema de gestión comercial y cotizaciones de Grupo ZYMO.

## Estructura

- `backend/` — Backend Python (FastAPI, modelos, rutas, base de datos)
- `frontend/` — (vacío o en desarrollo)
- `docs/` — Documentación funcional y técnica
- `crm_oscar.html` — Prototipo HTML monolítico original
- `docker-compose.yml` — Orquestación de servicios

## Primeros pasos

1. Clona el repositorio:
   ```bash
   git clone <URL-del-repo>
   ```
2. Crea tu entorno virtual y activa:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # o venv\Scripts\activate en Windows
   ```
3. Instala dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Configura variables de entorno (`.env` o `.env.example`).
5. Ejecuta el backend:
   ```bash
   uvicorn app.main:app --reload
   ```

## Docker

Puedes levantar todo con:
```bash
docker-compose up --build
```

## Notas
- Revisa la carpeta `docs/` para detalles de cada fase y modelo de datos.
- El frontend está en desarrollo.

---
Grupo ZYMO — 2026
