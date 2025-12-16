import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE_URL } from '../config';

function GenePage() {
  const { geneId } = useParams();
  const [gene, setGene] = useState(null);
  const [variants, setVariants] = useState([]);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token"); // DOBAVLJA TOKEN

  useEffect(() => {
    const fetchGeneData = async () => {
      try {
        const resGene = await fetch(`${API_BASE_URL}/genes/${geneId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!resGene.ok) throw new Error("Greška pri dohvaćanju gena");
        const geneData = await resGene.json();
        setGene(geneData);

        const resVariants = await fetch(`${API_BASE_URL}/genes/${geneId}/variants`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!resVariants.ok) throw new Error("Greška pri dohvaćanju varijanti");
        const variantData = await resVariants.json();
        setVariants(variantData.items || []);


      } catch (err) {
        console.error(err);
        setError("Došlo je do pogreške prilikom učitavanja gena.");
      }
    };

    fetchGeneData();
  }, [geneId, token]);

  if (error) return <div className="error-message">{error}</div>;
  if (!gene) return <div>Učitavanje...</div>;

  return (
    <div className="page-container">
      <h1>{gene.gene_name}</h1>
      <p>ID: {gene.gene_id}</p>
      <p>Chromosome: {gene.chromosome_name}</p>
      <p>Start: {gene.start_position}, End: {gene.end_position}</p>
      <p>Type: {gene.gene_type}</p>

      <h2>Varijante</h2>
      {variants.length === 0 ? (
        <p>Nema varijanti za ovaj gen.</p>
      ) : (
        <ul>
          {variants.map(v => (
            <li key={v.id}>
              {v.chromosome_name}:{v.position} {v.reference_allele}→{v.alternate_allele} ({v.variant_type})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GenePage;
