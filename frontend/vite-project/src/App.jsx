import HomePage from "./pages/HomePage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RegistrationPage from "./pages/RegistrationPage";
import Login from "./pages/Login";
import GenePage from "./pages/GenePage";

function App() {
  return(<BrowserRouter>
  <Routes>
    <Route path="/" element={<HomePage />}/>
  <Route path="/register" element={<RegistrationPage />}/>
    <Route path="/login" element={<Login />}/>
    <Route path="/genes/:geneId" element={<GenePage />} />
  </Routes>
  

  </BrowserRouter>);
}

export default App;
