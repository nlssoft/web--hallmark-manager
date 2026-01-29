import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Parties from "./pages/Parties";
import PartyDetail from "./pages/PartyDetail";
import ServiceTypes from "./pages/ServiceTypes";
import WorkRates from "./pages/WorkRates";
import WorkRateDetail from "./pages/WorkRateDetail";
import Records from "./pages/Records";
import RecordDetail from "./pages/RecordDetail";
import Payments from "./pages/Payments";
import PaymentDetail from "./pages/PaymentDetail";
import Profile from "./pages/Profile";
import Summary from "./pages/Summary";
import AuditLog from "./pages/AuditLog";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* -------- PUBLIC -------- */}
      <Route path="/login" element={<Login />} />

      {/* -------- PROTECTED -------- */}
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

      <Route
        path="/parties/:id"
        element={
          <ProtectedRoute>
            <PartyDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/service-types"
        element={
          <ProtectedRoute>
            <ServiceTypes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/work-rates"
        element={
          <ProtectedRoute>
            <WorkRates />
          </ProtectedRoute>
        }
      />

      <Route
        path="/work-rates/:id"
        element={
          <ProtectedRoute>
            <WorkRateDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/records"
        element={
          <ProtectedRoute>
            <Records />
          </ProtectedRoute>
        }
      />

      <Route
        path="/records/:id"
        element={
          <ProtectedRoute>
            <RecordDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <Payments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payments/:id"
        element={
          <ProtectedRoute>
            <PaymentDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/summary"
        element={
          <ProtectedRoute>
            <Summary />
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit-log"
        element={
          <ProtectedRoute>
            <AuditLog />
          </ProtectedRoute>
        }
      />

      {/* -------- FALLBACK -------- */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
