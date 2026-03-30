export const createApiError = (err) => {
  const status = err.response?.status;
  const data = err.response?.data;

  const apiError = new Error("Something went wrong");

  if (status === 403) {
    apiError.message =
      typeof data?.detail === "string"
        ? data.detail
        : typeof data?.error === "string"
          ? data.error
          : "You are not allowed to access this page";
    return apiError;
  }

  if (status === 401) {
    apiError.message = "Session expired. Please login again.";
    return apiError;
  }

  if (status >= 500) {
    apiError.message = "Server error. Try again later.";
    return apiError;
  }

  if (typeof data === "string") {
    apiError.message = data;
    return apiError;
  }

  if (Array.isArray(data)) {
    apiError.message = data.map(String).join(" ");
    return apiError;
  }

  if (data && typeof data === "object") {
    const fieldErrors = Object.fromEntries(
      Object.entries(data)
        .map(([field, value]) => {
          const messages = (Array.isArray(value) ? value : [value])
            .filter(Boolean)
            .map(String);

          return [field, messages.join(" ")];
        })
        .filter(([, message]) => message),
    );

    if (Object.keys(fieldErrors).length > 0) {
      apiError.fieldErrors = fieldErrors;
      apiError.message =
        fieldErrors.non_field_errors ||
        fieldErrors.detail ||
        fieldErrors.error ||
        Object.values(fieldErrors).join(" ");
      return apiError;
    }
  }

  apiError.message = err.message || "Something went wrong";
  return apiError;
};

export function applyServerFormErrors(err, setError, fallbackMessage) {
  if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
    Object.entries(err.fieldErrors).forEach(([field, message]) => {
      if (
        field === "non_field_errors" ||
        field === "detail" ||
        field === "error"
      ) {
        setError("root.serverError", {
          type: "server",
          message,
        });
        return;
      }

      setError(field, {
        type: "server",
        message,
      });
    });
    return;
  }

  setError("root.serverError", {
    type: "server",
    message: err.message || fallbackMessage,
  });
}
