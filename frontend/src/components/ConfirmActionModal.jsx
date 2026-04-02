export default function ConfirmActionModal({
  isOpen,
  title,
  message,
  error,
  isPending = false,
  confirmText = "Confirm",
  pendingText = "Working...",
  cancelText = "Cancel",
  variant = "danger",
  onCancel,
  onConfirm,
}) {
  if (!isOpen) return null;

  const confirmButtonClass =
    variant === "danger" ? "danger-button" : "primary-button";

  return (
    <div className="modal-overlay">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        className="modal-card section-card section-card--padded"
      >
        <h2 id="confirm-action-title" className="text-xl font-semibold text-slate-900">
          {title}
        </h2>

        <div className="mt-2 text-sm text-slate-600">{message}</div>

        {error && <p className="field-error mt-3">{error}</p>}

        <div className="modal-actions mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="secondary-button"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={confirmButtonClass}
          >
            {isPending ? pendingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
