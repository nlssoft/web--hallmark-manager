export default function FiltersBar({ filters, onChange, fields }) {
  return (
    <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-sm p-3 mb-3 rounded-xl border border-gray-200">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {fields.map((field) => (
          <input
            key={field.name}
            type={field.type || "text"}
            placeholder={field.placeholder}
            value={filters[field.name]}
            onChange={(e) =>
              onChange({ ...filters, [field.name]: e.target.value })
            }
            className="w-full px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ))}
      </div>
    </div>
  );
}
