import { useEffect, useState } from "react";
import API from "../api/client";

const initialForm = {
  first_name: "",
  last_name: "",
  number: "",
  email: "",
  address: "",
  logo: "",
};

export default function PartiesPage() {
  const [parties, setParties] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadParties = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await API.get("/history/party/");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setParties(data);
    } catch {
      setError("Failed to fetch parties.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await API.post("/history/party/", form);
      setForm(initialForm);
      await loadParties();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Failed to create party.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="section-header">
        <h1>Parties</h1>
      </div>
      {error && <p className="error-text">{error}</p>}

      <form className="card form-grid" onSubmit={onCreate}>
        <h2>Create Party</h2>
        <div className="split-grid">
          <label>
            First Name
            <input
              name="first_name"
              value={form.first_name}
              onChange={onChange}
              required
            />
          </label>
          <label>
            Last Name
            <input name="last_name" value={form.last_name} onChange={onChange} />
          </label>
          <label>
            Number
            <input name="number" value={form.number} onChange={onChange} />
          </label>
          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={onChange} />
          </label>
          <label>
            Logo
            <input name="logo" value={form.logo} onChange={onChange} />
          </label>
          <label>
            Address
            <input name="address" value={form.address} onChange={onChange} />
          </label>
        </div>
        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Create Party"}
        </button>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Number</th>
              <th>Email</th>
              <th>Due</th>
              <th>Advance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5">Loading parties...</td>
              </tr>
            ) : parties.length === 0 ? (
              <tr>
                <td colSpan="5">No parties found.</td>
              </tr>
            ) : (
              parties.map((party) => (
                <tr key={party.id}>
                  <td>{`${party.first_name || ""} ${party.last_name || ""}`}</td>
                  <td>{party.number || "-"}</td>
                  <td>{party.email || "-"}</td>
                  <td>{party.due ?? "-"}</td>
                  <td>{party.advance_balance ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
