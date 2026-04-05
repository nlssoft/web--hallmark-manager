import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import DetailPageLayout from "../components/DetailPageLayout.jsx";
import EarlyReturn from "../components/EarlyReturns.jsx";
import GoBackButton from "../components/GoBackButton.jsx";
import {
  getRequest,
  approveRequest,
  rejectRequest,
  updateRequest,
  deleteRequest,
} from "../api/paymentRequest.js";

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

function InfoCell({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value ?? "—"}
      </p>
    </div>
  );
}

// ─── group records by party ───────────────────────────────────────────────────

function groupByParty(records) {
  const map = {};
  for (const r of records) {
    const id = r.party?.id;
    if (!map[id]) map[id] = { party: r.party, records: [] };
    map[id].records.push(r);
  }
  return Object.values(map);
}

// ─── record row ───────────────────────────────────────────────────────────────

function RecordRow({ record, onRemove }) {
  const due =
    Number(record.amount) -
    (Number(record.paid_amount) + Number(record.discount));

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">
            {record.service_type?.type_of_work}
          </p>
          <p className="text-xs text-slate-500">{record.record_date}</p>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(record.id)}
            className="shrink-0 text-xs text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {[
          { label: "Rate", value: `₹${record.rate}` },
          { label: "Pcs", value: record.pcs },
          { label: "Amount", value: `₹${record.amount}` },
          { label: "Discount", value: `₹${record.discount}` },
          { label: "Paid", value: `₹${record.paid_amount}` },
          { label: "Due", value: `₹${due.toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-xs font-medium text-slate-700">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── party accordion ─────────────────────────────────────────────────────────

function PartyAccordion({ groups, editRecordIds, onRemove }) {
  const [openPartyId, setOpenPartyId] = useState(
    groups.length > 0 ? groups[0].party?.id : null,
  );

  return (
    <div className="space-y-2">
      {groups.map(({ party, records }) => {
        // in edit mode, only show records not yet removed
        const visibleRecords = editRecordIds
          ? records.filter((r) => editRecordIds.includes(r.id))
          : records;

        const isOpen = openPartyId === party?.id;
        const due = visibleRecords.reduce(
          (sum, r) =>
            sum +
            Number(r.amount) -
            (Number(r.paid_amount) + Number(r.discount)),
          0,
        );

        return (
          <div
            key={party?.id}
            className="overflow-hidden rounded-xl border border-slate-200"
          >
            {/* Party header — click to toggle */}
            <button
              type="button"
              onClick={() => setOpenPartyId(isOpen ? null : party?.id)}
              className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {party?.full_name}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {party?.address}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs font-medium text-slate-500">
                  {visibleRecords.length} record
                  {visibleRecords.length !== 1 ? "s" : ""} · ₹{due.toFixed(2)}
                </span>
                <span className="text-slate-400">{isOpen ? "▲" : "▼"}</span>
              </div>
            </button>

            {/* Records dropdown */}
            {isOpen && (
              <div className="space-y-2 p-3">
                {visibleRecords.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    All records removed for this party.
                  </p>
                ) : (
                  visibleRecords.map((record) => (
                    <RecordRow
                      key={record.id}
                      record={record}
                      onRemove={onRemove ?? null}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── admin view ───────────────────────────────────────────────────────────────

function AdminView({ pr }) {
  const queryClient = useQueryClient();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const groups = groupByParty(pr.record ?? []);
  const isPending = pr.status === "P";
  const isRejected = pr.status === "R";

  const approveMutation = useMutation({
    mutationFn: () => approveRequest(pr.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["payment-request", String(pr.id)],
      });
      queryClient.invalidateQueries({ queryKey: ["payment-requests"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectRequest(pr.id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["payment-request", String(pr.id)],
      });
      queryClient.invalidateQueries({ queryKey: ["payment-requests"] });
      setShowReject(false);
    },
  });

  function handleReject() {
    if (!reason.trim()) {
      setReasonError("Reason is required.");
      return;
    }
    setReasonError("");
    rejectMutation.mutate();
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Payment Request</p>
          <p className="text-sm text-slate-500">
            Requested by{" "}
            <span className="font-medium text-slate-700">
              {pr.created_by?.username}
            </span>{" "}
            · {pr.created_by?.address}
          </p>
        </div>
        <span className={statusClass(pr.status)}>{statusLabel(pr.status)}</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <InfoCell
          label="Total Amount"
          value={`₹${Number(pr.requested_amount).toLocaleString("en-IN")}`}
        />
        <InfoCell
          label="Parties"
          value={`${groups.length} ${groups.length === 1 ? "party" : "parties"}`}
        />
        <InfoCell
          label="Date"
          value={new Date(pr.created_at).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        />
      </div>

      {/* Rejection reason */}
      {isRejected && pr.rejected_reason && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
            Rejection Reason
          </p>
          <p className="mt-1 text-sm text-red-700">{pr.rejected_reason}</p>
        </div>
      )}

      {/* Party accordion */}
      <SectionDivider label="Parties & Records" />
      <PartyAccordion groups={groups} />

      {/* Actions */}
      {isPending && (
        <>
          <SectionDivider label="Actions" />

          {approveMutation.isError && (
            <p className="field-error">{approveMutation.error?.message}</p>
          )}
          {rejectMutation.isError && (
            <p className="field-error">{rejectMutation.error?.message}</p>
          )}

          {!showReject ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="primary-button flex-1"
              >
                {approveMutation.isPending ? "Approving..." : "Approve"}
              </button>
              <button
                type="button"
                onClick={() => setShowReject(true)}
                className="secondary-button flex-1"
              >
                Reject
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="form-label" htmlFor="reject-reason">
                  Reason for rejection
                </label>
                <textarea
                  id="reject-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason..."
                  className={`app-textarea${reasonError ? " app-textarea--error" : ""}`}
                />
                {reasonError && <p className="field-error">{reasonError}</p>}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                  className="primary-button flex-1"
                >
                  {rejectMutation.isPending ? "Rejecting..." : "Confirm Reject"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReject(false);
                    setReason("");
                    setReasonError("");
                  }}
                  className="secondary-button flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <GoBackButton to="/payment-request" label="Back To Requests" />
    </>
  );
}

// ─── sub-user view ────────────────────────────────────────────────────────────

function SubUserView({ pr }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editRecordIds, setEditRecordIds] = useState(
    (pr.record ?? []).map((r) => r.id),
  );
  const [editError, setEditError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const allRecords = pr.record ?? [];
  const groups = groupByParty(allRecords);
  const isPending = pr.status === "P";
  const isRejected = pr.status === "R";

  const updateMutation = useMutation({
    mutationFn: (data) => updateRequest(pr.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["payment-request", String(pr.id)],
      });
      queryClient.invalidateQueries({ queryKey: ["payment-requests"] });
      setIsEditing(false);
      setEditError("");
    },
    onError: (err) => setEditError(err?.message ?? "Something went wrong."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRequest(pr.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-requests"] });
      navigate("/payment-request");
    },
  });

  function removeRecord(id) {
    if (editRecordIds.length <= 1) {
      setEditError(
        "A request must have at least one record. Delete the request instead.",
      );
      return;
    }
    setEditRecordIds((prev) => prev.filter((r) => r !== id));
    setEditError("");
  }

  function handleSaveEdit() {
    updateMutation.mutate({ record: editRecordIds });
  }

  function cancelEdit() {
    setEditRecordIds((pr.record ?? []).map((r) => r.id));
    setIsEditing(false);
    setEditError("");
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Payment Request</p>
          <p className="text-sm text-slate-500">
            {new Date(pr.created_at).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <span className={statusClass(pr.status)}>{statusLabel(pr.status)}</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <InfoCell
          label="Total Amount"
          value={`₹${Number(pr.requested_amount).toLocaleString("en-IN")}`}
        />
        <InfoCell
          label="Parties"
          value={`${groups.length} ${groups.length === 1 ? "party" : "parties"}`}
        />
        <InfoCell
          label="Records"
          value={`${allRecords.length} record${allRecords.length !== 1 ? "s" : ""}`}
        />
      </div>

      {/* Rejection reason */}
      {isRejected && pr.rejected_reason && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
            Rejection Reason
          </p>
          <p className="mt-1 text-sm text-red-700">{pr.rejected_reason}</p>
        </div>
      )}

      {/* Party accordion */}
      <SectionDivider
        label={isEditing ? "Records — Edit Mode" : "Parties & Records"}
      />

      {editError && <p className="field-error">{editError}</p>}

      <PartyAccordion
        groups={groups}
        editRecordIds={isEditing ? editRecordIds : null}
        onRemove={isEditing ? removeRecord : null}
      />

      {/* Actions */}
      {isPending && (
        <>
          <SectionDivider label="Actions" />

          {updateMutation.isError && !editError && (
            <p className="field-error">{updateMutation.error?.message}</p>
          )}
          {deleteMutation.isError && (
            <p className="field-error">{deleteMutation.error?.message}</p>
          )}

          {!isEditing && !showDeleteConfirm && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="secondary-button flex-1"
              >
                Edit Records
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="secondary-button flex-1 !text-red-500"
              >
                Delete
              </button>
            </div>
          )}

          {isEditing && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending}
                className="primary-button flex-1"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="secondary-button flex-1"
              >
                Cancel
              </button>
            </div>
          )}

          {showDeleteConfirm && (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">
                Are you sure you want to delete this request? This cannot be
                undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="danger-button flex-1"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="secondary-button flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <GoBackButton to="/payment-request" label="Back To Requests" />
    </>
  );
}

// ─── page ──────────────────────────────────────────────────────────────────

export default function PaymentRequestDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const {
    data: pr,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["payment-request", id],
    queryFn: () => getRequest(id),
  });

  if (isLoading || isError) {
    return (
      <EarlyReturn isLoading={isLoading} isError={isError} error={error} />
    );
  }

  const isAdmin = user?.parent_id === null || user?.parent_id === undefined;

  return (
    <DetailPageLayout>
      {isAdmin ? <AdminView pr={pr} /> : <SubUserView pr={pr} />}
    </DetailPageLayout>
  );
}
