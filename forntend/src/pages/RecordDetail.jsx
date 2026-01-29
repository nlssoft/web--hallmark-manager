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
      <header className="records-header">
        <h1>Record Detail</h1>
        <p>View and update record information</p>
      </header>

      <div className="card record-detail-card">
        <div className="record-detail-grid">
          <Detail label="Party">
            {record.party__logo}
          </Detail>

          <Detail label="Service">
            {record.service_type__type_of_work}
          </Detail>

          <Detail label="Pieces">
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
              record.pcs
            )}
          </Detail>

          <Detail label="Rate">
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
              `₹ ${record.rate}`
            )}
          </Detail>

          <Detail label="Discount">
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
              `₹ ${record.discount}`
            )}
          </Detail>

          <Detail label="Total Amount">
            ₹ {record.amount}
          </Detail>

          <Detail label="Paid Amount">
            ₹ {record.paid_amount}
          </Detail>

          <Detail label="Record Date">
            {record.record_date}
          </Detail>
        </div>

        <div className="detail-actions">
          {editing ? (
            <>
              <button className="primary" onClick={save}>
                Save Changes
              </button>
              <button
                className="secondary"
                onClick={() => {
                  setForm(record);
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="primary"
                onClick={() => setEditing(true)}
              >
                Edit Record
              </button>
              <button className="danger" onClick={del}>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bottom-actions">
        <button onClick={() => navigate("/records")}>
          ← Back to Records
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
