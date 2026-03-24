import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import Dashboard from "./pages/DashboardPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PartiesPage from "./pages/PartiesPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parties"
        element={
          <ProtectedRoute>
            <PartiesPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
