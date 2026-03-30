import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createParties, loadParties } from "../api/parties";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { loadEmployees } from "../api/employees";

import PartyFiltersBar from "../components/PartyFiltersBar";
import AutoCompleteInput from "../components/AutocompleteInput";
import PaginationControls from "../components/PaginationControls";
import { applyServerFormErrors } from "../api/error";
import EarlyReturn from "../components/EarlyReturns";
import ListPageLayout from "../components/ListPageLayout";
import CreateFieldsRenderer from "../components/CreateFieldsRenderer";

//initial state
const fields = [
  { label: "Logo", name: "logo" },
  {
    label: "First Name",
    name: "first_name",
    rules: {
      required: "First name is required.",
      maxLength: {
        value: 255,
        message: "First name must be 255 characters or fewer.",
      },
    },
  },
  {
    label: "Last Name",
    name: "last_name",
    rules: {
      maxLength: {
        value: 255,
        message: "Last name must be 255 characters or fewer.",
      },
    },
  },
  {
    label: "Email",
    name: "email",
    rules: {
      pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "Enter a valid email address",
      },
    },
  },
  {
    label: "Number",
    name: "number",
    rules: {
      maxLength: {
        value: 255,
        message: "Number must be 255 characters or fewer.",
      },
    },
  },
  {
    label: "Address",
    name: "address",
    type: "textArea",
    rules: {
      maxLength: {
        value: 255,
        message: "Address must be 255 characters or fewer.",
      },
    },
  },
  {
    label: "Assigned to",
    name: "assigned_to",
    type: "autocomplete",
    labelKey: "username",
    subLabelKey: "address",
    placeholder: "Assigned to",
  },
];

const defaultValues = {
  logo: "",
  first_name: "",
  last_name: "",
  email: "",
  number: "",
  address: "",
  assigned_to: "",
};

function PartiesPage() {
  // initialStates
  const [filters, setFilters] = useState({
    first_name: "",
    last_name: "",
    logo: "",
  });

  //varibles
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const navigate = useNavigate();
  const { user } = useAuth();

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
    queryKey: ["parties", filters, page],
    queryFn: () => loadParties({ ...filters, page }),
    placeholderData: (previousData) => previousData,
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => loadEmployees().then((res) => res.results),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createParties(payload),
    onSuccess: () => {
      reset();
      clearErrors();
      queryClient.invalidateQueries({ queryKey: [parties] });
    },
    onError: (err) => {
      clearErrors();
      applyServerFormErrors();
    },
  });

  const parties = data?.results ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  //Early returns
  if (isLoading || isError) {
    return (
      <EarlyReturn isLoading={isLoading} isError={isError} error={error} />
    );
  }

  return (
    <ListPageLayout
      filter={
        <PartyFiltersBar
          filters={filters}
          onChange={(nextFilters) => {
            setFilters(nextFilters);
            setPage(1);
          }}
        />
      }
      form={
        <form onSubmit={handleSubmit} className="space-y-3">
          <CreateFieldsRenderer
            fields={fields}
            control={control}
            errors={errors}
            fieldProps={{
              assigned_to: {
                options: employees ?? [],
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
            {createMutation.isPending ? "Adding Party..." : "Add Party"}
          </button>
        </form>
      }
      list={
        <>
          <div className="flex flex-col gap-3">
            {parties.map((party) => (
              <div
                key={party.id}
                onClick={() => navigate(`/parties/${party.id}`)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 
      hover:shadow-md hover:-translate-y-[1px] hover:bg-gray-50 
      cursor-pointer transition-all duration-200"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-gray-900 font-semibold">
                    {party.first_name} {party.last_name}
                  </span>

                  <span className="text-gray-500 text-sm">{party.address}</span>
                </div>

                <div className="flex justify-between text-sm mt-3 pt-2 border-t border-gray-100">
                  <span className="text-red-400">Due: {party.due}</span>
                  <span className="text-green-400">
                    Advance: {party.advance_balance}
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

export default PartiesPage;
