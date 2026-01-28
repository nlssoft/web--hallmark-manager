import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function PartyCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    number: "",
    email: "",
    address: "",
    logo: "",
  });

  const [error, setError] = useState(null);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();

    api.post("/history/party/", form)
      .then(() => navigate("/parties"))
      .catch(err => {
        console.error(err);
        setError("Failed to create party");
      });
  };

  return (
    <>
      <h1>Create Party</h1>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input name="first_name" placeholder="First name" onChange={handleChange} required />
        <br />
        <input name="last_name" placeholder="Last name" onChange={handleChange} />
        <br />
        <input name="logo" placeholder="Logo" onChange={handleChange} required />
        <br />
        <input name="number" placeholder="Phone" onChange={handleChange} />
        <br />
        <input name="email" placeholder="Email" onChange={handleChange} />
        <br />
        <textarea name="address" placeholder="Address" onChange={handleChange} />
        <br />
        <button type="submit">Create</button>
      </form>
    </>
  );
}
