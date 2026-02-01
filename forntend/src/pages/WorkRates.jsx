import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./WorkRates.css";

export default function WorkRates() {
  const navigate = useNavigate();

  const [rates, setRates] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    const res = await api.get("/history/work-rate/");
    setRates(res.data || []);
  };

  const filteredRates = rates.filter((r) =>
    `${r.party__logo} ${r.party__first_name} ${r.party__last_name} ${r.party__address}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="workrates-page">
      <header className="workrates-header">
        <h1>Work Rates</h1>
        <p>Rates per party and service</p>
      </header>

      <input
        className="search-input"
        placeholder="Search by name, logo or address"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredRates.map((r) => (
        <div key={r.id} className="rate-row">
          <div className="party-info">
            <strong>{r.party__logo}</strong>

            <div className="party-name">
              {r.party__first_name} {r.party__last_name}
            </div>

            <div className="party-address">
              {r.party__address}
            </div>
          </div>

          <div className="rate-right">
            <div className="rate-amount">₹ {r.rate}</div>
            <Link to={`/work-rates/${r.id}`}>View</Link>
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
