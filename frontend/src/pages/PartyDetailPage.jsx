import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { deleteParty, getParty, updateParty } from "../api/parties";
import { loadEmployees } from "../api/employees.js";
import { applyServerFormErrors } from "../api/error.js";

import EarlyReturn from "../components/EarlyReturns.jsx";
import DetailPageLayout from "../components/DetailPageLayout.jsx";
import DetailFieldsRenderer from "../components/DetailFieldsRenderer.jsx";
import ECSDButton from "../components/EditCancelSaveDelete.jsx";
import ConfirmActionModal from "../components/ConfirmActionModal.jsx";
import GoBackButton from "../components/GoBackButton.jsx";

function partyToForm(party) {
  return {
    logo: party?.logo ?? "",
    first_name: party?.first_name ?? "",
    last_name: party?.last_name ?? "",
    number: party?.number ?? "",
    email: party?.email ?? "",
    address: party?.address ?? "",
    assigned_to_id: party?.assigned_to?.id ?? "",
    due: party?.due ?? "",
    advance_balance: party?.advance_balance ?? "",
  };
}

const fields = [
  { label: "Logo", name: "logo", editable: true },
  {
    label: "First Name",
    name: "first_name",
    editable: true,
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
    editable: true,
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
    editable: true,
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
    editable: true,
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
    editable: true,
    rules: {
      maxLength: {
        value: 255,
        message: "Address must be 255 characters or fewer.",
      },
    },
  },
  {
    label: "Assigned to",
    elabel: "Assigned to",
    name: "assigned_to_id",
    type: "autocomplete",
    labelKey: "username",
    subLabelKey: "address",
    placeholder: "Assigned to",
    editable: true,
  },
];

function PartyDetailPage() {
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
  } = useForm({ defaultValues: partyToForm() });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["party", id],
    queryFn: () => getParty(id),
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => loadEmployees().then((res) => res.results),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => updateParty(id, payload),
    onSuccess: (updatedParty) => {
      queryClient.invalidateQueries({ queryKey: ["party", id] });
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      reset(partyToForm(updatedParty));
      clearErrors();
      setDeleteError("");
      setIsEditing(false);
    },
    onError: (err) => {
      clearPageState();
      applyServerFormErrors(err, setError, "Could not update party.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteParty(id),
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      navigate("/parties/");
    },
    onError: (err) => {
      setDeleteError(err.message || "Could not delete party.");
    },
  });

  useEffect(() => {
    if (data && !isEditing) {
      reset(partyToForm(data));
    }
  }, [data, isEditing, reset]);

  function clearPageState() {
    clearErrors();
    setDeleteError("");
  }

  function resetFormParty(party = data) {
    reset(partyToForm(party));
  }

  function handleEdit() {
    resetFormParty();
    clearPageState();
    setIsEditing(true);
  }

  function handleCancel() {
    resetFormParty();
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
        fieldProps={{
          assigned_to_id: {
            options: employees ?? [],
          },
        }}
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
        to="/parties/"
        disabled={updateMutation.isPending || deleteMutation.isPending}
      />

      <ConfirmActionModal
        isOpen={isDeleteModalOpen}
        title="Delete Party?"
        message={
          <>
            This will permanently delete{" "}
            <span className="font-medium">
              {data.first_name} {data.last_name}
            </span>
            .
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

export default PartyDetailPage;
