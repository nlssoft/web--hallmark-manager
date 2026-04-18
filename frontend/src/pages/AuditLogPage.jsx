import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loadAudit } from "../api/audit.js";
import { formatDate, getLocalDateValue } from "../utils/dateFormat.js";
import useTitle from "../utils/useTitle.js";

import FiltersBar from "../components/FilterBar.jsx";
import PaginationControls from "../components/PaginationControls.jsx";
import EarlyReturn from "../components/EarlyReturns.jsx";
import ListPageLayout from "../components/ListPageLayout.jsx";

const today = getLocalDateValue();

const filterFields = [
  { name: "party__logo", label: "Logo", placeholder: "Enter logo" },
  {
    name: "party__first_name",
    label: "First Name",
    placeholder: "Enter first name",
  },
  {
    name: "party__last_name",
    label: "Last Name",
    placeholder: "Enter last name",
  },
  { name: "model_name", label: "Model", placeholder: "Enter model name" },
  { name: "action", label: "Action", placeholder: "Action" },
  {
    name: "created_at_range_after",
    label: "Date From",
    type: "date",
  },
  {
    name: "created_at_range_before",
    label: "Date To",
    type: "date",
  },
];

function getPartySnapshot(row) {
  return row?.after?.party || row?.before?.party || null;
}

function getPartyName(row) {
  const party = getPartySnapshot(row);

  if (!party || typeof party !== "object") return "No linked party";

  return (
    party.full_name ||
    [party.first_name, party.last_name].filter(Boolean).join(" ").trim() ||
    "No linked party"
  );
}

function getPartyAddress(row) {
  return getPartySnapshot(row)?.address || "Address unavailable";
}

function AuditPage() {
  const [filters, setFilters] = useState({
    party__logo: "",
    party__first_name: "",
    party__last_name: "",
    model_name: "",
    action: "",
    created_at_range_after: today,
    created_at_range_before: today,
  });
  useTitle("Audit Log");

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["audit", filters, page],
    queryFn: () => loadAudit({ ...filters, page }),
    placeholderData: (previousData) => previousData,
  });

  const audit = data?.results ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  if (isLoading || isError) {
    return (
      <EarlyReturn isLoading={isLoading} isError={isError} error={error} />
    );
  }

  return (
    <ListPageLayout
      filter={
        <FiltersBar
          filters={filters}
          onChange={(nextFilters) => {
            setFilters(nextFilters);
            setPage(1);
          }}
          fields={filterFields}
        />
      }
      list={
        <>
          <div className="list-stack">
            {audit.map((entry) => (
              <div
                key={entry.id}
                onClick={() => navigate(`/audit/${entry.id}`)}
                className="list-card"
              >
                <div className="flex flex-col gap-4">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-slate-900">
                      {getPartyName(entry)}
                    </p>
                    <p className="meta-muted">{getPartyAddress(entry)}</p>
                  </div>

                  <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
                    <div>
                      <p className="meta-label">Model Name</p>
                      <p className="meta-value">{entry.model_name}</p>
                    </div>

                    <div>
                      <p className="meta-label">Action</p>
                      <p
                        className={`meta-value ${
                          entry.action === "DELETE"
                            ? "text-red-500"
                            : "text-emerald-600"
                        }`}
                      >
                        {entry.action}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="meta-label">Date</p>
                      <p className="meta-value">{formatDate(entry.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              showBack
              onBack={() => navigate("/dashboard")}
            />
          </div>
        </>
      }
    />
  );
}

export default AuditPage;
