import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { createApiError, applyServerFormErrors } from "../api/error";
import CreateFieldsRenderer from "../components/CreateFieldsRenderer";
import useTitle from "../utils/useTitle.js";

const FIELDS = [
  {
    name: "username",
    label: "Username",
    type: "text",
    rules: { required: "Username is required" },
  },
  {
    name: "first_name",
    label: "First Name",
    type: "text",
  },
  {
    name: "last_name",
    label: "Last Name",
    type: "text",
  },
  {
    name: "email",
    label: "Email",
    type: "text",
    rules: { required: "Email is required" },
  },
  {
    name: "number",
    label: "Phone Number",
    type: "text",
  },
  {
    name: "address",
    label: "Address",
    type: "text",
  },
];

function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  useTitle("Register");

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

  const passwordValue =
    useWatch({
      control,
      name: "password",
    }) ?? "";

  async function onSubmit(data) {
    const { confirm_password: _confirm_password, ...payload } = data;
    try {
      await api.post("/auth/users/", payload);
      navigate("/login");
    } catch (err) {
      const apiError = createApiError(err);
      applyServerFormErrors(apiError, setError, "Registration failed.");
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card auth-card--wide section-card section-card--padded">
        <div className="auth-hero">
          <p className="section-kicker">Get Started</p>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-copy">
            Set up your Hallmark Manager workspace to manage records, parties,
            and daily operations.
          </p>
        </div>

        {errors.root?.serverError && (
          <p className="field-error" style={{ marginBottom: "0.5rem" }}>
            {errors.root.serverError.message}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          {/* All regular fields via renderer */}
          <CreateFieldsRenderer
            fields={FIELDS}
            control={control}
            errors={errors}
          />

          {/* Password — manual because of show/hide toggle */}
          <div className="form-field">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`app-input${errors.password ? " app-input--error" : ""}`}
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 8, message: "Minimum 8 characters" },
                })}
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword((p) => !p)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="field-error">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-field">
            <label className="form-label" htmlFor="confirm_password">
              Confirm Password
            </label>
            <div className="input-wrapper">
              <input
                id="confirm_password"
                type={showConfirm ? "text" : "password"}
                className={`app-input${errors.confirm_password ? " app-input--error" : ""}`}
                {...register("confirm_password", {
                  required: "Please confirm your password",
                  validate: (val) =>
                    val === passwordValue || "Passwords do not match",
                })}
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowConfirm((p) => !p)}
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="field-error">{errors.confirm_password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="primary-button w-full"
            style={{ marginTop: "0.25rem" }}
          >
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="page-link mx-auto"
          >
            Already have an account? Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
