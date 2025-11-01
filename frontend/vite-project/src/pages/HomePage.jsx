import '../App.css'
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  const handleClick1 = () => navigate("/login");
  const handleClick2 = () => navigate("/register");

    return(<>
    <h1>Početna stranica</h1>
      <div className="card">
        <button onClick={handleClick1}>
          Login
        </button>
        <button onClick={handleClick2}>
          Register
        </button>
      </div>
    </>
    );

}

export default HomePage;