import { useState } from "react";
import { sendEmail } from "../api/password";
import GoBackButton from "../components/GoBackButton.jsx";

function SendEmailPage() {
  const [email, setEmail] = useState("");

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center mb-4">
          Forgot Password
        </h1>

        <p className="text-sm text-gray-500 text-center mb-6">
          Enter your email and we’ll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 
                     focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg 
                     hover:bg-blue-600 transition"
          >
            Send Reset Link
          </button>
        </form>
        <GoBackButton to={"/login"} />
      </div>
    </div>
  );
}

export default SendEmailPage;
