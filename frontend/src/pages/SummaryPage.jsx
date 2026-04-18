import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { loadParties } from "../api/parties.js";
import { getSummary } from "../api/summary.js";
import Navbar from "../components/Navbar.jsx";
import PaginationControls from "../components/PaginationControls.jsx";
import useTitle from "../utils/useTitle.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: "record", label: "Records", subject: "HALLMARK RECORD STATEMENT" },
  {
    value: "payment",
    label: "Payments",
    subject: "PAYMENT COLLECTION STATEMENT",
  },
  {
    value: "advance_ledger",
    label: "Advance Ledger",
    subject: "ADVANCE LEDGER STATEMENT",
  },
  { value: "audit_log", label: "Audit Trail", subject: "AUDIT ACTIVITY LOG" },
];

const PAGE_SIZE_OPTIONS = [20, 50, 100];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLocalDateValue(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function createInitialFilters() {
  const today = getLocalDateValue();
  return {
    type: "record",
    party: "all",
    party_id: "",
    date_from: `${today.slice(0, 7)}-01`,
    date_to: today,
    status: "",
    direction: "",
    model: "",
    action: "",
    page: 1,
    page_size: 20,
  };
}

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" && value.includes("T")) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string" && value.includes("-")) {
    const [y, mo, d] = value.split("-").map(Number);
    if (!y || !mo || !d) return null;
    return new Date(y, mo - 1, d);
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(value) {
  const date = parseDateValue(value);
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatStatementDate(value = new Date()) {
  const date = parseDateValue(value) ?? new Date();
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

function formatCurrency(value) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isFinite(n) ? n : 0);
}

function getTypeMeta(type) {
  return TYPE_OPTIONS.find((o) => o.value === type) ?? TYPE_OPTIONS[0];
}

function getPeriodCaption(dateFrom, dateTo) {
  if (dateFrom && dateTo)
    return `${formatDate(dateFrom)} to ${formatDate(dateTo)}`;
  if (dateFrom) return `Starting ${formatDate(dateFrom)}`;
  if (dateTo) return `Up to ${formatDate(dateTo)}`;
  return "No date range selected";
}

function formatPartyName(party) {
  if (!party) return "";
  return (
    party.full_name ||
    [party.first_name, party.last_name].filter(Boolean).join(" ").trim() ||
    `Party #${party.id}`
  );
}

function getScopeLabel(filters, selectedParty) {
  if (filters.party !== "single") return "All parties";
  return formatPartyName(selectedParty) || "Selected party";
}

function getSummaryRows(type, data) {
  if (!data) return [];
  return type === "record" || type === "payment"
    ? (data.result ?? [])
    : (data.results ?? []);
}

function getPaginationInfo(data, fallbackPageSize) {
  const p = data?.pagination ?? {};
  const total = p.total ?? 0;
  const pageSize = Number(p.page_size ?? fallbackPageSize ?? 20) || 20;
  const currentPage = Number(p.page ?? 1) || 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { total, pageSize, currentPage, totalPages };
}

function getAuditChangedFields(row) {
  const before =
    row?.before && typeof row.before === "object" ? row.before : {};
  const after = row?.after && typeof row.after === "object" ? row.after : {};
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  const changed = keys.filter(
    (k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]),
  );
  return changed.length ? changed.join(", ") : "N/A";
}

function getTableColumns(type) {
  if (type === "record")
    return [
      { label: "Sr.", render: (_, i) => i + 1 },
      { label: "Date", render: (r) => formatDate(r.record_date) },
      {
        label: "Party",
        render: (r) =>
          [r.first_name, r.last_name].filter(Boolean).join(" ") || "N/A",
      },
      { label: "Pcs", render: (r) => r.pcs ?? 0 },
      { label: "Rate", render: (r) => formatCurrency(r.rate) },
      { label: "Amount", render: (r) => formatCurrency(r.amount) },
      { label: "Discount", render: (r) => formatCurrency(r.discount) },
      { label: "Paid", render: (r) => formatCurrency(r.paid_amount) },
      { label: "Remaining", render: (r) => formatCurrency(r.remaining_amount) },
    ];

  if (type === "payment")
    return [
      { label: "Sr.", render: (_, i) => i + 1 },
      { label: "Date", render: (r) => formatDate(r.payment_date) },
      {
        label: "Party",
        render: (r) =>
          [r.first_name, r.last_name].filter(Boolean).join(" ") || "N/A",
      },
      { label: "Amount", render: (r) => formatCurrency(r.amount) },
    ];

  if (type === "advance_ledger")
    return [
      { label: "Sr.", render: (_, i) => i + 1 },
      { label: "Date", render: (r) => formatDate(r.created_at) },
      {
        label: "Party",
        render: (r) =>
          [r.first_name, r.last_name].filter(Boolean).join(" ") || "N/A",
      },
      { label: "Flow", render: (r) => r.direction || "N/A" },
      { label: "Amount", render: (r) => formatCurrency(r.amount) },
      { label: "Balance", render: (r) => formatCurrency(r.remaining_amount) },
      {
        label: "Payment",
        render: (r) =>
          r.payment_id
            ? `${formatDate(r.payment_date)} / ${formatCurrency(r.payment_amount)}`
            : "N/A",
      },
      {
        label: "Record",
        render: (r) =>
          r.record_id
            ? `${formatDate(r.record_date)} / ${r.record_pcs ?? 0} pcs`
            : "N/A",
      },
      { label: "Service", render: (r) => r.record_type_of_work || "N/A" },
    ];

  return [
    { label: "Sr.", render: (_, i) => i + 1 },
    { label: "Date", render: (r) => formatDate(r.created_at) },
    { label: "Model", render: (r) => r.model_name || "N/A" },
    { label: "Action", render: (r) => r.action || "N/A" },
    { label: "Object ID", render: (r) => r.object_id || "N/A" },
    { label: "Changed Fields", render: (r) => getAuditChangedFields(r) },
  ];
}

function getSummaryMetrics(type, summary = {}) {
  if (type === "record")
    return [
      { label: "Total records", value: summary.total_record ?? 0 },
      { label: "Total pieces", value: summary.total_pcs ?? 0 },
      { label: "Total amount", value: formatCurrency(summary.total_amount) },
      { label: "Unpaid", value: formatCurrency(summary.unpaid_amount) },
    ];
  if (type === "payment")
    return [
      { label: "Total payments", value: summary.total_payments ?? 0 },
      { label: "Amount collected", value: formatCurrency(summary.total_paid) },
    ];
  if (type === "advance_ledger")
    return [
      { label: "Total IN", value: formatCurrency(summary.total_in) },
      { label: "Total OUT", value: formatCurrency(summary.total_out) },
      { label: "Net balance", value: formatCurrency(summary.net_balance) },
    ];
  return [{ label: "Total logs", value: summary.total_logs ?? 0 }];
}

function makeSafeFilename(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function downloadCsv(columns, rows, filename) {
  const encode = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = columns.map((c) => encode(c.label)).join(",");
  const lines = rows.map((r, i) =>
    columns.map((c) => encode(c.render(r, i))).join(","),
  );
  const blob = new Blob([[header, ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCards({ items }) {
  return (
    <div className="summary-metric-grid">
      {items.map((item) => (
        <div key={item.label} className="summary-metric-card">
          <span className="summary-metric-card__label">{item.label}</span>
          <strong className="summary-metric-card__value">{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function ReportTable({ columns, rows }) {
  if (!rows.length)
    return (
      <p style={{ color: "var(--text-muted)", padding: "1rem 0" }}>
        No data found for these filters.
      </p>
    );

  return (
    <div className="summary-table-wrap">
      <table className="summary-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.label}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i}>
              {columns.map((c) => (
                <td key={c.label}>{c.render(row, i)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SummaryPage() {
  useTitle("Summary");

  const [draftFilters, setDraftFilters] = useState(createInitialFilters);
  const [activeFilters, setActiveFilters] = useState(null);
  const reportRef = useRef(null);

  const { data: parties = [], isLoading: isPartiesLoading } = useQuery({
    queryKey: ["summary-parties"],
    queryFn: () =>
      loadParties({ page_size: 1000 }).then((r) => r.results ?? []),
    placeholderData: (prev) => prev,
  });

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["summary", activeFilters],
    queryFn: () => getSummary(activeFilters),
    enabled: activeFilters !== null,
    placeholderData: (prev) => prev,
  });

  const activeParty = parties.find(
    (p) => String(p.id) === String(activeFilters?.party_id),
  );
  const typeMeta = getTypeMeta(activeFilters?.type ?? draftFilters.type);
  const rows = getSummaryRows(activeFilters?.type, data);
  const columns = getTableColumns(activeFilters?.type ?? draftFilters.type);
  const metrics = getSummaryMetrics(activeFilters?.type, data?.summary);
  const paginationInfo = getPaginationInfo(
    data,
    activeFilters?.page_size ?? 20,
  );
  const serviceBreakdown = data?.summary?.service_type_summary ?? [];

  const fileBase = makeSafeFilename(
    `${typeMeta.label}-${getScopeLabel(activeFilters ?? draftFilters, activeParty)}-${getLocalDateValue()}`,
  );

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: () => fileBase,
    pageStyle: `
      @page { size: A4 portrait; margin: 14mm; }
      @media print {
        body { background: #fff !important; }
        .no-print { display: none !important; }
        .summary-report {
          min-height: calc(297mm - 28mm);
          display: flex !important;
          flex-direction: column !important;
          box-shadow: none !important;
          border: none !important;
        }
      }
    `,
  });

  function updateDraft(key, value) {
    setDraftFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

  function handleGenerate() {
    setActiveFilters({ ...draftFilters, page: 1 });
  }

  function handleReset() {
    setDraftFilters(createInitialFilters());
    setActiveFilters(null);
  }

  function handlePageChange(nextPage) {
    const updated = { ...activeFilters, page: nextPage };
    setActiveFilters(updated);
    setDraftFilters(updated);
  }

  return (
    <div className="page-shell">
      <Navbar />

      <main className="content-shell">
        <div className="stack-layout">
          {/* Page header */}
          <section className="section-card section-card--padded no-print">
            <p className="section-kicker">Summary Studio</p>
            <h1 className="section-title">Printable period statements</h1>
            <p className="section-copy">
              Adjust filters, generate the report, then print or export.
            </p>
          </section>

          <div className="summary-layout">
            {/* ── Sidebar ── */}
            <aside className="summary-sidebar no-print">
              <section className="section-card section-card--padded">
                <p className="section-kicker">Filters</p>

                <div className="summary-filter-grid">
                  <label className="form-field">
                    <span className="form-label">Report type</span>
                    <select
                      className="app-select"
                      value={draftFilters.type}
                      onChange={(e) =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          type: e.target.value,
                          status: "",
                          direction: "",
                          model: "",
                          action: "",
                          page: 1,
                        }))
                      }
                    >
                      {TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span className="form-label">Party scope</span>
                    <select
                      className="app-select"
                      value={draftFilters.party}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDraftFilters((prev) => ({
                          ...prev,
                          party: v,
                          party_id: v === "all" ? "" : prev.party_id,
                          page: 1,
                        }));
                      }}
                    >
                      <option value="all">All parties</option>
                      <option value="single">Single party</option>
                    </select>
                  </label>

                  {draftFilters.party === "single" && (
                    <label className="form-field form-field--wide">
                      <span className="form-label">Party</span>
                      <select
                        className="app-select"
                        value={draftFilters.party_id}
                        disabled={isPartiesLoading}
                        onChange={(e) =>
                          updateDraft("party_id", e.target.value)
                        }
                      >
                        <option value="">
                          {isPartiesLoading ? "Loading..." : "Choose a party"}
                        </option>
                        {parties.map((p) => (
                          <option key={p.id} value={p.id}>
                            {formatPartyName(p)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <label className="form-field">
                    <span className="form-label">From date</span>
                    <input
                      className="app-input"
                      type="date"
                      value={draftFilters.date_from}
                      onChange={(e) => updateDraft("date_from", e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span className="form-label">To date</span>
                    <input
                      className="app-input"
                      type="date"
                      value={draftFilters.date_to}
                      onChange={(e) => updateDraft("date_to", e.target.value)}
                    />
                  </label>

                  {draftFilters.type === "record" && (
                    <label className="form-field">
                      <span className="form-label">Payment status</span>
                      <select
                        className="app-select"
                        value={draftFilters.status}
                        onChange={(e) => updateDraft("status", e.target.value)}
                      >
                        <option value="">All</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                      </select>
                    </label>
                  )}

                  {draftFilters.type === "advance_ledger" && (
                    <label className="form-field">
                      <span className="form-label">Direction</span>
                      <select
                        className="app-select"
                        value={draftFilters.direction}
                        onChange={(e) =>
                          updateDraft("direction", e.target.value)
                        }
                      >
                        <option value="">All</option>
                        <option value="IN">IN</option>
                        <option value="OUT">OUT</option>
                      </select>
                    </label>
                  )}

                  {draftFilters.type === "audit_log" && (
                    <>
                      <label className="form-field">
                        <span className="form-label">Model</span>
                        <input
                          className="app-input"
                          type="text"
                          placeholder="Record, Payment…"
                          value={draftFilters.model}
                          onChange={(e) => updateDraft("model", e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span className="form-label">Action</span>
                        <input
                          className="app-input"
                          type="text"
                          placeholder="CREATE, UPDATE…"
                          value={draftFilters.action}
                          onChange={(e) =>
                            updateDraft("action", e.target.value)
                          }
                        />
                      </label>
                    </>
                  )}

                  <label className="form-field">
                    <span className="form-label">Rows per page</span>
                    <select
                      className="app-select"
                      value={draftFilters.page_size}
                      onChange={(e) =>
                        updateDraft("page_size", Number(e.target.value))
                      }
                    >
                      {PAGE_SIZE_OPTIONS.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="section-actions summary-panel-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleGenerate}
                    disabled={isFetching}
                  >
                    {isFetching ? "Generating…" : "Generate Report"}
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                </div>
              </section>

              {/* Export — only after report generated */}
              {data && (
                <section className="section-card section-card--padded">
                  <p className="section-kicker">Export</p>
                  <div className="summary-export-stack">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={handlePrint}
                    >
                      Print / Save PDF
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        downloadCsv(columns, rows, `${fileBase}.csv`)
                      }
                    >
                      Download CSV
                    </button>
                  </div>
                  <p className="summary-note">
                    Choose <strong>Save as PDF</strong> in the print dialog for
                    a clean export.
                  </p>
                </section>
              )}

              {/* Metrics — only after report generated */}
              {data && (
                <section className="section-card section-card--padded">
                  <p className="section-kicker">Snapshot</p>
                  <MetricCards items={metrics} />
                </section>
              )}
            </aside>

            {/* ── Report area ── */}
            <section className="summary-main">
              {!activeFilters && (
                <div className="section-card section-card--padded summary-state-card">
                  <h2 className="summary-state-card__title">
                    No report generated yet
                  </h2>
                  <p className="summary-state-card__copy">
                    Set your filters and click Generate Report.
                  </p>
                </div>
              )}

              {activeFilters && isLoading && !data && (
                <div className="section-card section-card--padded summary-state-card">
                  <h2 className="summary-state-card__title">
                    Building your report…
                  </h2>
                </div>
              )}

              {activeFilters && isError && !data && (
                <div className="section-card section-card--padded summary-state-card">
                  <h2 className="summary-state-card__title">
                    Could not load report
                  </h2>
                  <p className="summary-state-card__copy">
                    {error?.message || "Please try different filters."}
                  </p>
                </div>
              )}

              {activeFilters && data && (
                <>
                  <article
                    ref={reportRef}
                    className="section-card section-card--padded summary-report"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      minHeight: "70vh",
                    }}
                  >
                    {/* Report title */}
                    <div
                      style={{
                        marginBottom: "1.5rem",
                        borderBottom: "2px solid #1e3a5f",
                        paddingBottom: "1rem",
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          textAlign: "center",
                          fontSize: "1rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--heading)",
                        }}
                      >
                        {typeMeta.subject}
                      </h2>
                      <p
                        style={{
                          margin: "0.5rem 0 0",
                          textAlign: "center",
                          color: "var(--text-muted)",
                          fontSize: "0.88rem",
                        }}
                      >
                        {getPeriodCaption(
                          activeFilters.date_from,
                          activeFilters.date_to,
                        )}
                        {" · "}
                        {getScopeLabel(activeFilters, activeParty)}
                      </p>
                    </div>

                    {/* Service breakdown for records and payments */}
                    {(activeFilters.type === "record" ||
                      activeFilters.type === "payment") &&
                      serviceBreakdown.length > 0 && (
                        <section
                          className="summary-service-breakdown"
                          style={{ marginBottom: "1rem" }}
                        >
                          <div className="summary-service-breakdown__header">
                            <h3>Service-wise breakdown</h3>
                            <span>
                              {activeFilters.type === "payment"
                                ? "Collected amount grouped by service"
                                : "Work summary grouped by service"}
                            </span>
                          </div>

                          <div className="summary-service-breakdown__grid">
                            {serviceBreakdown.map((s, index) => (
                              <div
                                key={`${s.service_type__type_of_work || "service"}-${index}`}
                                className="summary-service-pill"
                              >
                                <strong>
                                  {s.service_type__type_of_work || "Unknown"}
                                </strong>
                                <span>{s.total_pcs ?? 0} pcs</span>
                                {activeFilters.type === "payment" && (
                                  <span>{formatCurrency(s.total_amount)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                    {/* Row count strip */}
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        marginBottom: "0.75rem",
                        fontSize: "0.82rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      <span>
                        Showing {rows.length} of {paginationInfo.total} records
                      </span>
                      <span>
                        Page {paginationInfo.currentPage} /{" "}
                        {paginationInfo.totalPages}
                      </span>
                    </div>

                    {/* Table */}
                    <ReportTable columns={columns} rows={rows} />

                    {/* Footer — pushed to bottom of page */}
                    <div
                      style={{
                        marginTop: "auto",
                        paddingTop: "2rem",
                        borderTop: "1px solid var(--border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        fontSize: "0.84rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      <span>
                        Generated on {formatStatementDate(new Date())}
                      </span>
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            width: "180px",
                            borderBottom: "1.5px solid var(--heading)",
                            marginBottom: "0.35rem",
                          }}
                        />
                        <span
                          style={{
                            color: "var(--heading)",
                            fontWeight: 600,
                            fontSize: "0.82rem",
                          }}
                        >
                          Authorized Signatory
                        </span>
                      </div>
                    </div>
                  </article>

                  {/* Pagination */}
                  <div className="no-print">
                    <PaginationControls
                      page={paginationInfo.currentPage}
                      totalPages={paginationInfo.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
