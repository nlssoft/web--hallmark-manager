import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PartiesPage from "./pages/PartiesPage.jsx";
import PartyDetailPage from "./pages/PartyDetailPage.jsx";
import ServiceTypePage from "./pages/ServiceTypePage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import SendEmailPage from "./pages/SendEmailPage.jsx";
import SubUserPage from "./pages/SubUserPage.jsx";
import SubUserDetailPage from "./pages/SubUserDetailPage";
import WorkRatePage from "./pages/WorkRatePage.jsx";
import WorkRateDetailPage from "./pages/WorkRateDetailPage.jsx";
import RecordPage from "./pages/RecordPage.jsx";
import RecordDetailPage from "./pages/RecordDetailPage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import PaymentDetailPage from "./pages/PaymentDetailPage.jsx";
import SummaryPage from "./pages/SummaryPage.jsx";
import AuditPage from "./pages/AuditLogPage.jsx";
import AuditDetailPage from "./pages/AuditDetailPage.jsx";
import AdvanceLedgerPage from "./pages/AdvanceLedgerPage.jsx";
import AdvanceLedgerDetailPage from "./pages/AdvanceLedgerDetailPage.jsx";
import PaymentRequestPage from "./pages/PaymentRequestPage.jsx";
import PaymentRequestDetailPage from "./pages/PaymentRequestDetailPage.jsx";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";

function App() {
  return (
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<LoginPage />} />
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
        path="/profile/me"
        element={
          <ProtectedRoute>
            <ProfilePage />
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

      <Route
        path="/work-rate/"
        element={
          <ProtectedRoute>
            <WorkRatePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/work-rate/:id"
        element={
          <ProtectedRoute>
            <WorkRateDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/record/"
        element={
          <ProtectedRoute>
            <RecordPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/record/:id"
        element={
          <ProtectedRoute>
            <RecordDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment/"
        element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment/:id"
        element={
          <ProtectedRoute>
            <PaymentDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/summary/"
        element={
          <ProtectedRoute>
            <SummaryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <AuditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit/:id"
        element={
          <ProtectedRoute>
            <AuditDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advance-ledger/"
        element={
          <ProtectedRoute>
            <AdvanceLedgerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advance-ledger/:id"
        element={
          <ProtectedRoute>
            <AdvanceLedgerDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment-request/"
        element={
          <ProtectedRoute>
            <PaymentRequestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment-request/:id"
        element={
          <ProtectedRoute>
            <PaymentRequestDetailPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
