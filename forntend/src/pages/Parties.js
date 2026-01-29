import { useEffect, useState } from "react";
import api from "../api/axios";
import { Link, useNavigate } from "react-router-dom";
import "./Parties.css";

const MAX_LOGO = 10;
const MAX_TEXT = 255;

export default function Parties() {
  const navigate = useNavigate();

  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    logo: "",
    number: "",
    address: "",
    email: "",
  });

  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = async () => {
    const res = await api.get("/history/party/");
    setParties(res.data);
  };

  const validate = () => {
    const e = {};

    if (!form.logo.trim()) e.logo = "Logo is required";
    else if (form.logo.length > MAX_LOGO) e.logo = "Logo max length is 10";

    if (!form.first_name.trim()) e.first_name = "First name is required";
    else if (form.first_name.length > MAX_TEXT) e.first_name = "Too long";

    if (form.last_name.length > MAX_TEXT) e.last_name = "Too long";
    if (form.number.length > MAX_TEXT) e.number = "Too long";
    if (form.email.length > MAX_TEXT) e.email = "Too long";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    const payload = {
      ...form,
      last_name: form.last_name || null,
      number: form.number || null,
      email: form.email || null,
      address: form.address || null,
    };

    try {
      await api.post("/history/party/", payload);
      setForm({
        first_name: "",
        last_name: "",
        logo: "",
        number: "",
        address: "",
        email: "",
      });
      setErrors({});
      loadParties();
    } catch {
      setServerError("Failed to create party");
    }
  };

  const filtered = parties.filter((p) =>
    `${p.first_name} ${p.last_name} ${p.logo}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="parties-page">
      <div className="parties-header">
        <h1>Parties</h1>
      </div>

      {/* CREATE PARTY */}
      <div className="card">
        <h3>Create Party</h3>

        {serverError && <div className="form-error">{serverError}</div>}

        <form className="party-form" onSubmit={submit}>
          <input
            placeholder="Logo *"
            maxLength={MAX_LOGO}
            value={form.logo}
            onChange={(e) => setForm({ ...form, logo: e.target.value })}
          />
          {errors.logo && <div className="form-error">{errors.logo}</div>}

          <input
            placeholder="First name *"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
          {errors.first_name && (
            <div className="form-error">{errors.first_name}</div>
          )}

          <input
            placeholder="Last name"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />

          <input
            placeholder="Phone"
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
          />

          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <button type="submit">Create Party</button>
        </form>
      </div>

      {/* SEARCH */}
      <div className="search-box">
        <input
          placeholder="Search by name or logo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="card table-wrapper">
        <table className="party-table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Name</th>
              <th>Address</th>
              <th>Due</th>
              <th>Advance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.logo}</td>
                <td>{p.first_name} {p.last_name}</td>
                <td>{p.address}</td>
                <td>{p.due}</td>
                <td>{p.advance_balance}</td>
                <td>
                  <Link to={`/parties/${p.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER BACK */}
      <div className="page-footer">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
