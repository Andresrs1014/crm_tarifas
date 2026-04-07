from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Busca .env en backend/ primero, luego sube a la raíz del proyecto
_HERE = Path(__file__).resolve().parent.parent  # backend/
_ROOT = _HERE.parent                             # crm_tarifas/
_ENV_FILE = _HERE / ".env" if (_HERE / ".env").exists() else _ROOT / ".env"


class Settings(BaseSettings):
    secret_key: str
    database_url: str = "sqlite:///./data/crm_tarifas.db"
    first_superadmin_username: str = "admin"
    first_superadmin_password: str

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()
