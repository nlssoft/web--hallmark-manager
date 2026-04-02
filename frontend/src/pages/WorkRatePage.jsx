import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import { applyServerFormErrors } from "../api/error";
import { createWorkRate, loadWorkRate } from "../api/workRate.js";
import { loadParties } from "../api/parties.js";
import { loadService } from "../api/serviceType.js";

import FiltersBar from "../components/FilterBar.jsx";
import PaginationControls from "../components/PaginationControls";
import EarlyReturn from "../components/EarlyReturns";
import ListPageLayout from "../components/ListPageLayout";
import CreateFieldsRenderer from "../components/CreateFieldsRenderer";

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
    label: "Rate",
    name: "rate",
    rules: {
      required: "Rate is required.",
      min: {
        value: 1,
        message: "Rate cannot be less then 1.",
      },
      validate: (value) => {
        const decimal = value.toString().split(".")[1];
        if (decimal && decimal.length > 2)
          return "Max 2 decimal places allowed.";
        return true;
      },
    },
  },
];

const defaultValues = {
  party_id: "",
  service_type_id: "",
  rate: "",
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
];

function WorkRatePage() {
  const [filters, setFilters] = useState({
    party__logo: "",
    party__first_name: "",
    party__last_name: "",
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
    queryKey: ["workRate", filters, page],
    queryFn: () => loadWorkRate({ ...filters, page }),
    placeholderData: (previousData) => previousData,
  });

  const { data: party } = useQuery({
    queryKey: ["parties"],
    queryFn: () => loadParties({ page_size: 1000 }).then((res) => res.results),
  });

  const { data: service } = useQuery({
    queryKey: ["service"],
    queryFn: loadService,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createWorkRate(payload),
    onSuccess: () => {
      reset();
      clearErrors();
      queryClient.invalidateQueries({ queryKey: ["workRate"] });
    },
    onError: (err) => {
      clearErrors();
      applyServerFormErrors(err, setError, "Could not add party.");
    },
  });

  const workRate = data?.results ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  function onSubmit(data) {
    createMutation.mutate(data);
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
            {createMutation.isPending
              ? "Creating work rate..."
              : "Create work rate"}
          </button>
        </form>
      }
      list={
        <>
          <div className="list-stack">
            {workRate.map((wr) => (
              <div
                key={wr.id}
                onClick={() => navigate(`/work-rate/${wr.id}`)}
                className="list-card"
              >
                <div className="flex flex-col gap-4">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-slate-900">
                      {wr.party.first_name} {wr.party.last_name}
                    </p>
                    <p className="meta-muted">{wr.party.address}</p>
                  </div>

                  <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    <div>
                      <p className="meta-label">Service</p>
                      <p className="meta-value">
                        {wr.service_type.type_of_work}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="meta-label">Rate</p>
                      <p className="meta-value text-emerald-600">{wr.rate}</p>
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
              onBack={() => navigate("/dashboard/")}
            />
          </div>
        </>
      }
    />
  );
}

export default WorkRatePage;
