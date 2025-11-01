import HomePage from "./pages/HomePage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RegistrationPage from "./pages/RegistrationPage";
import Login from "./pages/Login";





function App() {
  return(<BrowserRouter>
  <Routes>
    <Route path="/" element={<HomePage />}/>
  <Route path="/register" element={<RegistrationPage />}/>
    <Route path="/login" element={<Login />}/>
  </Routes>

  </BrowserRouter>);
}

export default App
