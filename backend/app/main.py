from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.auth.service import get_user_by_username, hash_password
from app.auth.router import router as auth_router
from app.config import settings
from app.database import engine, create_db_and_tables
from app.models.user import User  # noqa: F401 — necesario para que SQLModel registre la tabla


def _seed_superadmin() -> None:
    """Crea el superadmin inicial si no existe ningún usuario."""
    with Session(engine) as session:
        existing = get_user_by_username(session, settings.first_superadmin_username)
        if existing:
            return
        superadmin = User(
            username=settings.first_superadmin_username,
            email=f"{settings.first_superadmin_username}@zymo.local",
            hashed_password=hash_password(settings.first_superadmin_password),
            is_active=True,
            is_superadmin=True,
        )
        session.add(superadmin)
        session.commit()
        print(f"[seed] Superadmin '{settings.first_superadmin_username}' creado.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    _seed_superadmin()
    yield


app = FastAPI(
    title="CRM Tarifas ZYMO",
    description="Backend API para el CRM de Tarifas de Grupo ZYMO",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/api")


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "project": "CRM Tarifas ZYMO"}
