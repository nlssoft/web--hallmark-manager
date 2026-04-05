import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ListPageLayout from "../components/ListPageLayout.jsx";
import FiltersBar from "../components/FilterBar.jsx";
import PaginationControls from "../components/PaginationControls.jsx";
import EarlyReturn from "../components/EarlyReturns.jsx";
import { loadAdvance } from "../api/advanceLedger.js";

const PAGE_SIZE = 20;

const FILTER_FIELDS = [
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
  {
    name: "direction",
    label: "Direction",
    placeholder: "IN or OUT",
  },
  {
    name: "created_at_after",
    label: "Date From",
    placeholder: "Date from",
    type: "date",
  },
  {
    name: "created_at_before",
    label: "Date To",
    placeholder: "Date to",
    type: "date",
  },
];

export default function AdvanceLedgerPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);

  const cleanedFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== "" && v != null),
  );
  const params = { ...cleanedFilters, page };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["advance-ledger", params],
    queryFn: () => loadAdvance(params),
    placeholderData: (previousData) => previousData,
  });

  if (isLoading || isError) {
    return (
      <EarlyReturn isLoading={isLoading} isError={isError} error={error} />
    );
  }

  const results = data?.results ?? [];
  const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE);

  function handleFilterChange(newFilters) {
    setFilters(newFilters);
    setPage(1);
  }

  return (
    <ListPageLayout
      filter={
        <FiltersBar
          filters={filters}
          onChange={handleFilterChange}
          fields={FILTER_FIELDS}
        />
      }
      list={
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="section-kicker">Advance Ledger</p>
            {data?.count > 0 && (
              <span className="text-xs text-slate-400">
                {data.count} {data.count === 1 ? "entry" : "entries"}
              </span>
            )}
          </div>

          {results.length === 0 ? (
            <p></p>
          ) : (
            <div className="space-y-3">
              {results.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => navigate(`/advance-ledger/${entry.id}`)}
                  className="list-card cursor-pointer"
                >
                  {/* Top row: name + badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {entry.party?.full_name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 truncate">
                        {entry.party?.address}
                      </p>
                    </div>
                    <span
                      className={`badge shrink-0 ${
                        entry.direction === "IN" ? "badge--green" : "badge--red"
                      }`}
                    >
                      {entry.direction}
                    </span>
                  </div>

                  {/* Bottom row: amounts + date */}
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div className="flex gap-6">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Amount
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-slate-700">
                          ₹{Number(entry.amount).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Remaining
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-slate-700">
                          ₹
                          {Number(entry.remaining_amount).toLocaleString(
                            "en-IN",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Date
                      </p>
                      <p className="mt-0.5 text-sm text-slate-700">
                        {new Date(entry.created_at).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          },
                        )}
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
      }
    />
  );
}
