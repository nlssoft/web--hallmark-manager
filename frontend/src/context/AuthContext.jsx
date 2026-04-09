import { useEffect, useState } from "react";
import api from "../api/axios";
import { AuthContext } from "./auth-context.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      try {
        const result = await api.get("/auth/profile/me/");
        if (!ignore) {
          setUser(result.data);
        }
      } catch {
        if (!ignore) {
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      ignore = true;
    };
  }, []);

  async function logout() {
    try {
      await api.post("/auth/logout/");
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext value={{ user, loading, logout, setUser }}>
      {children}
    </AuthContext>
  );
}
