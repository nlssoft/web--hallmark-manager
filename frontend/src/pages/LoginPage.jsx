import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/auth-context.js";
import { createApiError, applyServerFormErrors } from "../api/error";
import useTitle from "../utils/useTitle.js";

function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  useTitle("Login");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

  async function onSubmit(data) {
    try {
      await api.post("/auth/login/", data);
      const profile = await api.get("/auth/profile/me/");
      setUser(profile.data);
      navigate("/dashboard");
    } catch (err) {
      const apiError = createApiError(err);

      // Humanize in BOTH places
      if (
        apiError.message === "invalid credentials" ||
        apiError.fieldErrors?.error === "invalid credentials"
      ) {
        const humanMessage =
          "Incorrect username or password. Please try again.";
        apiError.message = humanMessage;
        if (apiError.fieldErrors) {
          apiError.fieldErrors.error = humanMessage;
        }
      }

      applyServerFormErrors(
        apiError,
        setError,
        "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card section-card section-card--padded">
        <div className="auth-hero">
          <p className="section-kicker">Welcome Back</p>
          <h1 className="auth-title">Sign in to Hallmark Manager</h1>
          <p className="auth-copy">
            A lighter and cleaner workspace daily tasks.
          </p>
        </div>

        {errors.root?.serverError && (
          <p className="field-error" style={{ marginBottom: "0.5rem" }}>
            {errors.root.serverError.message}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-field">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className={`app-input${errors.username ? " app-input--error" : ""}`}
              {...register("username", { required: "Username is required" })}
            />
            {errors.username && (
              <p className="field-error">{errors.username.message}</p>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`app-input${errors.password ? " app-input--error" : ""}`}
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && (
              <p className="field-error">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="primary-button w-full"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/forgot-password/")}
            className="page-link mx-auto"
          >
            Forgot your password?
          </button>

          <button
            type="button"
            onClick={() => navigate("/register")}
            className="page-link mx-auto"
          >
            Don't have an account? Create one
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
