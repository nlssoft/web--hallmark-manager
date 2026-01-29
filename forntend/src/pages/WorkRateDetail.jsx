import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./WorkRates.css";

export default function WorkRateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rate, setRate] = useState(null);
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/history/work-rate/${id}/`)
      .then(res => {
        setRate(res.data);
        setValue(res.data.rate);
      })
      .catch(() => setError("Failed to load rate"));
  }, [id]);

  const save = async () => {
    try {
      const res = await api.put(`/history/work-rate/${id}/`, {
        ...rate,
        rate: value
      });
      setRate(res.data);
      setEditing(false);
    } catch {
      setError("Update failed");
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this rate?")) return;
    await api.delete(`/history/work-rate/${id}/`);
    navigate("/work-rates");
  };

  if (!rate) return <p className="muted">Loading...</p>;

  return (
    <div className="wr-page">
      <h1>Work Rate</h1>

      <div className="wr-card">
        <h3>
          {rate.party__logo} — {rate.party__first_name} {rate.party__last_name}
        </h3>

        {editing ? (
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={e => setValue(e.target.value)}
          />
        ) : (
          <div className="rate big">₹ {rate.rate}</div>
        )}

        {error && <div className="error">{error}</div>}

        <div className="actions">
          {editing ? (
            <>
              <button onClick={save}>Save</button>
              <button onClick={() => setEditing(false)}>Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)}>Edit</button>
              <button className="danger" onClick={remove}>Delete</button>
            </>
          )}
        </div>
      </div>

      <div className="bottom-actions">
        <button onClick={() => navigate("/work-rates")}>
          ← Back to Work Rates
        </button>
      </div>
    </div>
  );
}
