import '../App.css'
import { useState } from "react";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Username:", username);
    console.log("Password:", password);
    alert(`Submitted`);
    
  };

    return(<>
    <h2>Login</h2>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div>
            
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </div>

          <div style={{ marginTop: "20%" }}>
     
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>

          <button type="submit" style={{ marginTop: "30%" }}>
            Login
          </button>
          </form>
      </div>
    </>
    );

}

export default Login