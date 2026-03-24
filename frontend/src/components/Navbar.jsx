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
    <nav className="bg-white border-b border-gray-200 h-14 px-6 sticky top-0 z-50 flex items-center justify-between">
      <button
        onClick={() => navigate("/dashboard")}
        className="text-blue-600 text-lg font-semibold tracking-tight"
      >
        Hallmark Manager
      </button>

      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDropDownOpen((prev) => !prev);
          }}
          className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm hover:bg-gray-200 transition"
        >
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          {user?.username}
        </button>

        {dropDownOpen && (
          <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden z-50">
            <button
              onClick={() => {
                navigate("/profile/me");
                setDropDownOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
            >
              View Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
