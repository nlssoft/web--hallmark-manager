export default function CreateField({ type, label, name, value, onChange }) {
  // Define styles once to avoid repeating them 3 times
  const fieldClasses =
    "w-full px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="flex mb-5">
      {type === "textArea" ? (
        <textarea
          className={fieldClasses}
          rows={3}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={label}
        />
      ) : (
        <input
          type={type === "password" ? "password" : "text"}
          className={fieldClasses}
          name={name}
          placeholder={label}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
}
