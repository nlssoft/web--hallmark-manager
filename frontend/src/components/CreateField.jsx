export default function CreateField({
  type,
  label,
  name,
  value,
  onChange,
  options = [],
  error,
}) {
  const fieldClasses = `app-input${error ? " app-input--error" : ""}`;

  if (type === "textArea") {
    return (
      <textarea
        className={`app-textarea${error ? " app-textarea--error" : ""}`}
        rows={4}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={label}
      />
    );
  }

  if (type === "select") {
    return (
      <select
        className={`app-select${error ? " app-select--error" : ""}`}
        name={name}
        value={value}
        onChange={onChange}
      >
        <option value="">-- {label} --</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={
        type === "password" ? "password" : type === "date" ? "date" : "text"
      }
      className={fieldClasses}
      name={name}
      placeholder={label}
      value={value}
      onChange={onChange}
    />
  );
}
