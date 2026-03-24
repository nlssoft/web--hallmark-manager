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
    <nav className="bg-slate-900 border-b border-slate-800 h-15 px-6 flex items-center justify-between">
      <button
        onClick={() => navigate("/dashboard")}
        className="text-yellow-400 text-lg font-semibold tracking-wide bg-transparent border-none cursor-pointer"
      >
        Hallmark Manager
      </button>

      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDropDownOpen((prev) => !prev);
          }}
          className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-yellow-400 text-slate-900 font-bold text-xs flex items-center justify-center">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          {user?.username}
        </button>

        {dropDownOpen && (
          <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-50">
            <button
              onClick={() => {
                navigate("/profile/me");
                setDropDownOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-slate-200 border-b border-slate-700 hover:bg-slate-700 bg-transparent cursor-pointer"
            >
              View Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-700 bg-transparent cursor-pointer"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
