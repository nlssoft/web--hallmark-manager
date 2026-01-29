import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Payments.css";

const today = new Date().toISOString().split("T")[0];

export default function Payments() {
    const navigate = useNavigate();

    const [payments, setPayments] = useState([]);
    const [parties, setParties] = useState([]);

    const [form, setForm] = useState({
        party: "",
        amount: "",
        payment_date: today,
    });

    const [filterType, setFilterType] = useState("party__logo");
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [partyQuery, setPartyQuery] = useState("");
    const [showPartyList, setShowPartyList] = useState(false);

    useEffect(() => {
        loadPayments();
        api.get("/history/party/").then(res => setParties(res.data));
    }, []);

    const loadPayments = async (params = {}) => {
        const res = await api.get("/history/payment/", { params });
        setPayments(res.data);
    };

    const createPayment = async (e) => {
        e.preventDefault();

        await api.post("/history/payment/", form);

        setForm({
            party: "",
            amount: "",
            payment_date: today,
        });

        setPartyQuery("");
        loadPayments();
    };

    const applyFilters = () => {
        const params = {};

        if (search) params[filterType] = search;
        if (dateFrom || dateTo) {
            params.date_range = `${dateFrom || ""},${dateTo || ""}`;
        }

        loadPayments(params);
    };

    const filteredParties = parties.filter(p =>
        `${p.logo} ${p.first_name} ${p.last_name}`
            .toLowerCase()
            .includes(partyQuery.toLowerCase())
    );

    return (
        <div className="payments-page">
            <header className="payments-header">
                <h1>Payments</h1>
                <p>All received payments</p>
            </header>

            {/* ===== CREATE PAYMENT ===== */}
            <div className="card payment-create-card">
                <h3>Create Payment</h3>

                <form className="payment-form" onSubmit={createPayment}>
                    <div className="autocomplete">
                        <input
                            placeholder="Select party (logo or name)"
                            value={partyQuery}
                            onChange={e => {
                                setPartyQuery(e.target.value);
                                setShowPartyList(true);
                            }}
                            required
                        />

                        {showPartyList && partyQuery && (
                            <div className="autocomplete-list">
                                {filteredParties.map(p => (
                                    <div
                                        key={p.id}
                                        className="autocomplete-item"
                                        onClick={() => {
                                            setForm({ ...form, party: p.id });
                                            setPartyQuery(`${p.logo} — ${p.first_name} ${p.last_name}`);
                                            setShowPartyList(false);
                                        }}
                                    >
                                        <strong>{p.logo}</strong>
                                        <span>{p.first_name} {p.last_name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <input
                        type="number"
                        placeholder="Amount (₹)"
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })}
                        required
                    />

                    <input
                        type="date"
                        value={form.payment_date}
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
