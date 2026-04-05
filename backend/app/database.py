from sqlalchemy import text
from sqlmodel import SQLModel, create_engine, Session
from app.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},  # needed for SQLite
    echo=False,
)


def _existing_columns(conn, table: str) -> set[str]:
    """Retorna el conjunto de nombres de columnas existentes en una tabla SQLite."""
    rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
    return {row[1] for row in rows}


def apply_migrations() -> None:
    """
    Aplica ALTER TABLE para columnas nuevas en bases de datos existentes.
    SQLite no soporta ADD COLUMN IF NOT EXISTS, así que verificamos con PRAGMA primero.
    Solo se ejecuta cuando la tabla ya existe; las tablas nuevas las crea create_all.
    """
    migrations: list[tuple[str, str, str]] = [
        # (tabla, columna, definición SQL)
        ("records",          "direccion",         "TEXT"),
        ("records",          "categoria",         "TEXT"),
        ("contactos",        "cumpleanos",        "DATE"),
        ("contactos",        "recibe_regalos",    "TEXT"),
        ("contactos",        "fotos_entrega",     "TEXT"),
        ("contactos",        "fotos_fda",         "TEXT"),
        ("contactos",        "fda_entregado",     "INTEGER"),
        ("contactos",        "direccion",         "TEXT"),
        ("cotizaciones",     "paqueteadora",      "TEXT"),
        ("cotizaciones",     "tarifa_tipo",       "TEXT"),
        ("cotizaciones",     "tarifa_especial_id","TEXT"),
    ]

    with engine.connect() as conn:
        for table, column, col_type in migrations:
            # Verificar si la tabla existe
            tables = conn.execute(
                text("SELECT name FROM sqlite_master WHERE type='table' AND name=:t"),
                {"t": table},
            ).fetchall()
            if not tables:
                continue  # la tabla la crea create_all más adelante

            existing = _existing_columns(conn, table)
            if column not in existing:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
                print(f"[migration] {table}.{column} añadida.")

        conn.commit()


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
