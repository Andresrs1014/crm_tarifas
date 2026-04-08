import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    nombre: Optional[str] = None   # nombre completo → crea comercial automáticamente


class UserRead(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    is_active: bool
    is_superadmin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str


class UserUpdate(BaseModel):
    is_active: Optional[bool] = None
    password: Optional[str] = None
    email: Optional[EmailStr] = None


class TokenData(BaseModel):
    username: Optional[str] = None
