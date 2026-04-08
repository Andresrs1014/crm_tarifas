import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from app.auth.dependencies import get_current_active_user, require_superadmin
from app.auth.service import (
    authenticate_user,
    create_access_token,
    get_user_by_username,
    hash_password,
)
from app.database import get_session
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/token", response_model=Token, summary="Login — obtener JWT")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    user = authenticate_user(session, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo",
        )
    access_token = create_access_token(data={"sub": user.username})
    return Token(access_token=access_token, token_type="bearer")


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar usuario (solo superadmin)",
)
def register(
    user_in: UserCreate,
    session: Session = Depends(get_session),
    _: User = Depends(require_superadmin),
):
    if get_user_by_username(session, user_in.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya existe",
        )

    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
    )
    session.add(new_user)

    # Si se provee nombre completo, crear el comercial asociado automáticamente
    if user_in.nombre:
        from app.models.comercial import Comercial
        from sqlmodel import select as _select
        existe = session.exec(
            _select(Comercial).where(Comercial.email == user_in.email)
        ).first()
        if not existe:
            session.add(Comercial(
                nombre=user_in.nombre,
                email=user_in.email,
            ))

    session.commit()
    session.refresh(new_user)
    return new_user


@router.get("/me", response_model=UserRead, summary="Datos del usuario actual")
def me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.get("/users", response_model=list[UserRead], summary="Listar usuarios (superadmin)")
def list_users(
    session: Session = Depends(get_session),
    _: User = Depends(require_superadmin),
):
    users = session.exec(select(User).order_by(User.created_at)).all()
    return [UserRead.model_validate(u) for u in users]


@router.put("/users/{user_id}", response_model=UserRead, summary="Actualizar usuario (superadmin)")
def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_superadmin),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes modificar tu propio estado")
    update_data = data.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))
    for k, v in update_data.items():
        setattr(user, k, v)
    session.add(user)
    session.commit()
    session.refresh(user)
    return UserRead.model_validate(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar usuario (superadmin)")
def delete_user(
    user_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_superadmin),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta")
    session.delete(user)
    session.commit()
