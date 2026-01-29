import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Payments.css";

export default function PaymentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [payment, setPayment] = useState(null);
    const [amount, setAmount] = useState("");
    const [paymentDate, setPaymentDate] = useState("");
    const [reason, setReason] = useState("");
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get(`/history/payment/${id}/`)
            .then(res => {
                setPayment(res.data);
                setAmount(res.data.amount);
                setPaymentDate(res.data.payment_date);
            })
            .catch(() => setError("Failed to load payment"));
    }, [id]);

    const save = async () => {
        setError("");

        const payload = {
            amount,
            payment_date: paymentDate,
        };

        if (reason.trim()) payload.reason = reason.trim();

        try {
            const res = await api.put(`/history/payment/${id}/`, payload);
            setPayment(res.data);
            setEditing(false);
            setReason("");
        } catch {
            setError("Update failed (validation or 7-day limit)");
        }
    };

    const remove = async () => {
        if (!window.confirm("Delete this payment?")) return;

        try {
            await api.delete(`/history/payment/${id}/`);
            navigate("/payments");
        } catch {
            setError("Delete failed (7-day limit)");
        }
    };

    if (!payment) return null;

    return (
        <div className="payments-page">
            <header className="payments-header">
                <h1>Payment Detail</h1>
                <p>View and update payment</p>
            </header>

            {error && <div className="error-box">{error}</div>}

            <div className="card payment-detail-card">
                <div className="payment-detail-grid">
                    <Detail label="Party">
                        {payment.party__logo} — {payment.party__first_name} {payment.party__last_name}
                    </Detail>

                    <Detail label="Amount">
                        {editing ? (
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                        ) : (
                            `₹ ${payment.amount}`
                        )}
                    </Detail>

                    <Detail label="Payment Date">
                        {editing ? (
                            <input
                                type="date"
                                value={paymentDate}
                                onChange={e => setPaymentDate(e.target.value)}
                            />
                        ) : (
                            payment.payment_date
                        )}
                    </Detail>

                    {editing && (
                        <Detail label="Reason (optional)">
                            <input
                                placeholder="Why are you editing?"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                            />
                        </Detail>
                    )}
                </div>

                <div className="detail-actions">
                    {editing ? (
                        <>
                            <button className="primary" onClick={save}>Save</button>
                            <button className="secondary" onClick={() => setEditing(false)}>
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="primary" onClick={() => setEditing(true)}>
                                Edit Payment
                            </button>
                            <button className="danger" onClick={remove}>
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="bottom-actions">
                <button onClick={() => navigate("/payments")}>
                    ← Back to Payments
                </button>
            </div>
        </div>
    );
}

function Detail({ label, children }) {
    return (
        <div className="detail-item">
            <div className="detail-label">{label}</div>
            <div className="detail-value">{children}</div>
        </div>
    );
}
