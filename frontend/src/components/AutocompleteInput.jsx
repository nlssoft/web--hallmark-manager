import { useState, useEffect, useRef } from "react";

export default function AutoCompleteInput({
  options = [],
  labelKey,
  subLabelKey,
  value,
  onChange,
  placeholder,
  isEditing = true,
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const selectedItem = options.find((item) => item.id === value);
    setSearch(selectedItem ? selectedItem[labelKey] : "");
  }, [value, options, labelKey]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filtered = options.filter((item) =>
    item[labelKey]?.toLowerCase().includes(search.toLowerCase()),
  );

  function handleSelect(item) {
    if (!isEditing) return;
    onChange(item.id);
    setSearch(item[labelKey]);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        disabled={!isEditing}
        className={`w-full px-3 py-1.5 rounded-md border 
          ${
            isEditing
              ? "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500"
              : "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        placeholder={placeholder || "search..."}
        value={search}
        onChange={(e) => {
          if (!isEditing) return;
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => isEditing && setOpen(true)}
      />

      {isEditing && open && filtered.length > 0 && (
        <div className="absolute w-full bg-white border border-gray-200 rounded-md mt-1 shadow-lg z-10 max-h-60 overflow-y-auto">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100"
            >
              <div className="text-sm font-medium text-gray-900">
                {item[labelKey]}
              </div>
              {subLabelKey && (
                <div className="text-xs text-gray-500">{item[subLabelKey]}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
