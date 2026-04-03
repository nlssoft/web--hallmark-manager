import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import { formatDate } from "../utils/dateFormat.js";
import { applyServerFormErrors } from "../api/error";
import { createRecord, loadRecords } from "../api/record.js";
import { loadParties } from "../api/parties.js";
import { loadService } from "../api/serviceType.js";

import FiltersBar from "../components/FilterBar.jsx";
import PaginationControls from "../components/PaginationControls";
import EarlyReturn from "../components/EarlyReturns";
import ListPageLayout from "../components/ListPageLayout";
import CreateFieldsRenderer from "../components/CreateFieldsRenderer";

const today = new Date().toISOString().split("T")[0];

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
    label: "Service type",
    type: "autocomplete",
    name: "service_type_id",
    rules: {
      required: "Service type is required.",
    },
    labelKey: "type_of_work",
    placeholder: "Service type",
  },
  {
    label: "Rate mode",
    type: "select",
    name: "rate_mode",
    rules: { required: "Rate mode is required." },
    options: [
      {
        value: "manual",
        label: "Manual",
      },
      { value: "system", label: "System" },
    ],
  },
  {
    label: "Rate",
    name: "rate",
    rules: {
      validate: (value, formValues) => {
        if (formValues.rate_mode === "manual" && !value) {
          return "Rate is required.";
        }
        if (!value) return true;
        if (Number(value) < 1) return "Rate cannot be less then 1.";
        const decimal = value.toString().split(".")[1];
        if (decimal && decimal.length > 2) {
          return "Max 2 decimal places allowed.";
        }
        return true;
      },
    },
  },
  {
    label: "Pcs",
    name: "pcs",
    rules: {
      required: "Pcs is required.",
      min: {
        value: 1,
        message: "Pcs cannot be less then 1.",
      },
    },
  },
  {
    label: "Discount",
    name: "discount",
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
    name: "record_date",
  },
];

const defaultValues = {
  party_id: "",
  service_type_id: "",
  rate_mode: "system",
  rate: "",
  pcs: "",
  discount: "",
  record_date: today,
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
  {
    name: "service_type__type_of_work",
    label: "Service",
    placeholder: "Enter service",
  },
  { name: "date_range_after", label: "From Date", type: "date" },
  { name: "date_range_before", label: "To Date", type: "date" },
];

function RecordPage() {
  const [filters, setFilters] = useState({
    party__logo: "",
    party__first_name: "",
    party__last_name: "",
    service_type__type_of_work: "",
    date_range_after: "",
    date_range_before: "",
  });

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
    queryKey: ["record", filters, page],
    queryFn: () => loadRecords({ ...filters, page }),
    placeholderData: (previousData) => previousData,
  });

  const { data: party } = useQuery({
    queryKey: ["party"],
    queryFn: () => loadParties({ page_size: 1000 }).then((res) => res.results),
  });

  const { data: service } = useQuery({
    queryKey: ["service"],
    queryFn: loadService,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createRecord(payload),
    onSuccess: () => {
      reset();
      clearErrors();
      queryClient.invalidateQueries({ queryKey: ["record"] });
    },
    onError: (err) => {
      clearErrors();
      applyServerFormErrors(err, setError, "Could not create record.");
    },
  });

  const records = data?.results ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  function onSubmit(values) {
    const payload = { ...values };

    if (payload.rate_mode === "system" || payload.rate === "") {
      delete payload.rate;
    }

    if (payload.discount === "") {
      delete payload.discount;
    }

    if (payload.record_date === "") {
      delete payload.record_date;
    }

    createMutation.mutate(payload);
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
              service_type_id: {
                options: service ?? [],
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
            {createMutation.isPending ? "Creating record..." : "Create record"}
          </button>
        </form>
      }
      list={
        <>
          <div className="list-stack">
            {records.map((r) => (
              <div
                key={r.id}
                onClick={() => navigate(`/record/${r.id}`)}
                className="list-card"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-slate-900">
                        {r.party.first_name} {r.party.last_name}
                      </p>
                      <p className="meta-muted">{r.party.address}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3 sm:text-right">
                      <p className="meta-label">Date</p>
                      <p className="meta-value">{formatDate(r.record_date)}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="meta-label">Service</p>
                      <p className="meta-value">
                        {r.service_type.type_of_work}
                      </p>
                    </div>

                    <div>
                      <p className="meta-label">PCS</p>
                      <p className="meta-value">{r.pcs}</p>
                    </div>

                    <div className="lg:text-right">
                      <p className="meta-label">Amount</p>
                      <p className="meta-value">
                        {"\u20B9"}
                        {r.amount}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="meta-value text-emerald-600">
                      Paid: {"\u20B9"}
                      {r.paid_amount}
                    </p>

                    <span
                      className={
                        r.paid_amount >= r.amount
                          ? "info-pill status-pill--success"
                          : "info-pill status-pill--danger"
                      }
                    >
                      {r.paid_amount >= r.amount ? "Paid" : "Due"}
                    </span>
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
              onBack={() => navigate("/dashboard/")}
            />
          </div>
        </>
      }
    />
  );
}

export default RecordPage;
