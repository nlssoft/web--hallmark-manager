export default function EditableField({
  type,
  label,
  name,
  value = "",
  onChange,
  onBlur,
  isEditing,
  error,
}) {
  return (
    <div className="mb-5">
      <div className="flex">
        <label className="w-24 shrink-0 text-gray-400 pt-1">{label}</label>

        <div className="flex-1">
          {type === "textArea" ? (
            <textarea
              className="w-full border rounded-2xl border-gray-400 p-3"
              rows={3}
              name={name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              readOnly={!isEditing}
            />
          ) : (
            <input
              className="w-full border rounded-2xl border-gray-400 p-3 hover:shadow-md hover:bg-gray-100"
              name={name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              readOnly={!isEditing}
            />
          )}
        </div>
      </div>

      {error && <p className="ml-24 mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
