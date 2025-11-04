import '../App.css'
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from '../config';

function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const [stats, setStats] = useState(null);
  const [genes, setGenes] = useState([]);
  const [samples, setSamples] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [chromosome, setChromosome] = useState("");
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [searchError, setSearchError] = useState("");

  const isAuthenticated = Boolean(user && token);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setGlobalError("");
    setSearchError("");
    navigate("/login");
  }, [navigate]);

  const fetchDashboard = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setStats(data);
      setGlobalError
    } catch (error) {
      console.error(error);
      setGlobalError(error.message);
    }
  }, [handleLogout, token]);

  const fetchSamples = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/samples`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (!response.ok) {
        throw new Error("Neuspješno učitavanje uzoraka.");
      }
      const data = await response.json();
      setSamples(data);
      setGlobalError("");
    } catch (err) {
      console.error(err);
      setGlobalError(err.message);
    }
  }, [handleLogout, token]);

  const fetchGenes = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setSearchError("");
    try {
      const params = new URLSearchParams({ limit: "25" });
      if (searchTerm) {
        params.set("search", searchTerm);
      }
      if (chromosome) {
        params.set("chromosome", chromosome);
      }
      const response = await fetch(`${API_BASE_URL}/genes?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Neuspješno učitavanje gena.");
      }
      const data = await response.json();
      setGenes(data);
    } catch (err) {
      console.error(err);
      setSearchError(err.message);
    } finally {
      setLoading(false);
    }
  }, [chromosome, handleLogout, searchTerm, token]);

  useEffect(() => {
    const synchronizeAuthState = () => {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
      setToken(localStorage.getItem("token"));
    };

    synchronizeAuthState();
    window.addEventListener("storage", synchronizeAuthState);
    return () => window.removeEventListener("storage", synchronizeAuthState);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
      fetchGenes();
      if (user?.role === "admin") {
        fetchSamples();
      }
    }
  }, [fetchDashboard, fetchGenes, fetchSamples, isAuthenticated, user?.role]);

  const handleLoginClick = () => navigate("/login");
  const handleRegisterClick = () => navigate("/register");

  if (!isAuthenticated) {
    return (
      <div className="page-container">
        <h1>Početna stranica</h1>
        <p className="page-subtitle">
          Za nastavak rada prijavite se ili registrirajte novi korisnički račun.
        </p>
        <div className="action-buttons">
          <button onClick={handleLoginClick}>Prijava</button>
          <button onClick={handleRegisterClick}>Registracija</button>
        </div>
      </div>
);
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Dobrodošli, {user.username}!</h1>
          <p className="page-subtitle">
            Trenutna uloga: <strong>{user.role}</strong>
          </p>
        </div>
        <button className="secondary" onClick={handleLogout}>
          Odjava
        </button>
      </header>

      {globalError && <div className="error-message">{globalError}</div>}

      {stats && (
        <section className="dashboard-section">
          <h2>Pregled baze</h2>
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <span className="dashboard-value">{stats.total_genes}</span>
              <span className="dashboard-label">Gena</span>
            </div>
            <div className="dashboard-card">
              <span className="dashboard-value">{stats.total_variants}</span>
              <span className="dashboard-label">Varijanti</span>
            </div>
            <div className="dashboard-card">
              <span className="dashboard-value">{stats.total_samples}</span>
              <span className="dashboard-label">Uzoraka</span>
            </div>
          </div>
        </section>
      )}

      <section className="search-section">
        <h2>Pretraživanje gena</h2>
        <div className="search-controls">
          <input
            type="text"
            placeholder="Naziv ili ID gena"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <input
            type="text"
            placeholder="Kromosom (npr. 1, 2, X)"
            value={chromosome}
            onChange={(event) => setChromosome(event.target.value)}
          />
          <button onClick={fetchGenes} disabled={loading}>
            {loading ? "Pretraživanje..." : "Pretraži"}
          </button>
        </div>
      </section>

      <section className="table-section">
        <h3>Rezultati ({genes.length})</h3>
        {searchError && !loading && <div className="error-message">{searchError}</div>}
        {loading ? (
          <p>Učitavanje podataka...</p>
        ) : genes.length === 0 ? (
          <p>Nema pronađenih gena za zadane kriterije.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Naziv gena</th>
                  <th>Kromosom</th>
                  <th>Početak</th>
                  <th>Kraj</th>
                  <th>Tip</th>
                </tr>
              </thead>
              <tbody>
                {genes.map((gene) => (
                  <tr key={gene.id}>
                    <td>{gene.gene_id ?? gene.id}</td>
                    <td>{gene.gene_name ?? "-"}</td>
                    <td>{gene.chromosome_name ?? "-"}</td>
                    <td>{gene.start_position}</td>
                    <td>{gene.end_position}</td>
                    <td>{gene.gene_type ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      
      {user.role === "admin" && samples.length > 0 && (
        <section className="table-section">
          <h3>Pregled uzoraka</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Naziv uzorka</th>
                  <th>Pasma</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((sample) => (
                  <tr key={sample.id}>
                    <td>{sample.id}</td>
                    <td>{sample.name}</td>
                    <td>{sample.breed ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
export default HomePage;