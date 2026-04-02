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
        <label className="w-28 shrink-0 text-sm text-gray-500 pt-2">
          {label}
        </label>

        <div className="flex-1">
          {type === "textArea" ? (
            <textarea
              className={`w-full border rounded-xl px-4 py-2 transition-all duration-150
                ${
                  isEditing
                    ? "bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    : "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              rows={3}
              name={name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              readOnly={!isEditing}
            />
          ) : (
            <input
              className={`w-full border rounded-xl px-4 py-2 transition-all duration-150
                ${
                  isEditing
                    ? "bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                    : "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              name={name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              readOnly={!isEditing}
            />
          )}
        </div>
      </div>

      {error && <p className="ml-28 mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
