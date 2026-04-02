export default function EarlyReturn({ isLoading, isError, error }) {
  if (isLoading) {
    return (
      <div className="page-shell flex items-center justify-center px-4">
        <div className="status-panel section-card section-card--padded flex items-center gap-3">
          <div className="status-panel__spinner"></div>
          <span className="text-sm text-slate-700">Loading...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page-shell flex items-center justify-center px-4">
        <div className="status-panel section-card section-card--padded max-w-sm text-center">
          <p className="font-medium text-red-500">
            {error?.message || "Something went wrong"}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {error?.message?.includes("not allowed")
              ? "You do not have permission to view this."
              : "Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
