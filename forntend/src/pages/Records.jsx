import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Records.css";

export default function Records() {
  const navigate = useNavigate();

  /* ================= DATA ================= */
  const [records, setRecords] = useState([]);
  const [parties, setParties] = useState([]);
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");

  /* ================= CREATE FORM ================= */
  const [form, setForm] = useState({
    party: "",
    service_type: "",
    pcs: "",
    rate_mode: "system",
    rate: "",
    discount: "",
    record_date: "",
  });

  /* ================= FILTERS ================= */
  const [filters, setFilters] = useState({
    search_by: "party__logo",
    search_text: "",
    date_from: "",
    date_to: "",
    min_discount: "",
    paid_min: "",
    paid_max: "",
  });

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    loadMeta();
    loadRecords();
  }, []);

  const loadMeta = async () => {
    const [p, s] = await Promise.all([
      api.get("/history/party/"),
      api.get("/history/service-type/"),
    ]);
    setParties(p.data);
    setServices(s.data);
  };

  /* ================= QUERY BUILDER ================= */
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

  /* ================= LOAD RECORDS ================= */
  const loadRecords = async () => {
    try {
      const res = await api.get(`/history/record/${buildQuery()}`);
      setRecords(res.data);
      setError("");
    } catch {
      setError("Failed to load records");
    }
  };

  /* ================= CREATE RECORD ================= */
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

  /* ================= AUTOCOMPLETE OPTIONS ================= */
  const autocompleteOptions =
    filters.search_by.startsWith("party")
      ? parties.map(p =>
          filters.search_by === "party__logo"
            ? p.logo
            : filters.search_by === "party__first_name"
            ? p.first_name
            : p.last_name
        )
      : services.map(s => s.type_of_work);

  return (
    <div className="records-page">
      <h1>Records</h1>
      <p className="subtitle">Create & manage work records</p>

      {error && <div className="form-error">{error}</div>}

      {/* ===== CREATE RECORD ===== */}
      <form className="record-form" onSubmit={submit}>
        <select
          required
          value={form.party}
          onChange={e => setForm({ ...form, party: e.target.value })}
        >
          <option value="">Select Party</option>
          {parties.map(p => (
            <option key={p.id} value={p.id}>
              {p.logo} — {p.first_name} {p.last_name}
            </option>
          ))}
        </select>

        <select
          required
          value={form.service_type}
          onChange={e =>
            setForm({ ...form, service_type: e.target.value })
          }
        >
          <option value="">Select Service</option>
          {services.map(s => (
            <option key={s.id} value={s.id}>
              {s.type_of_work}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="1"
          placeholder="PCS (number of pieces)"
          required
          value={form.pcs}
          onChange={e => setForm({ ...form, pcs: e.target.value })}
        />

        <select
          value={form.rate_mode}
          onChange={e =>
            setForm({ ...form, rate_mode: e.target.value })
          }
        >
          <option value="system">System Rate</option>
          <option value="manual">Manual Rate</option>
        </select>

        {form.rate_mode === "manual" && (
          <input
            type="number"
            min="0"
            placeholder="Manual Rate"
            value={form.rate}
            onChange={e => setForm({ ...form, rate: e.target.value })}
          />
        )}

        <input
          type="number"
          min="0"
          placeholder="Discount"
          value={form.discount}
          onChange={e =>
            setForm({ ...form, discount: e.target.value })
          }
        />

        <input
          type="date"
          value={form.record_date}
          onChange={e =>
            setForm({ ...form, record_date: e.target.value })
          }
        />

        <button type="submit">Create Record</button>
      </form>

      {/* ===== FILTER INSTRUCTIONS ===== */}
      <div className="filter-help">
        <h4>How to use filters</h4>
        <ul>
          <li>
            <b>Search By</b>:
            <ul>
              <li>Party First Name → <code>abhay</code></li>
              <li>Party Last Name → <code>prasad</code></li>
              <li>Party Logo → <code>ap</code>, <code>jj</code></li>
              <li>Service → <code>CARD</code>, <code>TOUNCH</code></li>
            </ul>
          </li>
          <li><b>Search Value</b>: text to search (autocomplete supported)</li>
          <li><b>Date From / To</b>: record date range</li>
          <li><b>Min Discount</b>: discount ≥ value</li>
          <li><b>Paid ≥ / ≤</b>: paid amount range</li>
        </ul>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="filter-bar">
        <select
          value={filters.search_by}
          onChange={e =>
            setFilters({ ...filters, search_by: e.target.value })
          }
        >
          <option value="party__logo">Party Logo</option>
          <option value="party__first_name">Party First Name</option>
          <option value="party__last_name">Party Last Name</option>
          <option value="service_type__type_of_work">Service</option>
        </select>

        <input
          list="autocomplete"
          placeholder="Search value"
          value={filters.search_text}
          onChange={e =>
            setFilters({ ...filters, search_text: e.target.value })
          }
        />

        <datalist id="autocomplete">
          {autocompleteOptions.map((v, i) => (
            <option key={i} value={v} />
          ))}
        </datalist>

        <input
          type="date"
          onChange={e =>
            setFilters({ ...filters, date_from: e.target.value })
          }
        />

        <input
          type="date"
          onChange={e =>
            setFilters({ ...filters, date_to: e.target.value })
          }
        />

        <input
          type="number"
          placeholder="Min Discount"
          onChange={e =>
            setFilters({ ...filters, min_discount: e.target.value })
          }
        />

        <input
          type="number"
          placeholder="Paid ≥"
          onChange={e =>
            setFilters({ ...filters, paid_min: e.target.value })
          }
        />

        <input
          type="number"
          placeholder="Paid ≤"
          onChange={e =>
            setFilters({ ...filters, paid_max: e.target.value })
          }
        />

        <button onClick={loadRecords}>Apply</button>
      </div>

      {/* ===== RECORD LIST ===== */}
      {records.map(r => (
        <div key={r.id} className="record-card">
          <strong>{r.party__logo}</strong>
          <div>{r.party__first_name} {r.party__last_name}</div>
          <small>{r.service_type__type_of_work}</small>

          <div className="record-grid">
            <span>PCS: {r.pcs}</span>
            <span>Rate: ₹{r.rate}</span>
            <span>Discount: ₹{r.discount}</span>
            <span>Amount: ₹{r.amount}</span>
            <span>Paid: ₹{r.paid_amount}</span>
            <span>Date: {r.record_date}</span>
          </div>

          <Link to={`/records/${r.id}`}>Edit / Delete</Link>
        </div>
      ))}

      <button className="back-btn" onClick={() => navigate("/dashboard")}>
        ← Back to Dashboard
      </button>
    </div>
  );
}
