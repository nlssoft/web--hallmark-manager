import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function ProtectedRoute({ children }) {
  const access = useAuthStore((s) => s.access);
  if (!access) return <Navigate to="/login" replace />;
  return children;
}
