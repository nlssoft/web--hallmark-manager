export default function EditableField({
  type,
  label,
  name,
  value,
  onChange,
  isEditing,
}) {
  return (
    <div className="flex mb-5">
      <label className="w-24 shrink-0 text-gray-400 pt-1">{label}</label>
      {type === "textArea" ? (
        <textarea
          className="flex-1 border  rounded-2xl border-gray-400 p-3"
          rows={3}
          name={name}
          value={value}
          onChange={onChange}
          readOnly={!isEditing}
        ></textarea>
      ) : (
        <input
          className="flex-1 border  rounded-2xl border-gray-400 p-3 hover:shadow-md hover:bg-gray-100  transitions"
          name={name}
          value={value}
          onChange={onChange}
          readOnly={!isEditing}
        />
      )}
    </div>
  );
}
