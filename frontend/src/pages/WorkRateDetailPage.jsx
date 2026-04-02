import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";

import { applyServerFormErrors } from "../api/error.js";
import { loadParties } from "../api/parties.js";
import { loadService } from "../api/serviceType.js";
import {
  getWorkRate,
  deleteWorkRate,
  updateWorkRate,
} from "../api/workRate.js";

import EarlyReturn from "../components/EarlyReturns.jsx";
import DetailPageLayout from "../components/DetailPageLayout.jsx";
import DetailFieldsRenderer from "../components/DetailFieldsRenderer.jsx";
import ECSDButton from "../components/EditCancelSaveDelete.jsx";
import ConfirmActionModal from "../components/ConfirmActionModal.jsx";
import GoBackButton from "../components/GoBackButton.jsx";

function workRateToForm(wr) {
  return {
    party_id: wr?.party_id ?? wr?.party?.id ?? "",
    service_type_id: wr?.service_type_id ?? wr?.service_type?.id ?? "",
    rate: wr?.rate ?? "",
  };
}

//initial state
const fields = [
  {
    label: "Party",
    elabel: "Party",
    type: "autocomplete",
    name: "party_id",
    rules: { required: "Party is required." },
    labelKey: "full_name",
    subLabelKey: "address",
    placeholder: "Party",
    editable: true,
  },
  {
    label: "Service",
    elabel: "Service",
    type: "autocomplete",
    name: "service_type_id",
    rules: {
      required: "Service type is required.",
    },
    labelKey: "type_of_work",
    placeholder: "Service type",
    editable: true,
  },
  {
    label: "Rate",
    name: "rate",
    editable: true,
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

function WorkRateDetailPage() {
  //States
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
  } = useForm({ defaultValues: workRateToForm() });

  // Api Call
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["workRate", id],
    queryFn: () => getWorkRate(id),
  });

  const { data: party } = useQuery({
    queryKey: ["parties"],
    queryFn: () => loadParties({ page_size: 1000 }).then((res) => res.results),
  });

  const { data: service } = useQuery({
    queryKey: ["service"],
    queryFn: loadService,
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => updateWorkRate(id, payload),
    onSuccess: (updatedWorkRate) => {
      queryClient.invalidateQueries({ queryKey: ["workRate", id] });
      queryClient.invalidateQueries({ queryKey: ["workRate"] });
      reset(workRateToForm(updatedWorkRate));
      clearErrors();
      setDeleteError("");
      setIsEditing(false);
    },
    onError: (err) => {
      clearPageState();
      applyServerFormErrors(err, setError, "Could not update work rate.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteWorkRate(id),
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["workRate"] });
      navigate("/work-rate/");
    },
    onError: (err) => {
      setDeleteError(err.message || "Could not delete work rate.");
    },
  });

  useEffect(() => {
    if (data && !isEditing) {
      reset(workRateToForm(data));
    }
  }, [data, isEditing, reset]);

  //less-coding function
  function clearPageState() {
    clearErrors();
    setDeleteError("");
  }

  function resetFormParty(workRate = data) {
    reset(workRateToForm(workRate));
  }

  //button function
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

  // model function
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

  // task perform function
  function onSubmit(values) {
    clearPageState();
    updateMutation.mutate(values);
  }

  //Early returns
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
          party_id: {
            options: party ?? [],
          },
          service_type_id: {
            options: service ?? [],
          },
        }}
        isEditing={isEditing}
      />

      {errors.root?.serverError?.message && (
        <p className="text-sm text-red-600">
          {errors.root.serverError.message}
        </p>
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
        to="/work-rate/"
        disabled={updateMutation.isPending || deleteMutation.isPending}
      />

      <ConfirmActionModal
        isOpen={isDeleteModalOpen}
        title="Delete Work Rate?"
        message={
          <>
            This will permanently delete{" "}
            <span className="font-medium">{data.party.full_name}</span>
            <span className="font-medium">
              {""} service: {data.service_type.type_of_work} Rate: {data.rate}
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

export default WorkRateDetailPage;
