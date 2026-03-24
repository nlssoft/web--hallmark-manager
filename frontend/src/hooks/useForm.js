import { useState } from "react";

export function useForm(initialState) {
  const [formData, setFormData] = useState(initialState);

  function handleFormChange(e) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function resetForm() {
    setFormData(initialState);
  }
  return { formData, resetForm, handleFormChange };
}
