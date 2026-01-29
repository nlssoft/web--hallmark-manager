import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import "./WorkRates.css";

export default function WorkRates() {
  const navigate = useNavigate();

  const [rates, setRates] = useState([]);
  const [parties, setParties] = useState([]);
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    party: "",
    service_type: "",
    rate: "",
  });

  const [partyQuery, setPartyQuery] = useState("");
  const [showPartyList, setShowPartyList] = useState(false);

  useEffect(() => {
    api.get("/history/work-rate/").then(res => setRates(res.data));
    api.get("/history/party/").then(res => setParties(res.data));
    api.get("/history/service-type/").then(res => setServices(res.data));
  }, []);

  const filteredParties = parties.filter(p =>
    `${p.first_name} ${p.last_name} ${p.logo}`
      .toLowerCase()
      .includes(partyQuery.toLowerCase())
  );

  const submit = async (e) => {
    e.preventDefault();

    await api.post("/history/work-rate/", {
      party: form.party,
      service_type: form.service_type,
      rate: form.rate,
    });

    setForm({ party: "", service_type: "", rate: "" });
    setPartyQuery("");

    const res = await api.get("/history/work-rate/");
    setRates(res.data);
  };

  const filteredRates = rates.filter(r =>
    `${r.party__first_name} ${r.party__last_name} ${r.party__logo}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="wr-page">
      <header className="wr-header">
        <h1>Work Rates</h1>
        <p>Rates per party and service</p>
      </header>

      {/* CREATE */}
      <form className="wr-card wr-form" onSubmit={submit}>
        <div className="autocomplete">
          <input
            placeholder="Select party"
            value={partyQuery}
            onChange={e => {
              setPartyQuery(e.target.value);
              setShowPartyList(true);
            }}
            onFocus={() => setShowPartyList(true)}
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

        <select
          value={form.service_type}
          onChange={e => setForm({ ...form, service_type: e.target.value })}
          required
        >
          <option value="">Select service</option>
          {services.map(s => (
            <option key={s.id} value={s.id}>
              {s.type_of_work}
            </option>
          ))}
        </select>

        <input
          placeholder="Rate"
          type="number"
          step="0.01"
          value={form.rate}
          onChange={e => setForm({ ...form, rate: e.target.value })}
          required
        />

        <button type="submit">Create Rate</button>
      </form>

      {/* SEARCH */}
      <input
        className="wr-search"
        placeholder="Search by name or logo"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* LIST */}
      <div className="wr-list">
        {filteredRates.map(r => (
          <div key={r.id} className="wr-row">
            <div>
              <strong>{r.party__logo}</strong>
              <div className="muted">
                {r.party__first_name} {r.party__last_name}
              </div>
            </div>

            <div className="rate">₹ {r.rate}</div>

            <Link to={`/work-rates/${r.id}`} className="view">
              View
            </Link>
          </div>
        ))}
      </div>

      <div className="bottom-actions">
        <button onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
