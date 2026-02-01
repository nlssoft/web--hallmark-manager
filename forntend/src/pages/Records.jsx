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

  // Autocomplete state (IMPORTANT)
  const [partyQuery, setPartyQuery] = useState("");
  const [showPartyList, setShowPartyList] = useState(false);

  const [form, setForm] = useState({
    party: "",            // MUST be ID only
    service_type: "",
    pcs: "",
    rate_mode: "system",
    rate: "",
    discount: "",
    record_date: "",
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

  const loadRecords = async () => {
    try {
      const res = await api.get("/history/record/");
      setRecords(res.data || []);
    } catch {
      setError("Failed to load records");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      party: form.party,
      service_type: form.service_type,
      pcs: Number(form.pcs),
      discount: Number(form.discount || 0),
      rate_mode: form.rate_mode,
      record_date: form.record_date || undefined,
    };

    if (form.rate_mode === "manual") {
      payload.rate = Number(form.rate);
    }

    try {
      await api.post("/history/record/", payload);

      // reset form
      setForm({
        party: "",
        service_type: "",
        pcs: "",
        rate_mode: "system",
        rate: "",
        discount: "",
        record_date: "",
      });
      setPartyQuery("");
      loadRecords();
    } catch (err) {
      // REAL backend error shown
      if (err.response?.data) {
        const firstError = Object.values(err.response.data)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError("Failed to create record");
      }
    }
  };

  const filteredParties = parties.filter((p) =>
    `${p.logo} ${p.first_name} ${p.last_name} ${p.address}`
      .toLowerCase()
      .includes(partyQuery.toLowerCase())
  );

  return (
    <div className="records-page">
      <header className="records-header">
        <h1>Records</h1>
        <p>Create and manage work records</p>
      </header>

      {error && <div className="form-error">{error}</div>}

      {/* ===== CREATE RECORD ===== */}
      <form className="card record-form" onSubmit={submit}>
        {/* PARTY AUTOCOMPLETE */}
        <div className="autocomplete">
          <input
            placeholder="Search party (name / logo / address)"
            value={partyQuery}
            onChange={(e) => {
              setPartyQuery(e.target.value);
              setShowPartyList(true);
            }}
            required
          />

          {showPartyList && partyQuery && (
            <div className="autocomplete-list">
              {filteredParties.map((p) => (
                <div
                  key={p.id}
                  className="autocomplete-item"
                  onClick={() => {
                    setForm({ ...form, party: p.id });
                    setPartyQuery(
                      `${p.logo} — ${p.first_name} ${p.last_name}`
                    );
                    setShowPartyList(false);
                  }}
                >
                  <strong>{p.logo}</strong>
                  <span>
                    {p.first_name} {p.last_name}
                  </span>
                  <small>{p.address}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SERVICE */}
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

        {/* RATE MODE */}
        <select
          value={form.rate_mode}
          onChange={(e) =>
            setForm({ ...form, rate_mode: e.target.value })
          }
        >
          <option value="system">Use system rate</option>
          <option value="manual">Enter rate manually</option>
        </select>

        {/* MANUAL RATE (FIXED) */}
        {form.rate_mode === "manual" && (
          <input
            type="number"
            min="0"
            placeholder="Manual rate"
            required
            value={form.rate}
            onChange={(e) =>
              setForm({ ...form, rate: e.target.value })
            }
          />
        )}

        <input
          type="number"
          min="0"
          placeholder="Discount amount"
          value={form.discount}
          onChange={(e) =>
            setForm({ ...form, discount: e.target.value })
          }
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

      {/* ===== RECORD LIST ===== */}
      {records.map((r) => (
        <div key={r.id} className="record-card">
          <div className="record-head">
            <div>
              <strong>{r.party__logo}</strong>
              <div>
                {r.party__first_name} {r.party__last_name}
              </div>
              <div className="muted">{r.party__address}</div>
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
