from app.database import SessionLocal, Chromosome, Gene, Sample, Variant

def add_test_data():
    db = SessionLocal()
    
    try:
        # Dodaj kromosome
        chr1 = Chromosome(name="Chr1", length=158337067)
        chr2 = Chromosome(name="Chr2", length=136231102)
        db.add(chr1)
        db.add(chr2)
        db.commit()
        db.refresh(chr1)
        db.refresh(chr2)
        
        print("✅ Chromosomi dodani")
        
        # Dodaj gene
        genes = [
            Gene(
                chromosome_id=chr1.id,
                gene_id="ENSBTAG00000000001",
                gene_name="BRCA1",
                start_position=1000,
                end_position=5000,
                strand="+",
                gene_type="protein_coding"
            ),
            Gene(
                chromosome_id=chr1.id,
                gene_id="ENSBTAG00000000002",
                gene_name="TP53",
                start_position=10000,
                end_position=15000,
                strand="-",
                gene_type="protein_coding"
            ),
            Gene(
                chromosome_id=chr2.id,
                gene_id="ENSBTAG00000000003",
                gene_name="APOE",
                start_position=5000,
                end_position=8000,
                strand="+",
                gene_type="protein_coding"
            ),
        ]
        
        for gene in genes:
            db.add(gene)
        db.commit()
        
        print("✅ Geni dodani")
        
        # Dodaj uzorke goveda
        samples = [
            Sample(sample_name="Holstein_001", breed="Holstein"),
            Sample(sample_name="Holstein_002", breed="Holstein"),
            Sample(sample_name="Angus_001", breed="Angus"),
            Sample(sample_name="Simmental_001", breed="Simmental"),
        ]
        
        for sample in samples:
            db.add(sample)
        db.commit()
        
        print("✅ Uzorci dodani")
        
        # Dodaj varijante
        variants = [
            Variant(
                chromosome_id=chr1.id,
                position=1500,
                reference_allele="A",
                alternate_allele="G",
                variant_type="SNP"
            ),
            Variant(
                chromosome_id=chr1.id,
                position=12000,
                reference_allele="C",
                alternate_allele="T",
                variant_type="SNP"
            ),
            Variant(
                chromosome_id=chr2.id,
                position=6000,
                reference_allele="G",
                alternate_allele="C",
                variant_type="SNP"
            ),
        ]
        
        for variant in variants:
            db.add(variant)
        db.commit()
        
        print("✅ Varijante dodane")
        print("\n🎉 Svi testni podaci uspješno dodani!")
        
    except Exception as e:
        print(f"❌ Greška: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_test_data()