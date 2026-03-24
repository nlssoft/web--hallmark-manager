import { useNavigate } from "react-router-dom";

export default function DashboardCard({ title, path }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(path)}
      className="bg-slate-800 border border-slate-700 rounded-xl p-6 
      cursor-pointer hover:bg-slate-750 hover:border-yellow-400 
      transition-colors duration-150"
    >
      <h2 className="text-slate-100 text-sm font-medium m-0">{title}</h2>
    </div>
  );
}
