import '../App.css'
import { useState } from "react";

function RegistrationPage() {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
  
    const handleSubmit = (e) => {
      e.preventDefault();
      console.log("Username:", username);
      console.log("Email:", email);
      console.log("Password:", password);
      console.log("Password2:", password2);
      alert(`Submitted`);
      
    };

    return(<>
    <h1>Register</h1>
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
          <div style={{ marginTop: "7%" }}>
          <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              required
            />
            </div>
        

          <div style={{ marginTop: "7%" }}>
     
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>

          <div style={{ marginTop: "7%" }}>
     
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="Repeat password"
              required
            />
          </div>

          <button type="submit" style={{ marginTop: "30%" }}>
            Register
          </button>
          </form>
      </div>
    </>
    );

}

export default RegistrationPage;