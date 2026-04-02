import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createParties, loadParties } from "../api/parties";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { loadEmployees } from "../api/employees";

import FiltersBar from "../components/FilterBar";
import PaginationControls from "../components/PaginationControls";
import { applyServerFormErrors } from "../api/error";
import EarlyReturn from "../components/EarlyReturns";
import ListPageLayout from "../components/ListPageLayout";
import CreateFieldsRenderer from "../components/CreateFieldsRenderer";

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
    name: "assigned_to_id",
    type: "autocomplete",
    labelKey: "username",
    subLabelKey: "address",
    placeholder: "Assigned to",
  },
];

const filterFields = [
  { name: "logo", label: "Logo", placeholder: "Enter logo" },
  {
    name: "first_name",
    label: "First Name",
    placeholder: "Enter first name",
  },
  {
    name: "last_name",
    label: "Last Name",
    placeholder: "Enter last name",
  },
];

const defaultValues = {
  logo: "",
  first_name: "",
  last_name: "",
  email: "",
  number: "",
  address: "",
  assigned_to_id: "",
};

function PartiesPage() {
  const [filters, setFilters] = useState({
    first_name: "",
    last_name: "",
    logo: "",
  });

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
      queryClient.invalidateQueries({ queryKey: ["parties"] });
    },
    onError: (err) => {
      clearErrors();
      applyServerFormErrors(err, setError, "Could not add party.");
    },
  });

  const parties = data?.results ?? [];
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
              assigned_to_id: {
                options: employees ?? [],
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
            {createMutation.isPending ? "Adding Party..." : "Add Party"}
          </button>
        </form>
      }
      list={
        <>
          <div className="list-stack">
            {parties.map((party) => (
              <div
                key={party.id}
                onClick={() => navigate(`/parties/${party.id}`)}
                className="list-card"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-slate-900">
                        {party.first_name} {party.last_name}
                      </p>
                      <p className="meta-muted">
                        {party.address || "No address added"}
                      </p>
                    </div>

                    <span className="info-pill">
                      Logo: {party.logo || "N/A"}
                    </span>
                  </div>

                  <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    <div>
                      <p className="meta-label">Due</p>
                      <p className="meta-value text-red-500">{party.due}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="meta-label">Advance</p>
                      <p className="meta-value text-emerald-600">
                        {party.advance_balance}
                      </p>
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

export default PartiesPage;
