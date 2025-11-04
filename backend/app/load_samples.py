from .database import SessionLocal, Sample

def load_samples():
   db = SessionLocal()
   
   for i in range(1, 25):
      sample_name = f"CATTLE{i}" 
      sample = Sample(sample_name=sample_name, breed="buša")
      db.add(sample)

   db.commit()
   db.close()
   print("Tablica samples popunjena.")

if __name__ == "__main__":
   load_samples()
