import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Records.css";

export default function RecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    api.get(`/history/record/${id}/`).then((res) => {
      setRecord(res.data);
      setForm(res.data);
    });
  }, [id]);

  const save = async () => {
    await api.patch(`/history/record/${id}/`, {
      pcs: Number(form.pcs),
      rate: Number(form.rate),
      discount: Number(form.discount),
    });

    setEditing(false);
    navigate(0);
  };

  const del = async () => {
    if (!window.confirm("Delete this record?")) return;
    await api.delete(`/history/record/${id}/`);
    navigate("/records");
  };

  if (!record) return null;

  return (
    <div className="records-page">
      <h1>Record Detail</h1>

      <div className="record-detail">
        <div className="detail-row">
          <span className="label">Party</span>
          <span>{record.party__logo}</span>
        </div>

        <div className="detail-row">
          <span className="label">Service</span>
          <span>{record.service_type__type_of_work}</span>
        </div>

        <div className="detail-row">
          <span className="label">PCS</span>
          {editing ? (
            <input
              type="number"
              min="1"
              value={form.pcs}
              onChange={(e) =>
                setForm({ ...form, pcs: e.target.value })
              }
            />
          ) : (
            <span>{record.pcs}</span>
          )}
        </div>

        <div className="detail-row">
          <span className="label">Rate</span>
          {editing ? (
            <input
              type="number"
              min="0"
              value={form.rate}
              onChange={(e) =>
                setForm({ ...form, rate: e.target.value })
              }
            />
          ) : (
            <span>₹ {record.rate}</span>
          )}
        </div>

        <div className="detail-row">
          <span className="label">Discount</span>
          {editing ? (
            <input
              type="number"
              min="0"
              value={form.discount}
              onChange={(e) =>
                setForm({ ...form, discount: e.target.value })
              }
            />
          ) : (
            <span>₹ {record.discount}</span>
          )}
        </div>

        <div className="detail-row">
          <span className="label">Amount</span>
          <span>₹ {record.amount}</span>
        </div>

        <div className="detail-row">
          <span className="label">Paid</span>
          <span>₹ {record.paid_amount}</span>
        </div>

        <div className="detail-row">
          <span className="label">Date</span>
          <span>{record.record_date}</span>
        </div>

        <div style={{ marginTop: 16 }}>
          {editing ? (
            <button onClick={save}>Save Changes</button>
          ) : (
            <button onClick={() => setEditing(true)}>
              Edit Record
            </button>
          )}
          <button className="danger" onClick={del} style={{ marginLeft: 8 }}>
            Delete
          </button>
        </div>
      </div>

      <button className="back" onClick={() => navigate("/records")}>
        ← Back to Records
      </button>
    </div>
  );
}
