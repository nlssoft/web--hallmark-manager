import { useEffect, useState } from "react";
import API from "../api/client";

const initialForm = {
  party: "",
  service_type: "",
  pcs: "",
  discount: "0",
  rate: "",
  rate_mode: "system",
  record_date: "",
};

export default function RecordsPage() {
  const [records, setRecords] = useState([]);
  const [parties, setParties] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadRecords = async () => {
    const response = await API.get("/history/record/");
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  };

  const loadDependencies = async () => {
    const [recordsRes, partiesRes, servicesRes] = await Promise.all([
      loadRecords(),
      API.get("/history/party/"),
      API.get("/history/service-type/"),
    ]);

    const parsedParties = Array.isArray(partiesRes.data)
      ? partiesRes.data
      : partiesRes.data.results || [];
    const parsedServices = Array.isArray(servicesRes.data)
      ? servicesRes.data
      : servicesRes.data.results || [];

    setRecords(recordsRes);
    setParties(parsedParties);
    setServiceTypes(parsedServices);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError("");
      try {
        await loadDependencies();
      } catch {
        setError("Failed to load records.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        party: Number(form.party),
        service_type: Number(form.service_type),
        pcs: Number(form.pcs),
        discount: Number(form.discount || 0),
      };
      if (payload.rate_mode === "system") {
        delete payload.rate;
      } else {
        payload.rate = Number(form.rate);
      }
      await API.post("/history/record/", payload);
      setForm(initialForm);
      const freshRecords = await loadRecords();
      setRecords(freshRecords);
    } catch (requestError) {
      const detail = requestError.response?.data?.detail;
      setError(detail || "Failed to create record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="section-header">
        <h1>Records</h1>
      </div>
      {error && <p className="error-text">{error}</p>}

      <form className="card form-grid" onSubmit={onCreate}>
        <h2>Create Record</h2>
        <div className="split-grid">
          <label>
            Party
            <select name="party" value={form.party} onChange={onChange} required>
              <option value="">Select party</option>
              {parties.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.first_name} {party.last_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Service Type
            <select
              name="service_type"
              value={form.service_type}
              onChange={onChange}
              required
            >
              <option value="">Select service</option>
              {serviceTypes.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.type_of_work}
                </option>
              ))}
            </select>
          </label>
          <label>
            PCS
            <input name="pcs" type="number" min="1" value={form.pcs} onChange={onChange} required />
          </label>
          <label>
            Record Date
            <input
              name="record_date"
              type="date"
              value={form.record_date}
              onChange={onChange}
              required
            />
          </label>
          <label>
            Rate Mode
            <select name="rate_mode" value={form.rate_mode} onChange={onChange}>
              <option value="system">System</option>
              <option value="manual">Manual</option>
            </select>
          </label>
          <label>
            Rate
            <input
              name="rate"
              type="number"
              min="0"
              step="0.01"
              value={form.rate}
              onChange={onChange}
              disabled={form.rate_mode === "system"}
              required={form.rate_mode === "manual"}
            />
          </label>
          <label>
            Discount
            <input
              name="discount"
              type="number"
              min="0"
              step="0.01"
              value={form.discount}
              onChange={onChange}
            />
          </label>
        </div>
        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Create Record"}
        </button>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Party</th>
              <th>Service</th>
              <th>Date</th>
              <th>PCS</th>
              <th>Rate</th>
              <th>Amount</th>
              <th>Paid</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7">Loading records...</td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan="7">No records found.</td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id}>
                  <td>{`${record.party__first_name || ""} ${record.party__last_name || ""}`}</td>
                  <td>{record.service_type__type_of_work || "-"}</td>
                  <td>{record.record_date || "-"}</td>
                  <td>{record.pcs}</td>
                  <td>{record.rate}</td>
                  <td>{record.amount}</td>
                  <td>{record.paid_amount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
