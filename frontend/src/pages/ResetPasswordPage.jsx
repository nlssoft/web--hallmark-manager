import { useState } from "react";
import { useParams } from "react-router-dom";
import { resetPassword } from "../api/password.js";

function ResetPasswordPage() {
  const { uuid, token } = useParams();
  const [password, setPassword] = useState("");

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input placeholder="Confirm password" />

      <button type="submit">Reset Password</button>
    </form>
  );
}

export default ResetPasswordPage;
