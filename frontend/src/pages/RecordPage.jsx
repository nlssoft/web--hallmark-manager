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

//initial state
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
  // initialStates
  const [filters, setFilters] = useState({
    party__logo: "",
    party__first_name: "",
    party__last_name: "",
    service_type__type_of_work: "",
    date_range_after: "",
    date_range_before: "",
  });

  //varibles
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

  //quaries
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

  //function
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

  //Early returns
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
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
            <p className="text-sm text-red-600">
              {errors.root.serverError.message}
            </p>
          )}

          <button
            disabled={createMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            type="submit"
          >
            {createMutation.isPending ? "Creating record..." : "Create record"}
          </button>
        </form>
      }
      list={
        <>
          <div className="flex flex-col gap-3">
            {records.map((r) => (
              <div
                key={r.id}
                onClick={() => navigate(`/record/${r.id}`)}
                className="bg-white p-4 rounded-xl border border-gray-200 
      hover:shadow-md hover:-translate-y-[2px] hover:bg-gray-50 
      cursor-pointer transition-all duration-200"
              >
                {/* Top Section */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-900 font-semibold">
                      {r.party.first_name} {r.party.last_name}
                    </p>
                    <p className="text-gray-500 text-sm">{r.party.address}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-400">Date</p>
                    <p className="text-sm font-medium text-gray-700">
                      {formatDate(r.record_date)}
                    </p>
                  </div>
                </div>

                {/* Middle Section */}
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-gray-800">
                      {r.service_type.type_of_work}
                    </span>
                    <span className="ml-2 text-gray-400">@ {r.rate}</span>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-400">Amount</p>
                    <p className="text-base font-semibold text-gray-900">
                      ₹{r.amount}
                    </p>
                  </div>
                </div>

                {/* Bottom Section */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Paid:{" "}
                    <span className="text-green-500 font-medium">
                      ₹{r.paid_amount}
                    </span>
                  </p>

                  {/* Optional status */}
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      r.paid_amount >= r.amount
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-500"
                    }`}
                  >
                    {r.paid_amount >= r.amount ? "Paid" : "Due"}
                  </span>
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
