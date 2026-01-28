import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import "./PartyDetail.css";



const MAX_LOGO = 10;
const MAX_TEXT = 255;

export default function PartyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [party, setParty] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    api.get(`/history/party/${id}/`)
      .then(res => {
        setParty(res.data);
        setForm(res.data);
      })
      .catch(() => setServerError("Failed to load party"));
  }, [id]);

  // -------- VALIDATION (UNCHANGED LOGIC) --------
  const validate = () => {
    const e = {};

    if (!form.logo || !form.logo.trim()) {
      e.logo = "Logo is required";
    } else if (form.logo.length > MAX_LOGO) {
      e.logo = "Max 10 characters";
    }

    if (!form.first_name || !form.first_name.trim()) {
      e.first_name = "First name is required";
    } else if (form.first_name.length > MAX_TEXT) {
      e.first_name = "Too long";
    }

    if (form.last_name && form.last_name.length > MAX_TEXT) {
      e.last_name = "Too long";
    }

    if (form.number && form.number.length > MAX_TEXT) {
      e.number = "Too long";
    }

    if (form.email && form.email.length > MAX_TEXT) {
      e.email = "Too long";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // -------- SAVE --------
  const handleSave = async () => {
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
      const res = await api.put(`/history/party/${id}/`, payload);
      setParty(res.data);
      setForm(res.data);
      setEditing(false);
      setErrors({});
    } catch {
      setServerError("Failed to update party");
    }
  };

  // -------- DELETE --------
  const handleDelete = async () => {
    if (!window.confirm("Delete this party?")) return;
    try {
      await api.delete(`/history/party/${id}/`);
      navigate("/parties");
    } catch {
      alert("Cannot delete party");
    }
  };

  if (serverError && !party) return <p>{serverError}</p>;
  if (!party) return <p>Loading...</p>;

  const Field = ({ label, name, max }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: "#555" }}>{label}</div>
      {editing ? (
        <>
          <input
            value={form[name] || ""}
            maxLength={max || undefined}
            onChange={e => setForm({ ...form, [name]: e.target.value })}
            style={{
              width: "100%",
              padding: 8,
              fontSize: 14,
            }}
          />
          {errors[name] && (
            <div style={{ color: "red", fontSize: 12 }}>
              {errors[name]}
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 15 }}>{party[name]}</div>
      )}
    </div>
  );

  return (
    <div className="party-detail-page">
      <div className="party-card">
        {serverError && (
          <div className="party-error">{serverError}</div>
        )}

        <div className="party-grid">
          {[
            ["First name", "first_name", MAX_TEXT],
            ["Last name", "last_name", MAX_TEXT],
            ["Logo", "logo", MAX_LOGO],
            ["Phone", "number", MAX_TEXT],
            ["Email", "email", MAX_TEXT],
            ["Address", "address", null],
          ].map(([label, field, max]) => (
            <div key={field}>
              <div className="party-label">{label}</div>
              {editing ? (
                <>
                  <input
                    className="party-input"
                    name={field}
                    maxLength={max || undefined}
                    value={form[field] || ""}
                    onChange={(e) =>
                      setForm({ ...form, [field]: e.target.value })
                    }
                  />
                  {errors[field] && (
                    <div className="party-error">{errors[field]}</div>
                  )}
                </>
              ) : (
                <div className="party-value">{party[field]}</div>
              )}
            </div>
          ))}

          <div>
            <div className="party-label">Due</div>
            <div className="party-value">{party.due}</div>
          </div>

          <div>
            <div className="party-label">Advance</div>
            <div className="party-value">{party.advance_balance}</div>
          </div>
        </div>

        <div className="party-actions">
          {editing ? (
            <>
              <button className="party-edit" onClick={handleSave}>
                Save
              </button>
              <button
                className="party-cancel"
                onClick={() => {
                  setForm(party);
                  setErrors({});
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="party-edit"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
              <button
                className="party-delete"
                onClick={handleDelete}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="party-back">
        <button onClick={() => navigate("/parties")}>
          ← Back to Parties
        </button>
      </div>
    </div>
  );

}