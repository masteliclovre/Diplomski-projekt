import os
from sqlalchemy import Integer, cast
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from pydantic import BaseModel, Field
from typing import List, Optional
from app.database import get_db, User, Gene, Sample, Variant, get_db, SampleGenotype
from app.auth import hash_password, verify_password, create_access_token, decode_access_token
import logging
from sqlalchemy import func

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


app = FastAPI(title="Cattle Genomics API")
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
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

class SampleGenotypeResponse(BaseModel):
    sample_name: str
    genotype: Optional[str]
    
    class Config:
        from_attributes = True

class VariantResponse(BaseModel):
    id: int
    chromosome_name: Optional[str]
    position: int
    reference_allele: Optional[str]
    alternate_allele: Optional[str]
    variant_type: Optional[str]
    quality: Optional[float]
    filter_status: Optional[str]
    total_depth: Optional[int]
    sample_genotypes: List[SampleGenotypeResponse] = []

    class Config:
        from_attributes = True

class VariantListResponse(BaseModel):
    total: int
    items: List[VariantResponse]
    
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

@app.get("/genes/{gene_id}", response_model=GeneResponse)
def get_gene_by_id(
    gene_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Dohvati gen po gene_id (jedinstveni ID gena)
    """
    gene = db.query(Gene).filter(Gene.gene_id == gene_id).first()
    if not gene:
        raise HTTPException(status_code=404, detail="Gen nije pronađen")

    return GeneResponse(
        id=gene.id,
        gene_id=gene.gene_id,
        gene_name=gene.gene_name,
        chromosome_name=gene.chromosome.name if gene.chromosome else None,
        start_position=gene.start_position,
        end_position=gene.end_position,
        gene_type=gene.gene_type
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
        query = query.filter(or_((Gene.gene_name.contains(search)), Gene.gene_id.ilike(like_term)))
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

@app.get("/variants", response_model=VariantListResponse)
def get_variants(
    chromosome: Optional[str] = None,
    position: Optional[int] = None,
    start_position: Optional[int] = None,
    end_position: Optional[int] = None,
    variant_type: Optional[str] = None,
    filter_status: Optional[str] = None,
    min_quality: Optional[float] = None,
    sample_name: Optional[str] = None,
    reference: Optional[str] = None,
    alternate: Optional[str] = None,
    limit: int = 25,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    del current_user

    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    query = db.query(Variant).options(
        joinedload(Variant.chromosome),
        joinedload(Variant.sample_genotypes).joinedload(SampleGenotype.sample)
    )

    if chromosome:
        query = query.filter(Variant.chromosome.has(name=chromosome))
    if position:
        query = query.filter(Variant.position == position)
    else:
        if start_position:
            query = query.filter(Variant.position >= start_position)
        if end_position:
            query = query.filter(Variant.position <= end_position)
    if variant_type:
        query = query.filter(Variant.variant_type.ilike(f"%{variant_type}%"))
    if filter_status:
        if filter_status == "PASS":
            query = query.filter(Variant.filter_status == "PASS")
        else:
            query = query.filter(Variant.filter_status.ilike(f"%{filter_status}%"))
    if min_quality:
        query = query.filter(Variant.quality >= min_quality)
    if sample_name:
        query = query.filter(Variant.sample_genotypes.any(SampleGenotype.sample.has(sample_name=sample_name)))
    if reference:
        query = query.filter(Variant.reference_allele.ilike(f"%{reference}%"))
    if alternate:
        query = query.filter(Variant.alternate_allele.ilike(f"%{alternate}%"))

    total = query.count()
    variants = (
        query
        .order_by(Variant.chromosome_id, Variant.position)
        .offset(offset)
        .limit(limit)
        .all()
    )

    items: List[VariantResponse] = []
    for variant in variants:
        sample_data = [
                SampleGenotypeResponse(
                    sample_name=sg.sample.sample_name if sg.sample else None,
                    genotype=sg.genotype
                )
                for sg in sorted(
                    variant.sample_genotypes,
                    key=lambda sg: sg.sample.sample_name if sg.sample else ""
                )
            ]


        items.append(
            VariantResponse(
                id=variant.id,
                chromosome_name=variant.chromosome.name if variant.chromosome else None,
                position=variant.position,
                reference_allele=variant.reference_allele,
                alternate_allele=variant.alternate_allele,
                variant_type=variant.variant_type,
                quality=variant.quality,
                filter_status=variant.filter_status,
                total_depth=variant.total_depth,
                sample_genotypes=sample_data
            )
        )
    return VariantListResponse(total=total, items=items)

@app.get("/genes/{gene_id}/variants", response_model=VariantListResponse)
def get_variants_by_gene(
    gene_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    gene = db.query(Gene).filter(Gene.gene_id == gene_id).first()
    if not gene:
        raise HTTPException(status_code=404, detail="Gen nije pronađen")

    gene_start = int(gene.start_position)
    gene_end = int(gene.end_position)
    gene_chr_id = gene.chromosome_id
    print(f"DEBUG: Gene {gene.gene_id} - start: {gene_start}, end: {gene_end}, chromosome: {gene.chromosome.name}")

    #dohvati sve varijante
    variants = db.query(Variant).options(
        joinedload(Variant.chromosome),
        joinedload(Variant.sample_genotypes).joinedload(SampleGenotype.sample)
    ).all()

    print(f"DEBUG: Total variants in database: {len(variants)}")

    #filtriraj varijante unutar gena i na istom kromosomu
    filtered_variants = []
    for v in variants:
        v_pos = int(v.position)
        v_chr_id = v.chromosome_id
        in_interval = (v_chr_id == gene_chr_id) and (gene_start <= v_pos <= gene_end)
        print(f"DEBUG: Variant {v.id} at position {v_pos}, chromosome: {v.chromosome.name if v.chromosome else 'None'} - in gene interval? {in_interval}")
        if in_interval:
            filtered_variants.append(v)

    total = len(filtered_variants)

    items: List[VariantResponse] = []
    for variant in filtered_variants:
        sample_data = [
            SampleGenotypeResponse(
                sample_name=sg.sample.sample_name if sg.sample else None,
                genotype=sg.genotype
            )
            for sg in sorted(
                variant.sample_genotypes,
                key=lambda sg: sg.sample.sample_name if sg.sample else ""
            )
        ]

        items.append(
            VariantResponse(
                id=variant.id,
                chromosome_name=variant.chromosome.name if variant.chromosome else None,
                position=int(variant.position),
                reference_allele=variant.reference_allele,
                alternate_allele=variant.alternate_allele,
                variant_type=variant.variant_type,
                quality=variant.quality,
                filter_status=variant.filter_status,
                total_depth=variant.total_depth,
                sample_genotypes=sample_data
            )
        )

    print(f"DEBUG: Total variants in gene interval on same chromosome: {total}")
    return VariantListResponse(total=total, items=items)
