import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [dropDownOpen, setDropDownOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside() {
      if (dropDownOpen) setDropDownOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [dropDownOpen]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  if (loading) return null;

  return (
    <nav className="nav-shell">
      <div className="nav-inner">
        <button
          onClick={() => navigate("/dashboard")}
          className="brand-button"
        >
          <div className="brand-title">Hallmark Manager</div>
          <div className="brand-copy">Clean workflow for daily operations</div>
        </button>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDropDownOpen((prev) => !prev);
            }}
            className="user-button"
          >
            <div className="user-avatar">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-sm font-semibold text-slate-900">
                {user?.username}
              </div>
              <div className="text-xs text-slate-500">Account</div>
            </div>
          </button>

          {dropDownOpen && (
            <div className="user-menu">
              <button
                onClick={() => {
                  navigate("/profile/me");
                  setDropDownOpen(false);
                }}
              >
                View Profile
              </button>
              <button onClick={handleLogout} className="danger-text">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
