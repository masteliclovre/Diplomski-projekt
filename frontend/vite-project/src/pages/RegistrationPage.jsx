import '../App.css'
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

function RegistrationPage() {
    const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [role, setRole] = useState("korisnik");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== passwordRepeat) {
      setError("Lozinke se ne podudaraju.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Neuspjela registracija.");
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Registracija</h1>
      <p className="page-subtitle">
        Ispunite obrazac kako biste kreirali korisnički račun i pristupili sustavu.
      </p>

      <div className="card">
      <form className="form" onSubmit={handleSubmit}>
          <label>
            Korisničko ime
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Unesite korisničko ime"
              required
            />
          </label>

          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Unesite e-mail"
              required
            />
          </label>
        <label>
            Lozinka
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Unesite lozinku"
              required
            />
          </label>
          <label>
            Ponovi lozinku
            <input
              type="password"
              value={passwordRepeat}
              onChange={(event) => setPasswordRepeat(event.target.value)}
              placeholder="Ponovite lozinku"
              required
            />
            </label>

          <label>
            Uloga
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="korisnik">Korisnik</option>
              <option value="admin">Administrator</option>
            </select>
          </label>

          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? "Slanje..." : "Registriraj se"}
          </button>
        </form>
      </div>
    <p className="page-footer">
        Već imate račun? {" "}
        <button type="button" onClick={() => navigate("/login")}>
          Prijavite se
        </button>
      </p>
    </div>
  );
}

export default RegistrationPage;