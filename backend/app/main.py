from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db, User, Gene, Sample, Variant
from app.auth import hash_password, verify_password, create_access_token

app = FastAPI(title="Cattle Genomics API")
security = HTTPBearer()

# Pydantic modeli za request/response
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class GeneResponse(BaseModel):
    id: int
    gene_name: Optional[str]
    start_position: int
    end_position: int
    
    class Config:
        from_attributes = True

# Rute
@app.get("/")
def root():
    return {"message": "Cattle Genomics API"}

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Provjeri postoji li korisnik
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Kreiraj novog korisnika
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hash_password(user.password),
        role="viewer"
    )
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully"}

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": db_user.username, "role": db_user.role})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/genes", response_model=List[GeneResponse])
def get_genes(
    chromosome: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Gene)
    if chromosome:
        query = query.join(Gene.chromosome).filter(Gene.chromosome.has(name=chromosome))
    genes = query.limit(limit).all()
    return genes

@app.get("/samples")
def get_samples(db: Session = Depends(get_db)):
    samples = db.query(Sample).all()
    return [{"id": s.id, "name": s.sample_name, "breed": s.breed} for s in samples]

@app.get("/variants")
def get_variants(
    chromosome: Optional[str] = None,
    position: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Variant)
    if chromosome:
        query = query.join(Variant.chromosome).filter(Variant.chromosome.has(name=chromosome))
    if position:
        query = query.filter(Variant.position == position)
    variants = query.limit(limit).all()
    return variants