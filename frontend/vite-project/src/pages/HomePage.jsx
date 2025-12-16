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


  
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleSearch = async() => {
    if(!searchTerm.trim()) {
      setSearchError("Unesite ID gena.");
      return;
    }
    const url = `${API_BASE_URL}/genes/${encodeURIComponent(searchTerm)}`;
  console.log("Fetching:", url);
    try{
          const res= await fetch(`${API_BASE_URL}/genes/${encodeURIComponent(searchTerm)}`, {
          headers: {
            "Authorization": `Bearer ${token}`,  // <- token ide ovdje
          },
          });
          if (!res.ok) throw new Error("Greška");
          const data = await res.json();
          console.log(data);
          if (data.length === 0) {
            setSearchError("Nije pronađen nijedan gen s tim imenom.");
          } else {
            // pretpostavimo da uzmemo prvi rezultat
             navigate(`/genes/${data.gene_id}`);
          }

  } catch (err) {
    console.error(err);
    setSearchError("Došlo je do pogreške prilikom pretraživanja.");
  }
  }

  

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
     
    }
  }, []);

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

     

      <section className="search-section">
       
        <div className="search-controls">
          <input
            type="text"
            placeholder="Unesite ID gena."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
         
          <button onClick={handleSearch}>Pretraživanje
          </button>
        </div>
        {searchError && <div className="error-message">{searchError}</div>}
      </section>

      
      
    </div>
  );
}

export default HomePage;
