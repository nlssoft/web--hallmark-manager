import { useNavigate } from "react-router-dom";

export default function GoBackButton({ to, label = "← Go Back", disabled }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto mt-6 flex justify-center">
      <button
        disabled={disabled}
        onClick={() => navigate(to)}
        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition"
      >
        {label}
      </button>
    </div>
  );
}
