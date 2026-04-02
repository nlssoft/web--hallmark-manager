export default function CreateField({
  type,
  label,
  name,
  value,
  onChange,
  options = [],
}) {
  const fieldClasses =
    "w-full px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

  if (type === "textArea") {
    return (
      <div>
        <textarea
          className={fieldClasses}
          rows={3}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={label}
        />
      </div>
    );
  }

  if (type === "select") {
    return (
      <div>
        <select
          className={fieldClasses}
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
      </div>
    );
  }

  return (
    <div>
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
    </div>
  );
}
