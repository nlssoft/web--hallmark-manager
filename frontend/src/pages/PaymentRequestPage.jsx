import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import ListPageLayout from "../components/ListPageLayout.jsx";
import PaginationControls from "../components/PaginationControls.jsx";
import EarlyReturn from "../components/EarlyReturns.jsx";
import {
  loadRequests,
  createRequest,
  loadEligibleRecords,
} from "../api/paymentRequest.js";

const PAGE_SIZE = 20;

// ─── helpers ──────────────────────────────────────────────────────────────────

function statusClass(status) {
  if (status === "A") return "badge badge--green";
  if (status === "R") return "badge badge--red";
  return "badge";
}

function statusLabel(status) {
  if (status === "A") return "Approved";
  if (status === "R") return "Rejected";
  return "Pending";
}

function formatDate(dt) {
  return new Date(dt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── sub-user: create form ─────────────────────────────────────────────────

function CreateForm({ onSuccess }) {
  const { handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: { record: [] },
  });

  const selectedIds = watch("record");

  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ["eligible-records"],
    queryFn: loadEligibleRecords,
  });

  // Only show records that still have an outstanding due amount
  const eligibleRecords = recordsData?.results ?? [];

  const createMutation = useMutation({
    mutationFn: createRequest,
    onSuccess: () => {
      reset();
      onSuccess();
    },
  });

  function toggleRecord(id) {
    if (selectedIds.includes(id)) {
      setValue(
        "record",
        selectedIds.filter((r) => r !== id),
      );
    } else {
      setValue("record", [...selectedIds, id]);
    }
  }

  // Total due across all selected records
  const totalSelected = eligibleRecords
    .filter((r) => selectedIds.includes(r.id))
    .reduce(
      (sum, r) =>
        sum + (Number(r.amount) - (Number(r.paid_amount) + Number(r.discount))),
      0,
    );

  function onSubmit(data) {
    if (data.record.length === 0) return;
    createMutation.mutate(data);
  }

  return (
    <div className="space-y-4">
      <p className="section-kicker">New Request</p>

      {createMutation.isError && (
        <p className="field-error">{createMutation.error?.message}</p>
      )}

      {recordsLoading ? (
        <p className="text-sm text-slate-500">Loading records...</p>
      ) : eligibleRecords.length === 0 ? (
        <p className="text-sm text-slate-500">No eligible records found.</p>
      ) : (
        <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
          {eligibleRecords.map((record) => {
            const due =
              Number(record.amount) -
              (Number(record.paid_amount) + Number(record.discount));

            const isSelected = selectedIds.includes(record.id);

            return (
              <div
                key={record.id}
                onClick={() => toggleRecord(record.id)}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  isSelected
                    ? "border-yellow-400 bg-yellow-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {/* Record header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {record.party?.full_name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {record.service_type?.type_of_work}
                    </p>
                  </div>
                  {/* Checkbox visual */}
                  <div
                    className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 ${
                      isSelected
                        ? "border-yellow-500 bg-yellow-500"
                        : "border-slate-300 bg-white"
                    }`}
                  />
                </div>

                {/* Record meta row */}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {[
                    { label: "Rate", value: `₹${record.rate}` },
                    { label: "Pcs", value: record.pcs },
                    { label: "Amount", value: `₹${record.amount}` },
                    { label: "Paid", value: `₹${record.paid_amount}` },
                    {
                      label: "Due",
                      value: `₹${due.toFixed(2)}`,
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="text-xs font-medium text-slate-700">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selection summary */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
          <p className="text-sm text-slate-600">
            {selectedIds.length} record{selectedIds.length !== 1 ? "s" : ""}{" "}
            selected
          </p>
          <p className="text-sm font-semibold text-slate-800">
            ₹{totalSelected.toFixed(2)}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit(onSubmit)}
        disabled={selectedIds.length === 0 || createMutation.isPending}
        className="primary-button w-full"
      >
        {createMutation.isPending ? "Submitting..." : "Create Request"}
      </button>
    </div>
  );
}

// ─── shared: request list ──────────────────────────────────────────────────

function RequestList({ isAdmin }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const params = { page };
  if (status) params.status = status;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["payment-requests", params],
    queryFn: () => loadRequests(params),
  });

  if (isLoading || isError) {
    return (
      <EarlyReturn isLoading={isLoading} isError={isError} error={error} />
    );
  }

  const results = data?.results ?? [];
  const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="section-kicker">
          {isAdmin ? "Payment Requests" : "My Requests"}
        </p>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="app-input !w-auto text-sm"
        >
          <option value="">All</option>
          <option value="P">Pending</option>
          <option value="A">Approved</option>
          <option value="R">Rejected</option>
        </select>
      </div>

      {results.length === 0 ? (
        <p></p>
      ) : (
        <div className="space-y-3">
          {results.map((req) => (
            <div
              key={req.id}
              onClick={() => navigate(`/payment-request/${req.id}`)}
              className="list-card cursor-pointer"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {isAdmin && (
                    <p className="mb-0.5 text-xs font-medium text-slate-500">
                      {req.created_by?.username}
                    </p>
                  )}
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {req.address}
                  </p>
                  <p className="truncate text-xs text-slate-500">{req.email}</p>
                </div>
                <span className={`shrink-0 ${statusClass(req.status)}`}>
                  {statusLabel(req.status)}
                </span>
              </div>

              {/* Bottom row */}
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Amount
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-slate-700">
                    ₹{Number(req.requested_amount).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Date
                  </p>
                  <p className="mt-0.5 text-sm text-slate-700">
                    {formatDate(req.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <PaginationControls
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          showBack
          onBack={() => navigate("/dashboard/")}
        />
      </div>
    </div>
  );
}

// ─── page ──────────────────────────────────────────────────────────────────

export default function PaymentRequestPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = user?.parent_id === null || user?.parent_id === undefined;

  function handleCreateSuccess() {
    queryClient.invalidateQueries({ queryKey: ["payment-requests"] });
    queryClient.invalidateQueries({ queryKey: ["eligible-records"] });
  }

  if (isAdmin) {
    // Admin: full-width list, no create form
    return <ListPageLayout list={<RequestList isAdmin={true} />} />;
  }

  // Sub-user: create form on left, their requests on right
  return (
    <ListPageLayout
      form={<CreateForm onSuccess={handleCreateSuccess} />}
      list={<RequestList isAdmin={false} />}
    />
  );
}
