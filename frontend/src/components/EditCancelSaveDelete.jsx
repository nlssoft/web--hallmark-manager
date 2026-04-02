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
    <div className="section-actions">
      {isEditing ? (
        <>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="primary-button"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="secondary-button"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <button
            onClick={handleEdit}
            disabled={isDeleting}
            className="primary-button"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="danger-button"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </>
      )}
    </div>
  );
}
