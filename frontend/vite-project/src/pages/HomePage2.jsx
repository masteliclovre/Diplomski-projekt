import '../App.css'
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from '../config';

const DEFAULT_VARIANT_LIMIT = 25;

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
  const [variants, setVariants] = useState([]);
  const [variantTotal, setVariantTotal] = useState(0);
  const [variantPage, setVariantPage] = useState(1);
  const [variantLimit, setVariantLimit] = useState(DEFAULT_VARIANT_LIMIT);
  const [variantChromosome, setVariantChromosome] = useState("");
  const [variantPosition, setVariantPosition] = useState("");
  const [variantStart, setVariantStart] = useState("");
  const [variantEnd, setVariantEnd] = useState("");
  const [variantType, setVariantType] = useState("");
  const [variantFilter, setVariantFilter] = useState("");
  const [variantMinQuality, setVariantMinQuality] = useState("");
  const [variantSample, setVariantSample] = useState("");
  const [variantReference, setVariantReference] = useState("");
  const [variantAlternate, setVariantAlternate] = useState("");
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantError, setVariantError] = useState("");

  const totalVariantPages = variantTotal === 0 ? 0 : Math.ceil(variantTotal / variantLimit);

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
        const data = await response.json();
        throw new Error(data.detail || "Neuspješno učitavanje statistike.");
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error(err);
      setGlobalError(err.message);
    }
  }, [handleLogout, token]);

  const fetchGenes = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setSearchError("");
    try {
      const params = new URLSearchParams();
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

  const fetchSamples = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/samples`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Neuspješno učitavanje uzoraka.");
      }
      const data = await response.json();
      setSamples(data);
    } catch (err) {
      console.error(err);
    }
  }, [handleLogout, token]);

  const fetchVariants = useCallback(
    async ({
      page = 1,
      limit = variantLimit,
      chromosome: chromosomeFilter,
      position,
      start,
      end,
      type,
      filterStatus,
      minQuality,
      sampleName,
      referenceAllele,
      alternateAllele,
    } = {}) => {
      if (!token) {
        return;
      }

      setVariantLoading(true);
      setVariantError("");

      try {
        const params = new URLSearchParams();
        const safeLimit = Math.max(1, limit);
        const safePage = Math.max(1, page);
        params.set("limit", String(safeLimit));
        params.set("offset", String((safePage - 1) * safeLimit));

        if (chromosomeFilter) {
          params.set("chromosome", chromosomeFilter);
        }
        if (typeof position === "number" && !Number.isNaN(position)) {
          params.set("position", String(position));
        } else {
          if (typeof start === "number" && !Number.isNaN(start)) {
            params.set("start_position", String(start));
          }
          if (typeof end === "number" && !Number.isNaN(end)) {
            params.set("end_position", String(end));
          }
        }
        if (type) {
          params.set("variant_type", type);
        }
        if (filterStatus) {
          params.set("filter_status", filterStatus);
        }
        if (typeof minQuality === "number" && !Number.isNaN(minQuality)) {
          params.set("min_quality", String(minQuality));
        }
        if (sampleName) {
          params.set("sample_name", sampleName);
        }
        if (referenceAllele) {
          params.set("reference", referenceAllele);
        }
        if (alternateAllele) {
          params.set("alternate", alternateAllele);
        }

        const response = await fetch(`${API_BASE_URL}/variants?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          handleLogout();
          return;
        }
        if (!response.ok) {
          let message = "Neuspješno učitavanje varijanti.";
          try {
            const data = await response.json();
            if (data?.detail) {
              message = data.detail;
            }
          } catch (error) {
            console.error(error);
          }
          throw new Error(message);
        }
        const data = await response.json();
        setVariants(data.items);
        setVariantTotal(data.total);
        setVariantPage(safePage);
      } catch (error) {
        console.error(error);
        setVariantError(error.message);
      } finally {
        setVariantLoading(false);
      }
    },
    [handleLogout, token, variantLimit]
  );

  const handleVariantSearch = useCallback(
    async (page = 1, customLimit) => {
      const parseOptionalInteger = (value) => {
        if (value === undefined || value === null) {
          return undefined;
        }
        const trimmed = value.toString().trim();
        if (trimmed === "") {
          return undefined;
        }
        const parsed = Number.parseInt(trimmed, 10);
        return Number.isNaN(parsed) ? null : parsed;
      };

      const parseOptionalFloat = (value) => {
        if (value === undefined || value === null) {
          return undefined;
        }
        const trimmed = value.toString().trim();
        if (trimmed === "") {
          return undefined;
        }
        const parsed = Number.parseFloat(trimmed);
        return Number.isNaN(parsed) ? null : parsed;
      };

      setVariantError("");

      const positionValue = parseOptionalInteger(variantPosition);
      if (positionValue === null) {
        setVariantError("Neispravna vrijednost za poziciju varijante.");
        return;
      }

      const startValue = parseOptionalInteger(variantStart);
      if (startValue === null) {
        setVariantError("Neispravna početna pozicija.");
        return;
      }

      const endValue = parseOptionalInteger(variantEnd);
      if (endValue === null) {
        setVariantError("Neispravna završna pozicija.");
        return;
      }

      const minQualityValue = parseOptionalFloat(variantMinQuality);
      if (minQualityValue === null) {
        setVariantError("Neispravan minimalni prag kvalitete.");
        return;
      }

      if (
        positionValue === undefined &&
        startValue !== undefined &&
        endValue !== undefined &&
        startValue > endValue
      ) {
        setVariantError("Početna pozicija mora biti manja ili jednaka završnoj poziciji.");
        return;
      }

      const effectiveLimit = customLimit ?? variantLimit;

      await fetchVariants({
        page,
        limit: effectiveLimit,
        chromosome: variantChromosome.trim() || undefined,
        position: positionValue,
        start: positionValue === undefined ? startValue : undefined,
        end: positionValue === undefined ? endValue : undefined,
        type: variantType.trim() || undefined,
        filterStatus: variantFilter.trim() || undefined,
        minQuality: minQualityValue,
        sampleName: variantSample || undefined,
        referenceAllele: variantReference.trim() || undefined,
        alternateAllele: variantAlternate.trim() || undefined,
      });
    },
    [
      fetchVariants,
      variantAlternate,
      variantChromosome,
      variantEnd,
      variantFilter,
      variantLimit,
      variantMinQuality,
      variantPosition,
      variantReference,
      variantSample,
      variantStart,
      variantType,
    ]
  );

  const handleVariantReset = useCallback(() => {
    setVariantChromosome("");
    setVariantPosition("");
    setVariantStart("");
    setVariantEnd("");
    setVariantType("");
    setVariantFilter("");
    setVariantMinQuality("");
    setVariantSample("");
    setVariantReference("");
    setVariantAlternate("");
    setVariantError("");
    setVariantPage(1);
    setVariantLimit(DEFAULT_VARIANT_LIMIT);
    void fetchVariants({ page: 1, limit: DEFAULT_VARIANT_LIMIT });
  }, [fetchVariants]);

  const handleVariantLimitChange = useCallback(
    (event) => {
      const newValue = Number(event.target.value);
      const safeValue = Number.isNaN(newValue) ? DEFAULT_VARIANT_LIMIT : newValue;
      setVariantLimit(safeValue);
      void handleVariantSearch(1, safeValue);
    },
    [handleVariantSearch]
  );

  const handleVariantPageChange = useCallback(
    (direction) => {
      if (totalVariantPages === 0) {
        return;
      }
      const nextPage = variantPage + direction;
      if (nextPage < 1 || nextPage > totalVariantPages) {
        return;
      }
      void handleVariantSearch(nextPage);
    },
    [handleVariantSearch, totalVariantPages, variantPage]
  );

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
      fetchSamples();
      void fetchVariants({ page: 1, limit: DEFAULT_VARIANT_LIMIT });
    }
  }, [fetchDashboard, fetchGenes, fetchSamples, fetchVariants, isAuthenticated]);

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
            U nastavku možete pregledati gene, uzorke i varijante.
          </p>
        </div>
        <button onClick={handleLogout}>Odjava</button>
      </header>

      {globalError && <div className="error-message">{globalError}</div>}

      {stats && (
        <section className="stats-section">
          <h2>Statistika</h2>
          <ul>
            <li>Broj gena: {stats.genes}</li>
            <li>Broj uzoraka: {stats.samples}</li>
            <li>Broj varijanti: {stats.variants}</li>
          </ul>
        </section>
      )}

      <section className="search-section">
        <h2>Pretraga gena</h2>
        <div className="search-controls">
          <input
            type="text"
            placeholder="Naziv gena"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <input
            type="text"
            placeholder="Kromosom"
            value={chromosome}
            onChange={(e) => setChromosome(e.target.value)}
          />
          <button onClick={fetchGenes} disabled={loading}>
            {loading ? "Pretraživanje..." : "Pretraži"}
          </button>
        </div>
        {searchError && <div className="error-message">{searchError}</div>}
      </section>

      <section className="table-section">
        <h3>Popis gena</h3>
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
      </section>

      {/* VARIJANTE */}
      <section className="search-section">
        <h2>Pretraživanje varijanti</h2>
        <div className="search-controls">
          <input
            type="text"
            placeholder="Kromosom (npr. 1, 2, X)"
            value={variantChromosome}
            onChange={(e) => setVariantChromosome(e.target.value)}
          />
          <input
            type="number"
            placeholder="Točna pozicija"
            value={variantPosition}
            onChange={(e) => setVariantPosition(e.target.value)}
          />
          <input
            type="number"
            placeholder="Početna pozicija"
            value={variantStart}
            onChange={(e) => setVariantStart(e.target.value)}
          />
          <input
            type="number"
            placeholder="Završna pozicija"
            value={variantEnd}
            onChange={(e) => setVariantEnd(e.target.value)}
          />
        </div>
        <div className="search-controls">
          <input
            type="text"
            placeholder="Tip varijante (npr. SNP)"
            value={variantType}
            onChange={(e) => setVariantType(e.target.value)}
          />
          <input
            type="text"
            placeholder="FILTER status (npr. PASS)"
            value={variantFilter}
            onChange={(e) => setVariantFilter(e.target.value)}
          />
          <input
            type="number"
            placeholder="Minimalna kvaliteta"
            value={variantMinQuality}
            onChange={(e) => setVariantMinQuality(e.target.value)}
          />
          <input
            type="text"
            placeholder="Referentni alel"
            value={variantReference}
            onChange={(e) => setVariantReference(e.target.value)}
          />
          <input
            type="text"
            placeholder="Alternativni alel"
            value={variantAlternate}
            onChange={(e) => setVariantAlternate(e.target.value)}
          />
        </div>
        <div className="search-controls">
          <select
            value={variantSample}
            onChange={(e) => setVariantSample(e.target.value)}
          >
            <option value="">Svi uzorci</option>
            {samples.map((sample) => (
              <option key={sample.id} value={sample.name}>
                {sample.name}
              </option>
            ))}
          </select>
          <select value={variantLimit} onChange={handleVariantLimitChange}>
            <option value={10}>10 / str.</option>
            <option value={25}>25 / str.</option>
            <option value={50}>50 / str.</option>
            <option value={100}>100 / str.</option>
          </select>
          <button onClick={() => void handleVariantSearch(1)} disabled={variantLoading}>
            {variantLoading ? "Pretraživanje..." : "Pretraži"}
          </button>
          <button
            className="secondary"
            onClick={handleVariantReset}
            disabled={variantLoading}
          >
            Očisti filtere
          </button>
        </div>
      </section>

      <section className="table-section">
        <h3>
          Varijante ({variants.length}
          {variantTotal > 0 ? ` / ${variantTotal}` : ""})
        </h3>
        {variantError && !variantLoading && (
          <div className="error-message">{variantError}</div>
        )}
        {variantLoading ? (
          <p>Učitavanje varijanti...</p>
        ) : variants.length === 0 ? (
          <p>Nema pronađenih varijanti za zadane kriterije.</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kromosom</th>
                    <th>Pozicija</th>
                    <th>REF</th>
                    <th>ALT</th>
                    <th>Tip</th>
                    <th>Kvaliteta</th>
                    <th>Filter</th>
                    <th>Dubina (DP)</th>
                    <th>Genotip po uzorcima</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant) => (
                    <tr key={variant.id}>
                      <td>{variant.chromosome_name ?? "-"}</td>
                      <td>{variant.position}</td>
                      <td>{variant.reference_allele ?? "-"}</td>
                      <td>{variant.alternate_allele ?? "-"}</td>
                      <td>{variant.variant_type ?? "-"}</td>
                      <td>
                        {variant.quality !== null && variant.quality !== undefined
                          ? Number(variant.quality).toFixed(2)
                          : "-"}
                      </td>
                      <td>{variant.filter_status ?? "-"}</td>
                      <td>{variant.total_depth ?? "-"}</td>
                      <td>
                        {variant.sample_genotypes.length > 0
                          ? variant.sample_genotypes
                              .map(
                                (entry) =>
                                  `${entry.sample_name}: ${entry.genotype ?? "-"}`
                              )
                              .join(", ")
                          : "Nema podataka"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination-controls">
              <button
                className="secondary"
                onClick={() => handleVariantPageChange(-1)}
                disabled={variantPage === 1 || variantLoading}
              >
                Prethodna
              </button>
              <span>
                {variantTotal === 0
                  ? "Nema rezultata"
                  : `Stranica ${variantPage} od ${totalVariantPages}`}
              </span>
              <button
                className="secondary"
                onClick={() => handleVariantPageChange(1)}
                disabled={
                  variantTotal === 0 ||
                  variantPage >= totalVariantPages ||
                  variantLoading
                }
              >
                Sljedeća
              </button>
            </div>
          </>
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
