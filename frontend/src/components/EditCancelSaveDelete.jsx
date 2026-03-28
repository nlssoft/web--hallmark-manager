export default function ECSDButton({
  handleSave,
  handleCancel,
  handleEdit,
  handleDelete,
  isEditing,
}) {
  return (
    <div>
      {isEditing ? (
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-slate-400 text-white rounded"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
