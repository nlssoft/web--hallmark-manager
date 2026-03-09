import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import API from "./api/client";
import Layout from "./components/Layout";
import LoginForm from "./components/LoginForm";
import DashboardPage from "./pages/DashboardPage";
import PartiesPage from "./pages/PartiesPage";
import RecordsPage from "./pages/RecordsPage";
import ProfilePage from "./pages/ProfilePage";

function ProtectedRoutes({ user, onLogout }) {
  return (
    <Layout user={user} onLogout={onLogout}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/parties" element={<PartiesPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/profile" element={<ProfilePage user={user} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [authError, setAuthError] = useState("");

  const authApi = useMemo(
    () => ({
      login: async (credentials) => {
        const response = await API.post("/auth/login/", credentials);
        return response.data;
      },
      me: async () => {
        const response = await API.get("/auth/users/me/");
        return response.data;
      },
      refresh: async () => {
        await API.post("/auth/token/refresh/");
      },
      logout: async () => {
        await API.post("/auth/logout/");
      },
    }),
    []
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const me = await authApi.me();
        setUser(me);
      } catch (error) {
        if (error.response?.status === 401) {
          try {
            await authApi.refresh();
            const me = await authApi.me();
            setUser(me);
          } catch {
            setUser(null);
          }
        } else {
          setAuthError("Unable to verify current session.");
        }
      } finally {
        setBootstrapping(false);
      }
    };

    checkAuth();
  }, [authApi]);

  const handleLogin = async (credentials) => {
    setAuthError("");
    const loginPayload = await authApi.login(credentials);
    if (loginPayload?.user) {
      setUser(loginPayload.user);
      return;
    }
    const me = await authApi.me();
    setUser(me);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Local logout still proceeds when endpoint errors.
    } finally {
      setUser(null);
    }
  };

  if (bootstrapping) {
    return <div className="screen-center">Checking session...</div>;
  }

  return (
    <BrowserRouter>
      {!user ? (
        <LoginForm onLogin={handleLogin} authError={authError} />
      ) : (
        <ProtectedRoutes user={user} onLogout={handleLogout} />
      )}
    </BrowserRouter>
  );
}
