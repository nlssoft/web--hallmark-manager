export default function PartyFiltersBar({ filters, onChange }) {
  return (
    <div>
      <input
        placeholder="logo"
        value={filters.logo}
        onChange={(e) => onChange({ ...filters, logo: e.target.value })}
      />
      <input
        placeholder="First name"
        value={filters.first_name}
        onChange={(e) => onChange({ ...filters, first_name: e.target.value })}
      />
      <input
        placeholder="last name"
        value={filters.last_name}
        onChange={(e) => onChange({ ...filters, last_name: e.target.value })}
      />
    </div>
  );
}
