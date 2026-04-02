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

//initial state
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
  // initialStates
  const [filters, setFilters] = useState({
    party__logo: "",
    party__first_name: "",
    party__last_name: "",
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

  //function
  function onSubmit(data) {
    createMutation.mutate(data);
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
            {createMutation.isPending
              ? "Creating work rate..."
              : "Create work rate"}
          </button>
        </form>
      }
      list={
        <>
          <div className="flex flex-col gap-3">
            {workRate.map((wr) => (
              <div
                key={wr.id}
                onClick={() => navigate(`/work-rate/${wr.id}`)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 
      hover:shadow-md hover:-translate-y-[1px] hover:bg-gray-50 
      cursor-pointer transition-all duration-200"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-gray-900 font-semibold">
                    {wr.party.first_name} {wr.party.last_name}
                  </span>

                  <span className="text-gray-500 text-sm">
                    {wr.party.address}
                  </span>
                </div>

                <div className="flex justify-between text-sm mt-3 pt-2 border-t border-gray-100">
                  <span className="text-red-400">
                    Service: {wr.service_type.type_of_work}
                  </span>
                  <span className="text-green-400">Rate: {wr.rate}</span>
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
