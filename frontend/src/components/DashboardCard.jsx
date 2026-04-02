import { useNavigate } from "react-router-dom";

export default function DashboardCard({ title, path }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(path)}
      className="dashboard-card text-left"
    >
      <h2 className="dashboard-card__title">{title}</h2>
      <p className="dashboard-card__copy">Open this workspace</p>
    </button>
  );
}
