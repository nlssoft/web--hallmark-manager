export default function PaginationControls({
  page,
  totalPages,
  onPageChange,
  showBack = false,
  onBack,
}) {
  function getPages() {
    const pages = [];

    const start = Math.max(page - 2, 1);
    const end = Math.min(page + 2, totalPages);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  }

  const pages = getPages();

  return (
    <div className="flex flex-col items-center gap-4 pt-2">
      <div className="page-button-row">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="secondary-button page-button"
        >
          Prev
        </button>

        {pages.map((p, index) =>
          p === "..." ? (
            <span key={index} className="px-1 text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`page-button ${
                page === p
                  ? "primary-button page-button--active"
                  : "secondary-button"
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="secondary-button page-button"
        >
          Next
        </button>
      </div>

      {showBack && (
        <button type="button" onClick={onBack} className="page-link">
          Go Back
        </button>
      )}
    </div>
  );
}
