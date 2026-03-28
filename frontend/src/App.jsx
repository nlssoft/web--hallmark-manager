import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import Dashboard from "./pages/DashboardPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PartiesPage from "./pages/PartiesPage.jsx";
import PartyDetailPage from "./pages/PartyDetailPage.jsx";
import ServiceTypePage from "./pages/ServiceTypePage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import SendEmailPage from "./pages/SendEmailPage.jsx";
import SubUserPage from "./pages/SubUserPage.jsx";
import SubUserDetailPage from "./pages/SubUserDetailPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password/" element={<SendEmailPage />} />
      <Route
        path="/reset-password/:uid/:token"
        element={<ResetPasswordPage />}
      />
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
      <Route
        path="/parties/:id"
        element={
          <ProtectedRoute>
            <PartyDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/service-Type/"
        element={
          <ProtectedRoute>
            <ServiceTypePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sub-user/"
        element={
          <ProtectedRoute>
            <SubUserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sub-user/:id/"
        element={
          <ProtectedRoute>
            <SubUserDetailPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
