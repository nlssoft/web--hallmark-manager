import { useEffect, useState } from "react";
import API from "../api/client";
import StatCard from "../components/StatCard";

export default function DashboardPage() {
  const [type, setType] = useState("record");
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await API.get("/history/summary/", {
          params: { type },
        });
        setSummary(response.data.summary || {});
        setRows(response.data.result || response.data.results || []);
      } catch {
        setError("Failed to load summary.");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [type]);

  const cards = Object.entries(summary || {}).filter(
    ([key, value]) => typeof value !== "object" && typeof value !== "undefined"
  );

  return (
    <section>
      <div className="section-header">
        <h1>Dashboard</h1>
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="record">Record</option>
          <option value="payment">Payment</option>
          <option value="advance_ledger">Advance Ledger</option>
          <option value="audit_log">Audit Log</option>
        </select>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>Loading dashboard...</p>
      ) : (
        <>
          <div className="stats-grid">
            {cards.length === 0 && <p>No summary data available.</p>}
            {cards.map(([label, value]) => (
              <StatCard key={label} label={label} value={String(value)} />
            ))}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {rows[0] ? (
                    Object.keys(rows[0]).map((key) => <th key={key}>{key}</th>)
                  ) : (
                    <th>Result</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td>No rows</td>
                  </tr>
                ) : (
                  rows.slice(0, 10).map((row, index) => (
                    <tr key={row.id || index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i}>{String(value ?? "")}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
