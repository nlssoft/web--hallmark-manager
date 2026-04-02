import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await api.post("/auth/login/", { username, password });
      const profile = await api.get("/auth/profile/me/");
      setUser(profile.data);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid username or password");
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card section-card section-card--padded">
        <div className="auth-hero">
          <p className="section-kicker">Welcome Back</p>
          <h1 className="auth-title">Sign in to Hallmark Manager</h1>
          <p className="auth-copy">
            A lighter, cleaner workspace for records, parties, rates, and daily
            admin tasks.
          </p>
        </div>

        {error && <p className="field-error mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-field">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="app-input"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="app-input"
            />
          </div>

          <button type="submit" className="primary-button w-full">
            Sign in
          </button>

          <button
            type="button"
            onClick={() => navigate("/forgot-password/")}
            className="page-link mx-auto"
          >
            Forgot your password?
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
