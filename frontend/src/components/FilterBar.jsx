export default function FiltersBar({ filters, onChange, fields }) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {fields.map((field) => (
          <div key={field.name} className="form-field">
            <label className="form-label" htmlFor={field.name}>
              {field.label || field.placeholder}
            </label>

            <input
              id={field.name}
              type={field.type || "text"}
              placeholder={field.placeholder}
              value={filters[field.name] || ""}
              onChange={(e) =>
                onChange({ ...filters, [field.name]: e.target.value })
              }
              className="app-input"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
