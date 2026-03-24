export default function EditableField({
  label,
  name,
  value,
  onChange,
  isEditing,
}) {
  return (
    <div>
      <label>{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        readOnly={!isEditing}
      />
    </div>
  );
}
