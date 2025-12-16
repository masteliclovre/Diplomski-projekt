from sqlalchemy import create_engine, Column, Integer, String, BigInteger, ForeignKey, Float, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings 

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Modeli
class Chromosome(Base):
    __tablename__ = "chromosomes"
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True)
    length = Column(BigInteger)
    genes = relationship("Gene", back_populates="chromosome")
    variants = relationship("Variant", back_populates="chromosome")

class Gene(Base):
    __tablename__ = "genes"
    id = Column(Integer, primary_key=True)
    chromosome_id = Column(Integer, ForeignKey("chromosomes.id"))
    gene_id = Column(String(100), unique=True)
    gene_name = Column(String(255))
    start_position = Column(BigInteger)
    end_position = Column(BigInteger)
    strand = Column(String(1))
    gene_type = Column(String(50))
    chromosome = relationship("Chromosome", back_populates="genes")

class Sample(Base):
    __tablename__ = "samples"
    id = Column(Integer, primary_key=True)
    sample_name = Column(String(100), unique=True)
    breed = Column(String(100))
    genotypes = relationship("SampleGenotype", back_populates="sample", cascade="all, delete-orphan")

class Variant(Base):
    __tablename__ = "variants"
    id = Column(Integer, primary_key=True)
    chromosome_id = Column(Integer, ForeignKey("chromosomes.id"))
    position = Column(BigInteger)
    reference_allele = Column(String(1000))
    alternate_allele = Column(String(1000))
    variant_type = Column(String(20))
    quality = Column(Float)
    filter_status = Column(String(50))
    total_depth = Column(Integer)
    additional_info = Column(Text)
    chromosome = relationship("Chromosome", back_populates="variants")
    sample_genotypes = relationship("SampleGenotype", back_populates="variant", cascade="all, delete-orphan")


class SampleGenotype(Base):
    __tablename__ = "sample_genotypes"
    id = Column(Integer, primary_key=True)
    sample_id = Column(Integer, ForeignKey("samples.id"))
    variant_id = Column(Integer, ForeignKey("variants.id"))
    genotype = Column(String(10))
    sample = relationship("Sample", back_populates="genotypes")
    variant = relationship("Variant", back_populates="sample_genotypes")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True)
    email = Column(String(255), unique=True)
    password_hash = Column(String(255))
    role = Column(String(20))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()