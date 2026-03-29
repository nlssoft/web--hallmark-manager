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
    variant === "danger"
      ? "rounded bg-red-600 px-4 py-2 text-white"
      : "rounded bg-blue-600 px-4 py-2 text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2
          id="confirm-action-title"
          className="text-lg font-semibold text-gray-900"
        >
          {title}
        </h2>

        <div className="mt-2 text-sm text-gray-600">{message}</div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded bg-slate-200 px-4 py-2 text-slate-800"
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
