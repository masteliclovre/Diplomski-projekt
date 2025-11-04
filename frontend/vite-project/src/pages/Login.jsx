import '../App.css'
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Neuspjela prijava.");
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
      <h1>Prijava</h1>
      <p className="page-subtitle">Unesite svoje podatke za pristup sustavu.</p>

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
              Lozinka
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              placeholder="Unesite lozinku"
              required
            />
          </label>

          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? "Prijavljivanje..." : "Prijavi se"}
          </button>
        </form>
      </div>
      <p className="page-footer">
        Nemate račun? {" "}
        <button type="button" onClick={() => navigate("/register")}>
          Registrirajte se
        </button>
      </p>
    </div>
  );
}
export default Login;