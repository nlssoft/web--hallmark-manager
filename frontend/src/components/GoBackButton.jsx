import { useNavigate } from "react-router-dom";

export default function GoBackButton({ to, label = "Go Back", disabled }) {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center">
      <button
        disabled={disabled}
        onClick={() => navigate(to)}
        className="page-link"
      >
        {label}
      </button>
    </div>
  );
}
