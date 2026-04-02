import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loadEmployees, createEmployees } from "../api/employees";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { applyServerFormErrors } from "../api/error.js";
import PaginationControls from "../components/PaginationControls";
import EarlyReturn from "../components/EarlyReturns";
import CreateFieldsRenderer from "../components/CreateFieldsRenderer";
import ListPageLayout from "../components/ListPageLayout";

const fields = [
  {
    label: "username",
    name: "username",
    rules: { required: "Username is required." },
  },
  {
    label: "password",
    name: "password",
    type: "password",
    rules: {
      required: "Password is required.",
    },
  },
  {
    label: "Confirm Password",
    name: "confirmPassword",
    type: "password",
    rules: {
      required: "Please confirm your password",
    },
  },
  {
    label: "First Name",
    name: "first_name",
    rules: {
      maxLength: {
        value: 150,
        message: "First name must be 150 characters or fewer.",
      },
    },
  },
  {
    label: "Last Name",
    name: "last_name",
    rules: {
      maxLength: {
        value: 150,
        message: "Last name must be 150 characters or fewer.",
      },
    },
  },

  {
    label: "Email",
    name: "email",
    rules: {
      required: "Email is required.",
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
      required: "Number is required.",
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
      required: "Address is required.",
      maxLength: {
        value: 255,
        message: "Address must be 255 characters or fewer.",
      },
    },
  },
];

const defaultValues = {
  username: "",
  password: "",
  confirmPassword: "",
  first_name: "",
  last_name: "",
  email: "",
  number: "",
  address: "",
};

function SubUserPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 20;
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
    queryKey: ["employees"],
    queryFn: loadEmployees,
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createEmployees(payload),
    onSuccess: () => {
      reset();
      clearErrors();
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err) => {
      clearErrors();
      applyServerFormErrors(err, setError, "Could not add employee.");
    },
  });

  const employees = data?.results ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / pageSize));

  function onSubmit(values) {
    if (values.password !== values.confirmPassword) {
      setError("confirmPassword", {
        type: "manual",
        message: "Password do not match",
      });
      return;
    }
    const { confirmPassword, ...payload } = values;
    createMutation.mutate(payload);
  }

  if (isLoading || isError) {
    return (
      <EarlyReturn isLoading={isLoading} isError={isError} error={error} />
    );
  }

  return (
    <ListPageLayout
      form={
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <CreateFieldsRenderer
            fields={fields}
            control={control}
            errors={errors}
          />

          {errors.root?.serverError?.message && (
            <p className="field-error">{errors.root.serverError.message}</p>
          )}

          <button
            disabled={createMutation.isPending}
            className="primary-button w-full"
            type="submit"
          >
            {createMutation.isPending ? "Adding Employee..." : "Add Employee"}
          </button>
        </form>
      }
      list={
        <>
          <div className="list-stack">
            {employees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => navigate(`${emp.id}/`)}
                className="list-card"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-slate-900">
                      {emp.username}
                    </p>
                    <p className="meta-muted">{emp.address}</p>
                  </div>

                  <span className="info-pill">{emp.email}</span>
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

export default SubUserPage;
