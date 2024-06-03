from typing import Union
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from fastapi import APIRouter 
from datetime import datetime, timedelta
import logging

# Configuration du logger
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Paramètres de sécurité
SECRET_KEY = "UQAC"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Gestionnaire de hachage des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Données utilisateur fictives
users_db = {
    "admin": {
        "username": "admin",
        "hashed_password": pwd_context.hash("admin"),
        "disabled": False,
    }
}

# Modèle d'utilisateur
class UserInDB(BaseModel):
    username: str
    hashed_password: str
    disabled: bool = False

# Modèle de token
class Token(BaseModel):
    access_token: str
    token_type: str

# Fonction d'authentification
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Récupération de l'utilisateur courant
def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        logger.debug(f"Token reçu: {token}")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.debug(f"Payload décodé: {payload}")
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError as e:
        logger.error(f"Erreur JWT: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Erreur 2",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = get_user(username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Erreur 3",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

# Récupération d'un utilisateur
def get_user(username: str):
    if username in users_db:
        user_dict = users_db[username]
        return UserInDB(**user_dict)
    
# Vérification du mot de passe
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Créer un routeur pour les routes d'authentification
auth_router = APIRouter()

# Authentification et génération du token
@auth_router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username is incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    hashed_password = user.hashed_password
    if not verify_password(form_data.password, hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password is incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Génération du token d'accès
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": form_data.username}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"access_token": encoded_jwt, "token_type": "bearer"}