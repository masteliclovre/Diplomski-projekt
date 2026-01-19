import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import RegistrationPage from "./pages/RegistrationPage";
import Login from "./pages/Login";
import GenePage from "./pages/GenePage";
import VariantPage from "./pages/VariantPage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/genes/:geneId" element={<GenePage />} />
        <Route path="/variant/:variantId" element={<VariantPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
