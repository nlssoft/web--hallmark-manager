import { useState, useEffect, useRef } from "react";

export default function AutoCompleteInput({
  options = [],
  labelKey,
  subLabelKey,
  value,
  onChange,
  onBlur,
  placeholder,
  elabel,
  error,
  isEditing = true,
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const selectedItem = options.find((item) => item.id === value);
    setSearch(selectedItem ? selectedItem[labelKey] : "");

    if (!isEditing) {
      setOpen(false);
    }
  }, [value, options, labelKey, isEditing]);

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

  const inputClasses = `w-full border rounded-xl px-4 py-2 transition-all duration-150 ${
    isEditing
      ? error
        ? "bg-white border-red-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        : "bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
      : "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
  }`;

  return (
    <div className="mb-5">
      <div className={elabel ? "flex" : ""}>
        {elabel && (
          <label className="w-28 shrink-0 pt-2 text-sm text-gray-500">
            {elabel}
          </label>
        )}

        <div ref={wrapperRef} className={elabel ? "relative flex-1" : "relative"}>
          <input
            disabled={!isEditing}
            className={inputClasses}
            placeholder={placeholder || "search..."}
            value={search}
            onChange={(e) => {
              if (!isEditing) return;
              setSearch(e.target.value);
              setOpen(true);
            }}
            onBlur={onBlur}
            onFocus={() => isEditing && setOpen(true)}
          />

          {isEditing && open && filtered.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-md">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="cursor-pointer px-4 py-2 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-gray-800">
                    {item[labelKey]}
                  </div>
                  {subLabelKey && (
                    <div className="text-xs text-gray-500">
                      {item[subLabelKey]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
