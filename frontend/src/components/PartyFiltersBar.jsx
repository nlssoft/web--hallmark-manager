export default function PartyFiltersBar({ filters, onChange }) {
  return (
    <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-sm p-3 mb-3 rounded-xl boder boder-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          className="w-full px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="logo"
          value={filters.logo}
          onChange={(e) => onChange({ ...filters, logo: e.target.value })}
        />
        <input
          className="w-full px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="First name"
          value={filters.first_name}
          onChange={(e) => onChange({ ...filters, first_name: e.target.value })}
        />
        <input
          className="w-full px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="last name"
          value={filters.last_name}
          onChange={(e) => onChange({ ...filters, last_name: e.target.value })}
        />
      </div>
    </div>
  );
}
