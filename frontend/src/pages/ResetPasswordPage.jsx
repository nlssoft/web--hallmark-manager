import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../api/password.js";
import useTitle from "../utils/useTitle.js";

function ResetPasswordPage() {
  const { uid, token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  useTitle("Reset Password");

  async function handleSubmit(e) {
    e.preventDefault();

    if (password === confirmPassword) {
      try {
        await resetPassword({ uid, token, new_password: password });
        alert("Password reset seccessfull");
        navigate("/login");
      } catch (err) {
        console.log(err);
      }
    } else {
      alert("Password didn't match");
    }
  }

  return (
    <div className="auth-shell">
      <form
        onSubmit={handleSubmit}
        className="auth-card section-card section-card--padded auth-form"
      >
        <div className="auth-hero">
          <p className="section-kicker">Secure Access</p>
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-copy">Enter your new password below.</p>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="app-input"
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="confirm-password">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="app-input"
          />
        </div>

        <button type="submit" className="primary-button w-full">
          Reset Password
        </button>
      </form>
    </div>
  );
}

export default ResetPasswordPage;
