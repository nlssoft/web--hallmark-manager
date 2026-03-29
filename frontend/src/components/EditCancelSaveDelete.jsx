export default function ECSDButton({
  handleSave,
  handleCancel,
  handleEdit,
  handleDelete,
  isEditing,
  isSaving = false,
  isDeleting = false,
}) {
  return (
    <div>
      {isEditing ? (
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 bg-slate-400 text-white rounded"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={handleEdit}
            disabled={isDeleting}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      )}
    </div>
  );
}
