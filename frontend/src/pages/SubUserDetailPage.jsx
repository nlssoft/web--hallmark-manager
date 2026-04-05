import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteEmployee,
  getEmployee,
  updateEmployee,
} from "../api/employees.js";
import { applyServerFormErrors } from "../api/error.js";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

import GoBackButton from "../components/GoBackButton.jsx";
import DetailPageLayout from "../components/DetailPageLayout.jsx";
import ECSDButton from "../components/EditCancelSaveDelete.jsx";
import EarlyReturn from "../components/EarlyReturns.jsx";
import ConfirmActionModal from "../components/ConfirmActionModal.jsx";
import DetailFieldsRenderer from "../components/DetailFieldsRenderer.jsx";

function employeeToForm(employee) {
  return {
    username: employee?.username ?? "",
    first_name: employee?.first_name ?? "",
    last_name: employee?.last_name ?? "",
    number: employee?.number ?? "",
    email: employee?.email ?? "",
    address: employee?.address ?? "",
    joined_at: employee?.joined_at ?? "",
  };
}

const fields = [
  { label: "Username", name: "username", editable: false },
  {
    label: "First Name",
    name: "first_name",
    editable: true,
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
    editable: true,
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
    editable: true,
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
    editable: true,
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
    editable: true,
    rules: {
      required: "Address is required.",
      maxLength: {
        value: 255,
        message: "Address must be 255 characters or fewer.",
      },
    },
  },
  { label: "Joined On", name: "joined_at", editable: false },
];

function SubUserDetailPage() {
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    reset,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm({ defaultValues: employeeToForm() });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => getEmployee(id),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => updateEmployee(id, payload),
    onSuccess: (updatedEmployee) => {
      queryClient.invalidateQueries({ queryKey: ["employee", id] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      reset(employeeToForm(updatedEmployee));
      clearErrors();
      setDeleteError("");
      setIsEditing(false);
    },
    onError: (err) => {
      clearPageState();
      applyServerFormErrors(err, setError, "Could not update employee.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEmployee(id),
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      navigate("/sub-user/");
    },
    onError: (err) => {
      setDeleteError(err.message || "Could not delete employee.");
    },
  });

  useEffect(() => {
    if (data && !isEditing) {
      reset(employeeToForm(data));
    }
  }, [data, isEditing, reset]);

  function clearPageState() {
    clearErrors();
    setDeleteError("");
  }

  function resetFromEmployee(employee = data) {
    reset(employeeToForm(employee));
  }

  function handleEdit() {
    resetFromEmployee();
    clearPageState();
    setIsEditing(true);
  }

  function handleCancel() {
    resetFromEmployee();
    clearPageState();
    setIsEditing(false);
  }

  function openDeleteModal() {
    setDeleteError("");
    setIsDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    if (deleteMutation.isPending) return;
    setDeleteError("");
    setIsDeleteModalOpen(false);
  }

  function confirmDelete() {
    setDeleteError("");
    deleteMutation.mutate();
  }

  function onSubmit(values) {
    clearPageState();
    updateMutation.mutate(values);
  }

  if (isLoading || isError) {
    return (
      <EarlyReturn isLoading={isLoading} isError={isError} error={error} />
    );
  }

  return (
    <DetailPageLayout>
      <DetailFieldsRenderer
        fields={fields}
        control={control}
        errors={errors}
        isEditing={isEditing}
      />

      {errors.root?.serverError?.message && (
        <p className="field-error">{errors.root.serverError.message}</p>
      )}

      <ECSDButton
        isEditing={isEditing}
        handleCancel={handleCancel}
        handleEdit={handleEdit}
        handleSave={handleSubmit(onSubmit)}
        handleDelete={openDeleteModal}
        isSaving={updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />

      <GoBackButton
        to="/sub-user/"
        label={"Go back To Users"}
        disabled={updateMutation.isPending || deleteMutation.isPending}
      />

      <ConfirmActionModal
        isOpen={isDeleteModalOpen}
        title="Delete employee?"
        message={
          <>
            This will permanently delete{" "}
            <span className="font-medium">{data.username}</span>.
          </>
        }
        error={deleteError}
        isPending={deleteMutation.isPending}
        confirmText="Yes, delete"
        pendingText="Deleting..."
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />
    </DetailPageLayout>
  );
}

export default SubUserDetailPage;
