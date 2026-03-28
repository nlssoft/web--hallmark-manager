export default function EarlyReturn({ isLoading, isError, error }) {
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white px-6 py-4 rounded-lg shadow-sm flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white px-6 py-4 rounded-lg shadow-sm text-center max-w-sm">
          <p className="text-red-500 font-medium">
            {error?.message || "Something went wrong"}
          </p>

          <p className="text-gray-500 text-sm mt-1">
            {error?.message?.includes("not allowed")
              ? "You don’t have permission to view this."
              : "Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
