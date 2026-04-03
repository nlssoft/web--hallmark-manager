import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";

import { applyServerFormErrors } from "../api/error.js";
import { loadParties } from "../api/parties.js";
import { getPayment, deletePayment, patchPayment } from "../api/payment.js";

import EarlyReturn from "../components/EarlyReturns.jsx";
import DetailPageLayout from "../components/DetailPageLayout.jsx";
import DetailFieldsRenderer from "../components/DetailFieldsRenderer.jsx";
import ECSDButton from "../components/EditCancelSaveDelete.jsx";
import ConfirmActionModal from "../components/ConfirmActionModal.jsx";
import GoBackButton from "../components/GoBackButton.jsx";
import EditableField from "../components/EditableField.jsx";

function paymentToForm(p) {
  return {
    party_id: p?.party_id ?? p?.party?.id ?? "",
    party_address: p?.party?.address ?? "",
    amount: p?.amount ?? "",
    payment_date: p?.payment_date ?? "",
    reason: p?.reason ?? "",
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
    label: "Party address",
    name: "party_address",
    type: "textArea",
    editable: false,
  },
  {
    label: "Amount",
    name: "amount",
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
    name: "payment_date",
    editable: false,
  },
];

const reasonField = {
  label: "Reason",
  type: "textArea",
  name: "reason",
  editable: true,
};

function PaymentDetailPage() {
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
  } = useForm({ defaultValues: paymentToForm() });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["payment", id],
    queryFn: () => getPayment(id),
  });

  const { data: party } = useQuery({
    queryKey: ["party"],
    queryFn: () => loadParties({ page_size: 1000 }).then((res) => res.results),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => patchPayment(id, payload),
    onSuccess: (updatedPayment) => {
      queryClient.invalidateQueries({ queryKey: ["payment", id] });
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      reset(paymentToForm(updatedPayment));
      clearErrors();
      setDeleteError("");
      setIsEditing(false);
    },
    onError: (err) => {
      clearPageState();
      applyServerFormErrors(err, setError, "Could not update payment.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePayment(id),
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      navigate("/payment/");
    },
    onError: (err) => {
      setDeleteError(err.message || "Could not delete payment.");
    },
  });

  useEffect(() => {
    if (data && !isEditing) {
      reset(paymentToForm(data));
    }
  }, [data, isEditing, reset]);

  function clearPageState() {
    clearErrors();
    setDeleteError("");
  }

  function resetFormParty(payment = data) {
    reset(paymentToForm(payment));
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
      amount: values.amount,
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
        to="/payment/"
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
              {""} amount: {data.amount}
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

export default PaymentDetailPage;
