import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Records.css";

export default function Records() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [parties, setParties] = useState([]);
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    party: "",
    service_type: "",
    pcs: "",
    rate_mode: "system",
    rate: "",
    discount: "",
    record_date: "",
  });

  const [filters, setFilters] = useState({
    search_by: "party__logo",
    search_text: "",
    date_from: "",
    date_to: "",
    min_discount: "",
    paid_min: "",
    paid_max: "",
  });

  useEffect(() => {
    loadMeta();
    loadRecords();
  }, []);

  const loadMeta = async () => {
    try {
      const [p, s] = await Promise.all([
        api.get("/history/party/"),
        api.get("/history/service-type/"),
      ]);
      setParties(p.data || []);
      setServices(s.data || []);
    } catch {
      setError("Failed to load metadata");
    }
  };

  const buildQuery = () => {
    const q = new URLSearchParams();

    if (filters.search_text) {
      q.append(filters.search_by, filters.search_text);
    }
    if (filters.date_from) q.append("date_range_after", filters.date_from);
    if (filters.date_to) q.append("date_range_before", filters.date_to);
    if (filters.min_discount) q.append("discount", filters.min_discount);
    if (filters.paid_min) q.append("paid_amount_min", filters.paid_min);
    if (filters.paid_max) q.append("paid_amount_max", filters.paid_max);

    const qs = q.toString();
    return qs ? `?${qs}` : "";
  };

  const loadRecords = async () => {
    try {
      const res = await api.get(`/history/record/${buildQuery()}`);
      setRecords(res.data || []);
      setError("");
    } catch {
      setError("Failed to load records");
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    const payload = {
      party: form.party,
      service_type: form.service_type,
      pcs: Number(form.pcs),
      discount: form.discount || 0,
      rate_mode: form.rate_mode,
      record_date: form.record_date || undefined,
    };

    if (form.rate_mode === "manual") {
      payload.rate = Number(form.rate);
    }

    try {
      await api.post("/history/record/", payload);
      setForm({
        party: "",
        service_type: "",
        pcs: "",
        rate_mode: "system",
        rate: "",
        discount: "",
        record_date: "",
      });
      loadRecords();
    } catch {
      setError("Failed to create record");
    }
  };

  return (
    <div className="records-page">
      <header className="records-header">
        <h1>Records</h1>
        <p>Create and manage work records</p>
      </header>

      {error && <div className="form-error">{error}</div>}

      {/* CREATE */}
      <form className="card record-form" onSubmit={submit}>
        <input
          list="party-autocomplete"
          placeholder="Search party (name / logo / address)"
          required
          value={form.party}
          onChange={(e) => setForm({ ...form, party: e.target.value })}
        />

        <datalist id="party-autocomplete">
          {parties.map((p) => (
            <option
              key={p.id}
              value={p.id}
            >
              {p.logo} — {p.first_name} {p.last_name} ({p.address})
            </option>
          ))}
        </datalist>

        <select
          required
          value={form.service_type}
          onChange={(e) =>
            setForm({ ...form, service_type: e.target.value })
          }
        >
          <option value="">Select service</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.type_of_work}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="1"
          placeholder="Number of pieces"
          required
          value={form.pcs}
          onChange={(e) => setForm({ ...form, pcs: e.target.value })}
        />

        <select
          value={form.rate_mode}
          onChange={(e) => setForm({ ...form, rate_mode: e.target.value })}
        >
          <option value="system">Use system rate</option>
          <option value="manual">Enter rate manually</option>
        </select>

        <input
          type="number"
          min="0"
          placeholder="Discount amount"
          value={form.discount}
          onChange={(e) => setForm({ ...form, discount: e.target.value })}
        />

        <input
          type="date"
          value={form.record_date}
          onChange={(e) =>
            setForm({ ...form, record_date: e.target.value })
          }
        />

        <button type="submit">Create Record</button>
      </form>

      {/* LIST */}
      {records.map((r) => (
        <div key={r.id} className="record-card">
          <div className="record-head">
            <div className="party-block">
              <strong>{r.party__logo}</strong>
              <span>
                {r.party__first_name} {r.party__last_name}
              </span>
              <div className="party-address">
                {r.party__address}
              </div>
            </div>

            <span className="muted">
              {r.service_type__type_of_work}
            </span>
          </div>

          <div className="record-grid">
            <span>Pieces: {r.pcs}</span>
            <span>Rate: ₹{r.rate}</span>
            <span>Discount: ₹{r.discount}</span>
            <span>Total: ₹{r.amount}</span>
            <span>Paid: ₹{r.paid_amount}</span>
            <span>Date: {r.record_date}</span>
          </div>

          <Link to={`/records/${r.id}`} className="view-link">
            View / Edit
          </Link>
        </div>
      ))}

      <div className="bottom-actions">
        <button onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
