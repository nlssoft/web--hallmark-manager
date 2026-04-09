import { useState } from "react";
import { sendEmail } from "../api/password";
import GoBackButton from "../components/GoBackButton.jsx";
import useTitle from "../utils/useTitle.js";

function SendEmailPage() {
  const [email, setEmail] = useState("");
  useTitle("Forgot Password");

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await sendEmail(email);
      alert("Email sent");
    } catch (err) {
      alert("Failed to send email");
      console.error(err.response?.data || err);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card section-card section-card--padded">
        <div className="auth-hero">
          <p className="section-kicker">Password Help</p>
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-copy">
            Enter your email and we will send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-field">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="app-input"
            />
          </div>

          <button type="submit" className="primary-button w-full">
            Send Reset Link
          </button>
        </form>

        <div className="mt-6">
          <GoBackButton to="/login" />
        </div>
      </div>
    </div>
  );
}

export default SendEmailPage;
