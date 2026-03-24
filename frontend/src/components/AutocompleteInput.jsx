import { useState, useEffect } from "react";

export default function AutoCompleteInput({
  options = [],
  labelKey,
  subLabelKey,
  value,
  onChange,
  placeholder,
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  //sync assinged to user name
  useEffect(() => {
    const selectedItem = options.find((item) => item.id === value);
    setSearch(selectedItem ? selectedItem[labelKey] : "");
  }, [value, options, labelKey]);

  const filtered = options.filter((item) =>
    item[labelKey]?.toLowerCase().includes(search.toLowerCase()),
  );

  function handleSelect(item) {
    onChange(item.id);
    setSearch(item[labelKey]);
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        placeholder={placeholder || "search..."}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            background: "white",
            border: "1px solid #ccc",
            zIndex: 10,
            width: "100%",
          }}
        >
          {filtered.map((item) => (
            <div key={item.id} onClick={() => handleSelect(item)}>
              <div>{item[labelKey]}</div>
              {subLabelKey && (
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {item[subLabelKey]}{" "}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
