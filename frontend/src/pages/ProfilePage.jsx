import { useState } from "react";
import API from "../api/client";

export default function ProfilePage({ user }) {
  const [form, setForm] = useState({
    email: user?.email || "",
    number: user?.number || "",
    address: user?.address || "",
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");
    try {
      await API.patch("/user/profile/update_profile/", form);
      setMessage("Profile updated.");
    } catch {
      setError("Could not update profile.");
    } finally {
      setPending(false);
    }
  };

  return (
    <section>
      <div className="section-header">
        <h1>Profile</h1>
      </div>
      <form className="card form-grid profile-form" onSubmit={onSubmit}>
        <label>
          Username
          <input value={user?.username || ""} disabled />
        </label>
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={onChange} />
        </label>
        <label>
          Number
          <input name="number" value={form.number} onChange={onChange} />
        </label>
        <label>
          Address
          <textarea name="address" value={form.address} onChange={onChange} rows="4" />
        </label>
        {message && <p className="success-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={pending}>
          {pending ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </section>
  );
}
