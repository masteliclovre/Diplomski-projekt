from .database import SessionLocal, Chromosome, Gene

chromosomes_file = "data\genome.fa.fai"  # kromosomi
genes_file = "data\genes.gff3"  # geni

db = SessionLocal()

def parse_attributes(attr_string):
   attrs = {}
   for item in attr_string.strip().split(";"):
      if "=" in item:
         key, value = item.split("=", 1)
         attrs[key] = value
   return attrs

try:
   # Ubacivanje kromosoma
   with open(chromosomes_file, "r") as f:
      for line in f:
         if line.strip() == "":
            continue
         parts = line.strip().split("\t")
         name = parts[0]
         length = int(parts[1])
         chr_obj = Chromosome(name=name, length=length)
         db.add(chr_obj)
   db.commit()
   print("Kromosomi dodani")

   chromosomes = {c.name: c.id for c in db.query(Chromosome).all()}

   # Ubacivanje gena
   with open(genes_file, "r") as f:
      for line in f:
         if line.startswith("#") or line.strip() == "":
            continue
         parts = line.strip().split("\t")
         chrom_name = parts[0]
         feature_type = parts[2]
         start = int(parts[3])
         end = int(parts[4])
         strand = parts[6]
         attributes = parse_attributes(parts[8])

         if feature_type != "gene":
            continue  # zanemari sve osim gene

         gene_id = attributes.get("gene_id", attributes.get("ID", ""))
         gene_name = attributes.get("Name", gene_id)
         gene_type = attributes.get("biotype", "unknown")

         chr_id = chromosomes.get(chrom_name)
         if not chr_id:
            print(f"Kromosom {chrom_name} nije pronađen, preskačem gen {gene_id}")
            continue

         gene_obj = Gene(
               chromosome_id=chr_id,
               gene_id=gene_id,
               gene_name=gene_name,
               start_position=start,
               end_position=end,
               strand=strand,
               gene_type=gene_type
         )
         db.add(gene_obj)
   db.commit()
   print("Geni dodani")

except Exception as e:
   print(f"Greška: {e}")
   db.rollback()
finally:
   db.close()
