import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DetailPageLayout from "../components/DetailPageLayout.jsx";
import EarlyReturn from "../components/EarlyReturns.jsx";
import GoBackButton from "../components/GoBackButton.jsx";
import { getAdvance } from "../api/advanceLedger.js";
import useTitle from "../utils/useTitle.js";

// ─── helpers ──────────────────────────────────────────────────────────────────

function PartyAvatar({ name }) {
  const initial = name?.[0]?.toUpperCase() ?? "?";
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-base font-bold text-yellow-700">
      {initial}
    </div>
  );
}

function InfoCell({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p
        className="mt-1 text-sm font-semibold"
        style={{ color: accent ?? "#1e293b" }}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function SnapshotTable({ rows }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      {rows.map(({ label, value }, i) => (
        <div
          key={label}
          className={`flex items-start gap-4 px-4 py-2.5 ${
            i < rows.length - 1 ? "border-b border-slate-100" : ""
          }`}
        >
          <span className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
            {label}
          </span>
          <span className="text-sm text-slate-700 break-words">
            {value ?? "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AdvanceLedgerDetailPage() {
  const { id } = useParams();
  useTitle("Advance Ledger Detail");

  const {
    data: entry,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["advance-ledger", id],
    queryFn: () => getAdvance(id),
  });

  if (isLoading || isError) {
    return (
      <EarlyReturn isLoading={isLoading} isError={isError} error={error} />
    );
  }

  const isIn = entry?.direction === "IN";

  const formattedDate = entry?.created_at
    ? new Date(entry.created_at).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const partyRows = entry?.party
    ? [
        { label: "Full Name", value: entry.party.full_name },
        { label: "Address", value: entry.party.address },
      ]
    : [];

  const paymentRows = entry?.payment
    ? [
        {
          label: "Amount",
          value: `₹${Number(entry.payment.amount).toLocaleString("en-IN")}`,
        },
        { label: "Date", value: entry.payment.payment_date },
      ]
    : null;

  const recordRows = entry?.record
    ? [
        { label: "Service", value: entry.record.service_type?.type_of_work },
        { label: "Rate", value: `₹${entry.record.rate}` },
        { label: "Pcs", value: entry.record.pcs },
        {
          label: "Amount",
          value: `₹${Number(entry.record.amount).toLocaleString("en-IN")}`,
        },
        { label: "Date", value: entry.record.record_date },
      ]
    : null;

  return (
    <DetailPageLayout>
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <PartyAvatar name={entry?.party?.full_name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="section-kicker">Advance Ledger</p>
            <span className={`badge ${isIn ? "badge--green" : "badge--red"}`}>
              {entry?.direction}
            </span>
          </div>
          <h1 className="mt-0.5 text-xl font-bold text-slate-900 truncate">
            {entry?.party?.full_name ?? "Entry"}
          </h1>
          <p className="text-sm text-slate-500 truncate">
            {entry?.party?.address}
          </p>
        </div>
      </div>

      {/* ── Summary grid ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <InfoCell
          label="Amount"
          value={`₹${Number(entry?.amount ?? 0).toLocaleString("en-IN")}`}
        />
        <InfoCell
          label="Remaining"
          value={`₹${Number(entry?.remaining_amount ?? 0).toLocaleString("en-IN")}`}
          accent={Number(entry?.remaining_amount) === 0 ? "#16a34a" : "#b45309"}
        />
        <InfoCell label="Date" value={formattedDate} />
      </div>

      {/* ── Party ── */}
      {partyRows.length > 0 && (
        <>
          <SectionDivider label="Party" />
          <SnapshotTable rows={partyRows} />
        </>
      )}

      {/* ── Linked Payment ── */}
      {paymentRows && (
        <>
          <SectionDivider label="Linked Payment" />
          <SnapshotTable rows={paymentRows} />
        </>
      )}

      {/* ── Linked Record ── */}
      {recordRows && (
        <>
          <SectionDivider label="Linked Record" />
          <SnapshotTable rows={recordRows} />
        </>
      )}

      {/* ── Back ── */}
      <GoBackButton to="/advance-ledger" label="Back To Advance Ledger" />
    </DetailPageLayout>
  );
}
