import { useState } from "react";

export default function LoginForm({ onLogin, authError }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPending(true);
    setFormError("");
    try {
      await onLogin({ username, password });
    } catch (error) {
      const detail = error.response?.data?.detail;
      setFormError(detail || "Invalid username/password.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-card">
        <h1>Hallmark Manager</h1>
        <p>Sign in with your backend account credentials.</p>
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {(formError || authError) && (
            <p className="error-text">{formError || authError}</p>
          )}
          <button type="submit" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
