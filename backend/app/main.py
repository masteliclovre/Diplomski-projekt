from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel, Field
from typing import List, Optional
from app.database import get_db, User, Gene, Sample, Variant, get_db
from app.auth import hash_password, verify_password, create_access_token, decode_access_token

app = FastAPI(title="Cattle Genomics API")
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Pydantic modeli za request/response
class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str
    password: str = Field(min_length=8)
    role: Optional[str] = Field(default="user", description="allowed values: user or admin")

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id:int
    username: str
    email: str
    role: str
    
    class Config:
        from_attributes = True

class GeneResponse(BaseModel):
    id: int
    gene_id: Optional[str]
    gene_name: Optional[str]
    chromosome_name: Optional[str]
    start_position: int
    end_position: int
    gene_type: Optional[str]
    
    class Config:
        from_attributes = True

class SampleResponse(BaseModel):
    id: int
    name: str
    breed: Optional[str]

class VariantResponse(BaseModel):
    id: int
    chromosome_name: Optional[str]
    position: int
    reference_allele: Optional[str]
    alternate_allele: Optional[str]
    variant_type: Optional[str]
    
class DashboardStats(BaseModel):
    total_genes: int
    total_samples: int
    total_variants: int

ALLOWED_ROLES = {"user", "admin"}

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) ->User:
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user

# Rute
@app.get("/")
def root():
    return {"message": "Cattle Genomics API"}

@app.post("/register", response_model=dict)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if user.role and user.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")

    # Provjeri postoji li korisnik
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Kreiraj novog korisnika
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role or "user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.username, "role": new_user.role})
    user_payload = UserResponse.model_validate(new_user).model_dump()

    return {
        "message": "User created successfully",
        "access_token": token,
        "token_type": "bearer",
        "user": user_payload
    }

@app.post("/login", response_model=dict)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    token = create_access_token({"sub": db_user.username, "role": db_user.role})
    user_payload = UserResponse.model_validate(db_user).model_dump()
    return {"access_token": token, "token_type": "bearer", "user": user_payload}

@app.get("/user/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return DashboardStats(
        total_genes = db.query(Gene).count(),
        total_samples = db.query(Sample).count(),
        total_variants = db.query(Variant).count()
    )

@app.get("/genes", response_model=List[GeneResponse])
def get_genes(
    chromosome: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    del current_user
    query = db.query(Gene)
    if chromosome:
        query = query.join(Gene.chromosome).filter(Gene.chromosome.has(name=chromosome))

    if search:
        like_term = f"%{search}%"
        query = query.filter(or_(Gene.gene_name.contains(search)), Gene.gene_id.ilike(like_term))
    genes = query.order_by(Gene.gene_name).limit(limit).all()
    return [
        {
            "id": g.id,
            "chromosome_name": g.chromosome.name if g.chromosome else None,
            "gene_id": g.gene_id,
            "gene_name": g.gene_name,
            "start_position": g.start_position,
            "end_position": g.end_position,
            "gene_type": g.gene_type
        } for g in genes
    ]

@app.get("/samples", response_model=List[SampleResponse])
def get_samples(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):  
    del current_user
    samples = db.query(Sample).order_by(Sample.sample_name).all()
    return [
        {
            "id": s.id, 
            "name": s.sample_name, 
            "breed": s.breed
        } for s in samples
    ]

@app.get("/variants", response_model=List[VariantResponse])
def get_variants(
    chromosome: Optional[str] = None,
    position: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    del current_user
    query = db.query(Variant)
    if chromosome:
        query = query.join(Variant.chromosome).filter(Variant.chromosome.has(name=chromosome))
    if position:
        query = query.filter(Variant.position == position)
    variants = query.order_by(Variant.position).limit(limit).all()
    return [
        {
            "id": v.id,
            "chromosome_name": v.chromosome.name if v.chromosome else None,
            "position": v.position,
            "reference_allele": v.reference_allele,
            "alternate_allele": v.alternate_allele,
            "variant_type": v.variant_type
        } for v in variants
    ]