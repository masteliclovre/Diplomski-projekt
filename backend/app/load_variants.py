from .database import SessionLocal, Variant, SampleGenotype, Sample, Chromosome
import vcfpy
import os
import json

def _as_serializable_info(info_dict):
   serializable = {}
   for key, value in info_dict.items():
      if isinstance(value, dict):
         serializable[key] = [str(item) for item in value]
      elif value is None:
         serializable[key] = None
      else:
         serializable[key] = value if isinstance(value, (int, float, str)) else str(value)
   return serializable

def _first_numeric(value):
   if isinstance(value, list):
      value = value[0] if value else None
      if isinstance(value, (int, float)):
         return value
      try:
         return int(value)
      except ValueError:
         try:
            return float(value)
         except ValueError:
            return None
   return None

VCF_DIR = "data/filtered_vcf"  # direktorij s VCF datotekama

def load_vcf_file(vcf_file: str, sample_name: str):
   db = SessionLocal()

   try:
      sample = db.query(Sample).filter_by(sample_name=sample_name).first()
      if not sample:
         print(f"Uzorak {sample_name} nije u bazi")
         return
      vcf_reader = vcfpy.Reader.from_path(vcf_file)

      for record in vcf_reader:
         chrom = db.query(Chromosome).filter_by(name=record.CHROM).first()
         if not chrom:
            continue

         variant_type = record.INFO.get("TYPE")
         if isinstance(variant_type, list):
            variant_type = ",".join(variant_type)

         filters = record.FILTER or []
         filter_status = ",".join([str(f) for f in filters]) if filters else "PASS"

         info_payload = _as_serializable_info(record.INFO)

         variant = Variant(
            chromosome_id=chrom.id,
            position=record.POS,
            reference_allele=record.REF,
            alternate_allele=",".join([str(a) for a in record.ALT]),
            variant_type=variant_type,
            quality=_first_numeric(record.QUAL),
            filter_status=filter_status,
            total_depth=_first_numeric(info_payload.get("DP")),
            additional_info=json.dumps(info_payload, ensure_ascii=False)
         )
         db.add(variant)
         db.flush()

         call_obj = next((c for c in record.calls if c.sample == sample_name), None)
         genotype_str = call_obj.data.get("GT") if call_obj is not None else None

         sample_genotype = SampleGenotype(
            sample_id=sample.id,
            variant_id=variant.id,
            genotype=genotype_str
         )
         db.add(sample_genotype)

      db.commit()
   finally:
      db.close()
      

def load_all_vcfs():
   for filename in os.listdir(VCF_DIR):
      if filename.endswith(".final_fb_filtered.vcf"):
         sample_name = filename.split(".")[0]  # iz imena datoteke izvlači CATTLE1, CATTLE2 itd.
         vcf_file = os.path.join(VCF_DIR, filename)
         load_vcf_file(vcf_file, sample_name)

if __name__ == "__main__":
   load_all_vcfs()
