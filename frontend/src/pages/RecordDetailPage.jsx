import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";

import { applyServerFormErrors } from "../api/error.js";
import { loadParties } from "../api/parties.js";
import { loadService } from "../api/serviceType.js";
import { getRecord, deleteRecord, patchRecord } from "../api/record.js";

import EarlyReturn from "../components/EarlyReturns.jsx";
import DetailPageLayout from "../components/DetailPageLayout.jsx";
import DetailFieldsRenderer from "../components/DetailFieldsRenderer.jsx";
import ECSDButton from "../components/EditCancelSaveDelete.jsx";
import ConfirmActionModal from "../components/ConfirmActionModal.jsx";
import GoBackButton from "../components/GoBackButton.jsx";
import EditableField from "../components/EditableField.jsx";

function recordToForm(r) {
  return {
    party_id: r?.party_id ?? r?.party?.id ?? "",
    service_type_id: r?.service_type_id ?? r?.service_type?.id ?? "",
    rate: r?.rate ?? "",
    pcs: r?.pcs ?? "",
    amount: r?.amount ?? "",
    discount: r?.discount ?? "",
    record_date: r?.record_date ?? "",
    paid_amount: r?.paid_amount ?? 0,
    reason: r?.reason ?? "",
  };
}

const fields = [
  {
    label: "Party",
    elabel: "Party",
    type: "autocomplete",
    name: "party_id",
    editable: false,
    labelKey: "full_name",
    subLabelKey: "address",
    placeholder: "Party",
  },
  {
    label: "Service type",
    elabel: "Service",
    type: "autocomplete",
    name: "service_type_id",
    editable: false,
    labelKey: "type_of_work",
    placeholder: "Service type",
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
  {
    label: "Pcs",
    name: "pcs",
    editable: true,
    rules: {
      required: "Pcs is required.",
      min: {
        value: 1,
        message: "Pcs cannot be less then 1.",
      },
    },
  },
  {
    label: "Amount",
    name: "amount",
    editable: false,
  },
  {
    label: "Discount",
    name: "discount",
    editable: true,
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
    editable: false,
  },
  {
    label: "Paid amount",
    name: "paid_amount",
    editable: false,
  },
];

const reasonField = {
  label: "Reason",
  type: "textArea",
  name: "reason",
  editable: true,
};

function RecordDetailPage() {
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const detailFields = isEditing ? [...fields, reasonField] : fields;

  const {
    control,
    handleSubmit,
    reset,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm({ defaultValues: recordToForm() });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["record", id],
    queryFn: () => getRecord(id),
  });

  const { data: party } = useQuery({
    queryKey: ["party"],
    queryFn: () => loadParties({ page_size: 1000 }).then((res) => res.results),
  });

  const { data: service } = useQuery({
    queryKey: ["service"],
    queryFn: loadService,
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => patchRecord(id, payload),
    onSuccess: (updatedWorkRate) => {
      queryClient.invalidateQueries({ queryKey: ["record", id] });
      queryClient.invalidateQueries({ queryKey: ["record"] });
      reset(recordToForm(updatedWorkRate));
      clearErrors();
      setDeleteError("");
      setIsEditing(false);
    },
    onError: (err) => {
      clearPageState();
      applyServerFormErrors(err, setError, "Could not update record.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRecord(id),
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["record"] });
      navigate("/record/");
    },
    onError: (err) => {
      setDeleteError(err.message || "Could not delete record.");
    },
  });

  useEffect(() => {
    if (data && !isEditing) {
      reset(recordToForm(data));
    }
  }, [data, isEditing, reset]);

  function clearPageState() {
    clearErrors();
    setDeleteError("");
  }

  function resetFormParty(workRate = data) {
    reset(recordToForm(workRate));
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

    const payload = {
      rate: values.rate,
      pcs: values.pcs,
      discount: values.discount,
      ...(values.reason?.trim() ? { reason: values.reason.trim() } : {}),
    };
    updateMutation.mutate(payload);
  }

  if (isLoading || isError) {
    return (
      <EarlyReturn isLoading={isLoading} isError={isError} error={error} />
    );
  }

  return (
    <DetailPageLayout>
      <DetailFieldsRenderer
        fields={detailFields}
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
        to="/record/"
        disabled={updateMutation.isPending || deleteMutation.isPending}
      />

      <ConfirmActionModal
        isOpen={isDeleteModalOpen}
        title="Delete Record?"
        message={
          <>
            This will permanently delete{" "}
            <span className="font-medium">{data.party.full_name}</span>
            <span className="font-medium">
              {""} service: {data.service_type.type_of_work} Rate: {data.pcs}{" "}
              Date: {data.record_date}
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

export default RecordDetailPage;
