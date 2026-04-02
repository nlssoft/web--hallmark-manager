export default function FiltersBar({ filters, onChange, fields }) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {fields.map((field) => (
          <div key={field.name} className="flex flex-col">
            <label className="text-[11px] text-gray-500 mb-1">
              {field.label || field.placeholder}
            </label>

            <input
              type={field.type || "text"}
              placeholder={field.placeholder}
              value={filters[field.name] || ""}
              onChange={(e) =>
                onChange({ ...filters, [field.name]: e.target.value })
              }
              className="w-full px-2.5 py-1.5 text-sm rounded-md bg-white 
              border border-gray-300 text-gray-900 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-all duration-150"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
