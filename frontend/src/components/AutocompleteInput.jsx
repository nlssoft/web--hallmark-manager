import { useEffect, useRef, useState } from "react";

export default function AutoCompleteInput({
  id,
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
  const [hasTyped, setHasTyped] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selectedItem = options.find((item) => item.id === value);
  const selectedLabel = selectedItem ? selectedItem[labelKey] : "";
  const activeSearch = hasTyped ? search : selectedLabel;
  const displayValue = isEditing ? activeSearch : selectedLabel;

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
    item[labelKey]?.toLowerCase().includes(activeSearch.toLowerCase()),
  );

  function handleSelect(item) {
    if (!isEditing) return;
    onChange(item.id);
    setSearch("");
    setHasTyped(false);
    setOpen(false);
  }

  const inputClasses = `app-input${
    isEditing ? "" : " app-input--readonly"
  }${error ? " app-input--error" : ""}`;

  return (
    <div>
      <div className={elabel ? "inline-field" : ""}>
        {elabel && (
          <label className="inline-field__label" htmlFor={id}>
            {elabel}
          </label>
        )}

        <div
          ref={wrapperRef}
          className={elabel ? "relative min-w-0" : "relative"}
        >
          <input
            id={id}
            disabled={!isEditing}
            className={inputClasses}
            placeholder={placeholder || "search..."}
            value={displayValue}
            onChange={(e) => {
              if (!isEditing) return;
              setSearch(e.target.value);
              setHasTyped(true);
              setOpen(true);
            }}
            onBlur={(e) => {
              setOpen(false);
              onBlur?.(e);
            }}
            onFocus={() => isEditing && setOpen(true)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
          />

          {isEditing && open && filtered.length > 0 && (
            <div className="absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-[20px] border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(item);
                  }}
                  className="cursor-pointer px-4 py-3 transition-colors hover:bg-blue-50"
                >
                  <div className="font-medium text-slate-900">
                    {item[labelKey]}
                  </div>
                  {subLabelKey && (
                    <div className="text-xs text-slate-500">
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
