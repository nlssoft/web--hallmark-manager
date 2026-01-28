import { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";

export default function Parties() {
  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);

    api.get("/history/party/", {
      params: search
        ? {
            first_name: search,
            last_name: search,
            logo: search,
          }
        : {},
    })
      .then(res => setParties(res.data))
      .catch(() => setError("Failed to load parties"))
      .finally(() => setLoading(false));
  }, [search]);

  if (loading) return <p>Loading parties...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ display: "flex", gap: "24px" }}>
      
      {/* LEFT: Create */}
      <div style={{ width: "280px" }}>
        <Link to="/parties/create">
          <button>Create Party</button>
        </Link>
      </div>

      {/* RIGHT: List */}
      <div style={{ flex: 1 }}>
        <h1>Parties</h1>

        <input
          placeholder="Search by name or logo"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: "12px", width: "300px" }}
        />

        <table border="1" cellPadding="8" width="100%">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Name</th>
              <th>Address</th>
              <th>Due</th>
              <th>Advance</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {parties.map(p => (
              <tr key={p.id}>
                <td>{p.logo}</td>
                <td>{p.first_name} {p.last_name}</td>
                <td>{p.address || "-"}</td>
                <td>{p.due}</td>
                <td>{p.advance_balance}</td>
                <td>
                  <Link to={`/parties/${p.id}`}>
                    <button>View</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
