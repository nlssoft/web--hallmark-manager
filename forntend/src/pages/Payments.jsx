import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Payments.css";

/* ===== DATE LIMITS (MATCH BACKEND VALIDATION) ===== */
const today = new Date();
const todayStr = today.toISOString().split("T")[0];

const minDate = new Date();
minDate.setDate(today.getDate() - 7);
const minDateStr = minDate.toISOString().split("T")[0];

export default function Payments() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [parties, setParties] = useState([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    party: "",
    amount: "",
    payment_date: todayStr,
  });

  const [filterType, setFilterType] = useState("party__logo");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [partyQuery, setPartyQuery] = useState("");
  const [showPartyList, setShowPartyList] = useState(false);

  useEffect(() => {
    loadPayments();
    api.get("/history/party/")
      .then(res => setParties(res.data || []))
      .catch(() => setParties([]));
  }, []);

  const loadPayments = async (params = {}) => {
    try {
      const res = await api.get("/history/payment/", { params });
      setPayments(res.data || []);
    } catch {
      setPayments([]);
    }
  };

  /* ===== CREATE PAYMENT (ERROR SAFE) ===== */
  const createPayment = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/history/payment/", form);

      setForm({
        party: "",
        amount: "",
        payment_date: todayStr,
      });

      setPartyQuery("");
      setShowPartyList(false);
      loadPayments();
    } catch (err) {
      // 🔑 SHOW EXACT BACKEND ERROR
      const data = err.response?.data || {};

      if (data.payment_date) {
        setError(data.payment_date[0]);
      } else if (data.amount) {
        setError(data.amount[0]);
      } else if (data.detail) {
        setError(data.detail);
      } else {
        setError("Payment creation failed");
      }
    }
  };

  const applyFilters = () => {
    const params = {};

    if (search) params[filterType] = search;
    if (dateFrom || dateTo) {
      params.date_range = `${dateFrom || ""},${dateTo || ""}`;
    }

    loadPayments(params);
  };

  /* ===== PARTY AUTOCOMPLETE ===== */
  const filteredParties = parties.filter(p =>
    `${p.logo} ${p.first_name} ${p.last_name} ${p.address || ""}`
      .toLowerCase()
      .includes(partyQuery.toLowerCase())
  );

  return (
    <div className="payments-page">
      <header className="payments-header">
        <h1>Payments</h1>
        <p>All received payments</p>
      </header>

      {error && <div className="error-box">{error}</div>}

      {/* ===== CREATE PAYMENT ===== */}
      <div className="card payment-create-card">
        <h3>Create Payment</h3>

        <form className="payment-form" onSubmit={createPayment}>
          <div className="autocomplete">
            <input
              placeholder="Search party (name / logo / address)"
              value={partyQuery}
              onChange={e => {
                setPartyQuery(e.target.value);
                setShowPartyList(true);
              }}
              required
            />

            {showPartyList && partyQuery && (
              <div className="autocomplete-list light">
                {filteredParties.map(p => (
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
                    {p.address && (
                      <small className="muted">{p.address}</small>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <input
            type="number"
            placeholder="Amount (₹)"
            value={form.amount}
            onChange={e =>
              setForm({ ...form, amount: e.target.value })
            }
            required
          />

          <input
            type="date"
            value={form.payment_date}
            min={minDateStr}
            max={todayStr}
            onChange={e =>
              setForm({ ...form, payment_date: e.target.value })
            }
            required
          />

          <button type="submit">Create Payment</button>
        </form>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="filter-bar">
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="party__logo">Party Logo</option>
          <option value="party__first_name">First Name</option>
          <option value="party__last_name">Last Name</option>
        </select>

        <input
          placeholder="Search text"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
        />

        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
        />

        <button onClick={applyFilters}>Apply</button>
      </div>

      {/* ===== LIST ===== */}
      {payments.map(p => (
        <div key={p.id} className="payment-row">
          <div className="amount">₹ {p.amount}</div>

          <div className="party">
            <strong>{p.party__logo}</strong>
            <div className="muted">
              {p.party__first_name} {p.party__last_name}
            </div>
            {/* ✅ ADDRESS COLUMN */}
            {p.party__address && (
              <div className="muted small">
                {p.party__address}
              </div>
            )}
          </div>

          <div className="right">
            <div className="date">{p.payment_date}</div>
            <Link to={`/payments/${p.id}`}>View</Link>
          </div>
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
