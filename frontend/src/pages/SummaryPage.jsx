import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

import { loadParties } from "../api/parties.js";
import Navbar from "../components/Navbar.jsx";
import PaginationControls from "../components/PaginationControls.jsx";
import { useSummary } from "../hooks/useSummary.js";

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

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string" && value.includes("-")) {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value, options = {}) {
  const date = parseDateValue(value);
  if (!date) return "N/A";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
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
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function getTypeMeta(type) {
  return TYPE_OPTIONS.find((option) => option.value === type) ?? TYPE_OPTIONS[0];
}

function getHeadingPeriod(dateFrom, dateTo) {
  const from = parseDateValue(dateFrom);
  const to = parseDateValue(dateTo);

  if (from && to) {
    const sameMonth =
      from.getMonth() === to.getMonth() &&
      from.getFullYear() === to.getFullYear();

    if (sameMonth) {
      return `for ${new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
      }).format(from)}`;
    }

    return `from ${formatDate(from)} to ${formatDate(to)}`;
  }

  if (from) return `from ${formatDate(from)}`;
  if (to) return `up to ${formatDate(to)}`;
  return "overview";
}

function getPeriodCaption(dateFrom, dateTo) {
  if (dateFrom && dateTo) {
    return `${formatDate(dateFrom)} to ${formatDate(dateTo)}`;
  }

  if (dateFrom) return `Starting ${formatDate(dateFrom)}`;
  if (dateTo) return `Up to ${formatDate(dateTo)}`;
  return "No date range selected";
}

function formatPartyName(party) {
  if (!party) return "";

  return (
    party.full_name ||
    [party.first_name, party.last_name].filter(Boolean).join(" ").trim() ||
    party.logo ||
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
    ? data.result ?? []
    : data.results ?? [];
}

function getSummaryMetrics(type, summary = {}) {
  if (type === "record") {
    return [
      { label: "Total records", value: summary.total_record ?? 0 },
      { label: "Total pieces", value: summary.total_pcs ?? 0 },
      { label: "Total amount", value: formatCurrency(summary.total_amount) },
      { label: "Unpaid amount", value: formatCurrency(summary.unpaid_amount) },
    ];
  }

  if (type === "payment") {
    return [
      { label: "Total payments", value: summary.total_payments ?? 0 },
      { label: "Amount received", value: formatCurrency(summary.total_paid) },
    ];
  }

  if (type === "advance_ledger") {
    return [
      { label: "Total IN", value: formatCurrency(summary.total_in) },
      { label: "Total OUT", value: formatCurrency(summary.total_out) },
      { label: "Net balance", value: formatCurrency(summary.net_balance) },
    ];
  }

  return [{ label: "Total logs", value: summary.total_logs ?? 0 }];
}

function getRecordServiceBreakdown(data) {
  return data?.summary?.service_type_summary ?? [];
}

function getAuditChangedFields(row) {
  const before =
    row?.before && typeof row.before === "object" && !Array.isArray(row.before)
      ? row.before
      : {};
  const after =
    row?.after && typeof row.after === "object" && !Array.isArray(row.after)
      ? row.after
      : {};

  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  const changed = keys.filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );

  return changed.length ? changed.join(", ") : "N/A";
}

function getTableColumns(type) {
  if (type === "record") {
    return [
      { label: "Sr.", render: (_, index) => index + 1 },
      { label: "Date", render: (row) => formatDate(row.record_date) },
      {
        label: "Party",
        render: (row) =>
          [row.first_name, row.last_name].filter(Boolean).join(" ") || "N/A",
      },
      { label: "Pcs", render: (row) => row.pcs ?? 0 },
      { label: "Rate", render: (row) => formatCurrency(row.rate) },
      { label: "Amount", render: (row) => formatCurrency(row.amount) },
      { label: "Discount", render: (row) => formatCurrency(row.discount) },
      { label: "Paid", render: (row) => formatCurrency(row.paid_amount) },
      {
        label: "Remaining",
        render: (row) => formatCurrency(row.remaining_amount),
      },
    ];
  }

  if (type === "payment") {
    return [
      { label: "Sr.", render: (_, index) => index + 1 },
      { label: "Date", render: (row) => formatDate(row.payment_date) },
      {
        label: "Party",
        render: (row) =>
          [row.first_name, row.last_name].filter(Boolean).join(" ") || "N/A",
      },
      { label: "Amount", render: (row) => formatCurrency(row.amount) },
    ];
  }

  if (type === "advance_ledger") {
    return [
      { label: "Sr.", render: (_, index) => index + 1 },
      { label: "Date", render: (row) => formatDate(row.created_at) },
      {
        label: "Party",
        render: (row) =>
          [row.first_name, row.last_name].filter(Boolean).join(" ") || "N/A",
      },
      { label: "Flow", render: (row) => row.direction || "N/A" },
      { label: "Amount", render: (row) => formatCurrency(row.amount) },
      {
        label: "Balance",
        render: (row) => formatCurrency(row.remaining_amount),
      },
      {
        label: "Payment",
        render: (row) =>
          row.payment_id
            ? `${formatDate(row.payment_date)} / ${formatCurrency(row.payment_amount)}`
            : "N/A",
      },
      {
        label: "Record",
        render: (row) =>
          row.record_id
            ? `${formatDate(row.record_date)} / ${row.record_pcs ?? 0} pcs`
            : "N/A",
      },
      {
        label: "Service",
        render: (row) => row.record_type_of_work || "N/A",
      },
    ];
  }

  return [
    { label: "Sr.", render: (_, index) => index + 1 },
    { label: "Date", render: (row) => formatDate(row.created_at) },
    { label: "Model", render: (row) => row.model_name || "N/A" },
    { label: "Action", render: (row) => row.action || "N/A" },
    { label: "Object ID", render: (row) => row.object_id || "N/A" },
    {
      label: "Changed fields",
      render: (row) => getAuditChangedFields(row),
    },
  ];
}

function getNarrativeRows(type, data, filters, selectedParty) {
  const summary = data?.summary ?? {};
  const serviceBreakdown = getRecordServiceBreakdown(data);
  const serviceLine = serviceBreakdown.length
    ? serviceBreakdown
        .map(
          (service) =>
            `${service.service_type__type_of_work || "Unknown service"} ${service.total_pcs ?? 0} pcs`,
        )
        .join(" | ")
    : "No service-wise pieces recorded for this range.";

  if (type === "record") {
    return [
      { label: "Period", value: getPeriodCaption(filters.date_from, filters.date_to) },
      { label: "Party scope", value: getScopeLabel(filters, selectedParty) },
      { label: "Service-wise hallmark pieces", value: serviceLine },
      {
        label: "Billing snapshot",
        value: `${formatCurrency(summary.total_amount)} total billed, ${formatCurrency(summary.unpaid_amount)} still unpaid.`,
      },
    ];
  }

  if (type === "payment") {
    return [
      { label: "Period", value: getPeriodCaption(filters.date_from, filters.date_to) },
      { label: "Party scope", value: getScopeLabel(filters, selectedParty) },
      {
        label: "Collections captured",
        value: `${summary.total_payments ?? 0} payments worth ${formatCurrency(summary.total_paid)}.`,
      },
    ];
  }

  if (type === "advance_ledger") {
    return [
      { label: "Period", value: getPeriodCaption(filters.date_from, filters.date_to) },
      { label: "Party scope", value: getScopeLabel(filters, selectedParty) },
      {
        label: "Cash movement",
        value: `${formatCurrency(summary.total_in)} IN, ${formatCurrency(summary.total_out)} OUT, net ${formatCurrency(summary.net_balance)}.`,
      },
      {
        label: "Direction filter",
        value: filters.direction || "All entries",
      },
    ];
  }

  return [
    {
      label: "Scope",
      value: getScopeLabel(filters, selectedParty),
    },
    {
      label: "Model filter",
      value: filters.model || "All models",
    },
    {
      label: "Action filter",
      value: filters.action || "All actions",
    },
    {
      label: "Activity captured",
      value: `${summary.total_logs ?? 0} log entries in the current report page.`,
    },
  ];
}

function getActiveFilterBadges(filters, selectedParty) {
  const badges = [getTypeMeta(filters.type).label, getScopeLabel(filters, selectedParty)];

  if (filters.status) badges.push(`Status: ${filters.status}`);
  if (filters.direction) badges.push(`Direction: ${filters.direction}`);
  if (filters.model) badges.push(`Model: ${filters.model}`);
  if (filters.action) badges.push(`Action: ${filters.action}`);

  return badges;
}

function getPaginationInfo(data, fallbackPageSize) {
  const pagination = data?.pagination ?? {};
  const total = pagination.total ?? 0;
  const pageSize = Number(pagination.page_size ?? fallbackPageSize ?? 20) || 20;
  const currentPage = Number(pagination.page ?? 1) || 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { total, pageSize, currentPage, totalPages };
}

function makeSafeFilename(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatExportValue(value) {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function toCsv(columns, rows) {
  const encode = (value) => {
    const stringValue = formatExportValue(value).replaceAll('"', '""');
    return `"${stringValue}"`;
  };

  const headerLine = columns.map((column) => encode(column.label)).join(",");
  const dataLines = rows.map((row, index) =>
    columns.map((column) => encode(column.render(row, index))).join(","),
  );

  return [headerLine, ...dataLines].join("\n");
}

function SummaryMetricCards({ items }) {
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

function SummaryTable({ columns, rows }) {
  if (!rows.length) {
    return (
      <div className="summary-empty">
        No rows match the current filters for this report.
      </div>
    );
  }

  return (
    <div className="summary-table-wrap">
      <table className="summary-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.label}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? `${row.object_id ?? "row"}-${index}`}>
              {columns.map((column) => (
                <td key={column.label}>{column.render(row, index)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryStateCard({ title, copy }) {
  return (
    <section className="section-card section-card--padded summary-state-card">
      <h2 className="summary-state-card__title">{title}</h2>
      <p className="summary-state-card__copy">{copy}</p>
    </section>
  );
}

export default function SummaryPage() {
  const [filters, setFilters] = useState(createInitialFilters);
  const reportRef = useRef(null);

  const shouldLoadSummary =
    filters.party !== "single" || Boolean(filters.party_id);

  const { data, isLoading, isError, error, isFetching } = useSummary(
    filters,
    shouldLoadSummary,
  );

  const {
    data: parties = [],
    isLoading: isPartiesLoading,
    isError: isPartiesError,
    error: partiesError,
  } = useQuery({
    queryKey: ["summary-parties"],
    queryFn: () =>
      loadParties({ page_size: 1000 }).then((res) => res.results ?? []),
    placeholderData: (previousData) => previousData,
  });

  const selectedParty = parties.find(
    (party) => String(party.id) === String(filters.party_id),
  );
  const typeMeta = getTypeMeta(filters.type);
  const rows = getSummaryRows(filters.type, data);
  const metrics = getSummaryMetrics(filters.type, data?.summary);
  const columns = getTableColumns(filters.type);
  const narrativeRows = getNarrativeRows(
    filters.type,
    data,
    filters,
    selectedParty,
  );
  const badges = getActiveFilterBadges(filters, selectedParty);
  const serviceBreakdown = getRecordServiceBreakdown(data);
  const paginationInfo = getPaginationInfo(data, filters.page_size);
  const fileBase = makeSafeFilename(
    `${typeMeta.label}-${getScopeLabel(filters, selectedParty)}-${getLocalDateValue()}`,
  );

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: () => `${fileBase}-statement`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 14mm;
      }

      @media print {
        body {
          background: #ffffff !important;
        }
      }
    `,
  });

  function updateFilter(key, value) {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
      page: 1,
    }));
  }

  function handleTypeChange(nextType) {
    setFilters((previous) => ({
      ...previous,
      type: nextType,
      status: "",
      direction: "",
      model: "",
      action: "",
      page: 1,
    }));
  }

  function handleReset() {
    setFilters(createInitialFilters());
  }

  function handlePageChange(nextPage) {
    setFilters((previous) => ({
      ...previous,
      page: nextPage,
    }));
  }

  function handleDownloadJson() {
    const payload = {
      generated_at: new Date().toISOString(),
      title: `${typeMeta.label} ${getHeadingPeriod(filters.date_from, filters.date_to)}`,
      scope: getScopeLabel(filters, selectedParty),
      filters,
      summary: data?.summary ?? null,
      rows,
    };

    downloadFile(
      `${fileBase}.json`,
      JSON.stringify(payload, null, 2),
      "application/json",
    );
  }

  function handleDownloadCsv() {
    downloadFile(
      `${fileBase}.csv`,
      toCsv(columns, rows),
      "text/csv;charset=utf-8",
    );
  }

  return (
    <div className="page-shell">
      <Navbar />

      <main className="content-shell">
        <div className="stack-layout">
          <section className="section-card section-card--padded summary-hero">
            <div className="summary-hero__copy-block">
              <p className="section-kicker">Summary Studio</p>
              <h1 className="section-title">Printable period statements</h1>
              <p className="section-copy">
                Build polished record, payment, advance and audit statements
                from the same filter panel, then print them or save the current
                page as PDF, CSV or JSON.
              </p>
            </div>

            <div className="summary-badge-row">
              {badges.map((badge) => (
                <span key={badge} className="summary-chip">
                  {badge}
                </span>
              ))}
              {isFetching && <span className="summary-chip">Refreshing...</span>}
            </div>
          </section>

          {isPartiesError && (
            <SummaryStateCard
              title="Could not load parties"
              copy={partiesError?.message || "Please try refreshing the page."}
            />
          )}

          <div className="summary-layout">
            <aside className="summary-sidebar">
              <section className="section-card section-card--padded">
                <p className="section-kicker">Filters</p>

                <div className="summary-filter-grid">
                  <label className="form-field">
                    <span className="form-label">Report type</span>
                    <select
                      className="app-select"
                      value={filters.type}
                      onChange={(event) => handleTypeChange(event.target.value)}
                    >
                      {TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span className="form-label">Party scope</span>
                    <select
                      className="app-select"
                      value={filters.party}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setFilters((previous) => ({
                          ...previous,
                          party: nextValue,
                          party_id: nextValue === "all" ? "" : previous.party_id,
                          page: 1,
                        }));
                      }}
                    >
                      <option value="all">All parties</option>
                      <option value="single">Single party</option>
                    </select>
                  </label>

                  {filters.party === "single" && (
                    <label className="form-field form-field--wide">
                      <span className="form-label">Party</span>
                      <select
                        className="app-select"
                        value={filters.party_id}
                        onChange={(event) =>
                          updateFilter("party_id", event.target.value)
                        }
                        disabled={isPartiesLoading}
                      >
                        <option value="">
                          {isPartiesLoading
                            ? "Loading parties..."
                            : "Choose a party"}
                        </option>
                        {parties.map((party) => (
                          <option key={party.id} value={party.id}>
                            {formatPartyName(party)}
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
                      value={filters.date_from}
                      onChange={(event) =>
                        updateFilter("date_from", event.target.value)
                      }
                    />
                  </label>

                  <label className="form-field">
                    <span className="form-label">To date</span>
                    <input
                      className="app-input"
                      type="date"
                      value={filters.date_to}
                      onChange={(event) =>
                        updateFilter("date_to", event.target.value)
                      }
                    />
                  </label>

                  {filters.type === "record" && (
                    <label className="form-field">
                      <span className="form-label">Payment status</span>
                      <select
                        className="app-select"
                        value={filters.status}
                        onChange={(event) =>
                          updateFilter("status", event.target.value)
                        }
                      >
                        <option value="">All</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                      </select>
                    </label>
                  )}

                  {filters.type === "advance_ledger" && (
                    <label className="form-field">
                      <span className="form-label">Direction</span>
                      <select
                        className="app-select"
                        value={filters.direction}
                        onChange={(event) =>
                          updateFilter("direction", event.target.value)
                        }
                      >
                        <option value="">All</option>
                        <option value="IN">IN</option>
                        <option value="OUT">OUT</option>
                      </select>
                    </label>
                  )}

                  {filters.type === "audit_log" && (
                    <>
                      <label className="form-field">
                        <span className="form-label">Model</span>
                        <input
                          className="app-input"
                          type="text"
                          placeholder="Record, Payment..."
                          value={filters.model}
                          onChange={(event) =>
                            updateFilter("model", event.target.value)
                          }
                        />
                      </label>

                      <label className="form-field">
                        <span className="form-label">Action</span>
                        <input
                          className="app-input"
                          type="text"
                          placeholder="CREATE, UPDATE..."
                          value={filters.action}
                          onChange={(event) =>
                            updateFilter("action", event.target.value)
                          }
                        />
                      </label>
                    </>
                  )}

                  <label className="form-field">
                    <span className="form-label">Rows per page</span>
                    <select
                      className="app-select"
                      value={filters.page_size}
                      onChange={(event) =>
                        updateFilter("page_size", Number(event.target.value))
                      }
                    >
                      {PAGE_SIZE_OPTIONS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="section-actions summary-panel-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setFilters((previous) => ({
                        ...previous,
                        date_from: `${getLocalDateValue().slice(0, 7)}-01`,
                        date_to: getLocalDateValue(),
                        page: 1,
                      }))
                    }
                  >
                    This Month
                  </button>

                  <button
                    type="button"
                    className="ghost-button"
                    onClick={handleReset}
                  >
                    Reset Filters
                  </button>
                </div>
              </section>

              <section className="section-card section-card--padded">
                <p className="section-kicker">Export</p>

                <div className="summary-export-stack">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handlePrint}
                    disabled={!data}
                  >
                    Print Report
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handlePrint}
                    disabled={!data}
                  >
                    Save as PDF
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleDownloadCsv}
                    disabled={!data}
                  >
                    Download CSV
                  </button>

                  <button
                    type="button"
                    className="ghost-button"
                    onClick={handleDownloadJson}
                    disabled={!data}
                  >
                    Download JSON
                  </button>
                </div>

                <p className="summary-note">
                  The PDF action uses your browser print dialog. Choose
                  <strong> Save as PDF</strong> there for a clean export.
                </p>
              </section>

              <section className="section-card section-card--padded">
                <p className="section-kicker">Snapshot</p>
                <SummaryMetricCards items={metrics} />
              </section>
            </aside>

            <section className="summary-main">
              {!shouldLoadSummary && (
                <SummaryStateCard
                  title="Pick a party to build the statement"
                  copy="Single-party reports stay empty until a party is selected from the filter panel."
                />
              )}

              {shouldLoadSummary && isLoading && !data && (
                <SummaryStateCard
                  title="Building your report"
                  copy="Pulling the latest summary rows and totals for the selected filters."
                />
              )}

              {shouldLoadSummary && isError && !data && (
                <SummaryStateCard
                  title="Report could not be loaded"
                  copy={error?.message || "Please try again with different filters."}
                />
              )}

              {shouldLoadSummary && data && (
                <>
                  <article
                    ref={reportRef}
                    className="section-card section-card--padded summary-report"
                  >
                    <div className="summary-report__header">
                      <div className="summary-report__recipient">
                        <span className="summary-report__muted">To,</span>
                        <strong>{getScopeLabel(filters, selectedParty)}</strong>
                      </div>

                      <div className="summary-report__date-block">
                        <span className="summary-report__muted">Date</span>
                        <strong>{formatStatementDate()}</strong>
                      </div>
                    </div>

                    <p className="summary-report__subject">
                      Sub: {typeMeta.subject}
                    </p>

                    <div className="summary-report__headline">
                      <h2>{`${typeMeta.label} ${getHeadingPeriod(
                        filters.date_from,
                        filters.date_to,
                      )}`}</h2>
                      <p>{getPeriodCaption(filters.date_from, filters.date_to)}</p>
                    </div>

                    <div className="summary-report__narrative">
                      {narrativeRows.map((row) => (
                        <p key={row.label}>
                          <span className="summary-report__line-label">
                            {row.label}:
                          </span>{" "}
                          {row.value}
                        </p>
                      ))}
                    </div>

                    {filters.type === "record" && (
                      <div className="summary-service-breakdown">
                        <div className="summary-service-breakdown__header">
                          <h3>Service-wise pieces</h3>
                          <span>{serviceBreakdown.length} service buckets</span>
                        </div>

                        {serviceBreakdown.length ? (
                          <div className="summary-service-breakdown__grid">
                            {serviceBreakdown.map((service) => (
                              <div
                                key={
                                  service.service_type__type_of_work || "service"
                                }
                                className="summary-service-pill"
                              >
                                <strong>
                                  {service.service_type__type_of_work ||
                                    "Unknown service"}
                                </strong>
                                <span>{service.total_pcs ?? 0} pcs</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="summary-note summary-note--tight">
                            No service totals are available for this record range.
                          </p>
                        )}
                      </div>
                    )}

                    <div className="summary-report__meta-strip">
                      <span>
                        Showing {rows.length} row{rows.length === 1 ? "" : "s"}
                      </span>
                      <span>Total available: {paginationInfo.total}</span>
                      <span>
                        Page {paginationInfo.currentPage} of{" "}
                        {paginationInfo.totalPages}
                      </span>
                    </div>

                    <SummaryTable columns={columns} rows={rows} />

                    <div className="summary-report__footer">
                      <span>Generated from Hallmark Manager</span>
                      <span>
                        Statement prepared on {formatStatementDate(new Date())}
                      </span>
                    </div>
                  </article>

                  <PaginationControls
                    page={paginationInfo.currentPage}
                    totalPages={paginationInfo.totalPages}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
