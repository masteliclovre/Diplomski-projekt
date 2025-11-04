from .database import SessionLocal, Variant, SampleGenotype, Sample, Chromosome
import vcfpy
import os

VCF_DIR = "data/filtered_vcf"  # direktorij s VCF datotekama

def load_vcf_file(vcf_file: str, sample_name: str):
   db = SessionLocal()

   # dohvat sample ID
   sample = db.query(Sample).filter_by(sample_name=sample_name).first()
   if not sample:
      print(f"Uzorak {sample_name} nije u bazi")
      db.close()
      return

   vcf_reader = vcfpy.Reader.from_path(vcf_file)
   
   for record in vcf_reader:
      chrom = db.query(Chromosome).filter_by(name=record.CHROM).first()
      if not chrom:
         continue

      variant_type = record.INFO.get("TYPE")
      if isinstance(variant_type, list):
         variant_type = ",".join(variant_type)
      
      variant = Variant(
         chromosome_id=chrom.id,
         position=record.POS,
         reference_allele=record.REF,
         alternate_allele=",".join([str(a) for a in record.ALT]),
         variant_type=variant_type
      )
      db.add(variant)
      db.commit()
      db.refresh(variant)

      # dohvat genotipa
      call_obj = next((c for c in record.calls if c.sample == sample_name), None)
      if call_obj is None:
         genotype_str = None
      else:
         genotype_str = call_obj.data.get("GT")
      
      sample_genotype = SampleGenotype(
         sample_id=sample.id,
         variant_id=variant.id,
         genotype=genotype_str
      )
      db.add(sample_genotype)
   
   db.commit()
   db.close()

def load_all_vcfs():
   for filename in os.listdir(VCF_DIR):
      if filename.endswith(".final_fb_filtered.vcf"):
         sample_name = filename.split(".")[0]  # iz imena datoteke izvlači CATTLE1, CATTLE2 itd.
         vcf_file = os.path.join(VCF_DIR, filename)
         load_vcf_file(vcf_file, sample_name)

if __name__ == "__main__":
   load_all_vcfs()
