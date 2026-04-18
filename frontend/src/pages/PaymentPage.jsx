import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import { formatDate, getLocalDateValue } from "../utils/dateFormat.js";
import { applyServerFormErrors } from "../api/error";
import { createPayment, loadPayments } from "../api/payment.js";
import { loadParties } from "../api/parties.js";

import FiltersBar from "../components/FilterBar.jsx";
import PaginationControls from "../components/PaginationControls";
import EarlyReturn from "../components/EarlyReturns";
import ListPageLayout from "../components/ListPageLayout";
import CreateFieldsRenderer from "../components/CreateFieldsRenderer";
import useTitle from "../utils/useTitle.js";

const today = getLocalDateValue();

const fields = [
  {
    label: "Party",
    type: "autocomplete",
    name: "party_id",
    rules: { required: "Party is required." },
    labelKey: "full_name",
    subLabelKey: "address",
    placeholder: "Party",
  },
  {
    label: "Amount",
    name: "amount",
    rules: {
      validate: (value) => {
        const decimal = value.toString().split(".")[1];
        if (decimal && decimal.length > 2)
          return "Max 2 decimal places allowed.";
        return true;
      },
    },
  },
  {
    label: "Date",
    type: "date",
    name: "payment_date",
  },
];

const defaultValues = {
  party_id: "",
  amount: "",
  payment_date: today,
};

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
  { name: "date_range_after", label: "From Date", type: "date" },
  { name: "date_range_before", label: "To Date", type: "date" },
];

function PaymentPage() {
  const [filters, setFilters] = useState({
    party__logo: "",
    party__first_name: "",
    party__last_name: "",
    date_range_after: "",
    date_range_before: "",
  });
  useTitle("Payments");

  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    reset,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm({ defaultValues: defaultValues });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["payment", filters, page],
    queryFn: () => loadPayments({ ...filters, page }),
    placeholderData: (previousData) => previousData,
  });

  const { data: party } = useQuery({
    queryKey: ["party"],
    queryFn: () => loadParties({ page_size: 1000 }).then((res) => res.results),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createPayment(payload),
    onSuccess: () => {
      reset();
      clearErrors();
      queryClient.invalidateQueries({ queryKey: ["payment"] });
    },
    onError: (err) => {
      clearErrors();
      applyServerFormErrors(err, setError, "Could not create payment.");
    },
  });

  const payments = data?.results ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  function onSubmit(values) {
    createMutation.mutate(values);
  }

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
      form={
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <CreateFieldsRenderer
            fields={fields}
            control={control}
            errors={errors}
            fieldProps={{
              party_id: {
                options: party ?? [],
              },
            }}
          />
          {errors.root?.serverError?.message && (
            <p className="field-error">{errors.root.serverError.message}</p>
          )}

          <button
            disabled={createMutation.isPending}
            className="primary-button w-full"
            type="submit"
          >
            {createMutation.isPending
              ? "Creating payment..."
              : "Create payment"}
          </button>
        </form>
      }
      list={
        <>
          <div className="list-stack">
            {payments.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/payment/${p.id}`)}
                className="list-card"
              >
                <div className="flex flex-col gap-4">
                  {/* TOP SECTION */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    {/* LEFT: PARTY INFO */}
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-slate-900">
                        {p.party.first_name} {p.party.last_name}
                      </p>
                      <p className="meta-muted">{p.party.address}</p>
                    </div>

                    {/* RIGHT: DATE + AMOUNT (FIXED HERE) */}
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 sm:text-right space-y-3">
                      <div>
                        <p className="meta-label">Date</p>
                        <p className="meta-value">
                          {formatDate(p.payment_date)}
                        </p>
                      </div>

                      <div>
                        <p className="meta-label">Amount</p>
                        <p className="text-xl font-bold text-blue-600">
                          {"\u20B9"}
                          {p.amount}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* OPTIONAL: REMOVE THIS IF YOU DON'T NEED EXTRA GRID */}
                  {/* (You had it before, but it's now redundant) */}
                  {/* 
          <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          </div> 
          */}
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          <div className="mt-6">
            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              showBack
              onBack={() => navigate("/dashboard/")}
            />
          </div>
        </>
      }
    />
  );
}

export default PaymentPage;
