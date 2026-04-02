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
  const fieldClass = [
    type === "textArea" ? "app-textarea" : "app-input",
    !isEditing
      ? type === "textArea"
        ? "app-textarea--readonly"
        : "app-input--readonly"
      : "",
    error
      ? type === "textArea"
        ? "app-textarea--error"
        : "app-input--error"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-2">
      <div className="inline-field">
        <label className="inline-field__label" htmlFor={name}>
          {label}
        </label>

        <div className="min-w-0">
          {type === "textArea" ? (
            <textarea
              id={name}
              className={fieldClass}
              rows={4}
              name={name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              readOnly={!isEditing}
            />
          ) : (
            <input
              id={name}
              type={
                type === "password" ? "password" : type === "date" ? "date" : "text"
              }
              className={fieldClass}
              name={name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              readOnly={!isEditing}
            />
          )}
        </div>
      </div>

      {error && <p className="field-error sm:ml-[140px]">{error}</p>}
    </div>
  );
}
