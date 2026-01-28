import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Parties from "./pages/Parties";
import PartyDetail from "./pages/PartyDetail";
import ProtectedRoute from "./components/ProtectedRoute";
import ServiceTypes from "./pages/ServiceTypes";


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/parties"
        element={
          <ProtectedRoute>
            <Parties />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/parties/:id" element={<PartyDetail />} />
      <Route path="/service-types" element={<ServiceTypes />} />

    </Routes>
  );
}
