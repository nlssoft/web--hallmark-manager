import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  // TEMP user placeholder (later you can load real name)
  const userInitial = "A";

  const [open, setOpen] = useState(false);

  const logout = () => {
    // Remove JWT tokens
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    // Optional: clear any cached user data later
    // localStorage.clear();

    // Redirect to login
    navigate("/login");
  };

  return (
    <div className="dashboard-page">
      {/* HEADER */}
      <header className="dashboard-header-row">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Overview of your work & activity</p>
        </div>

        {/* PROFILE MENU */}
        <div className="profile-wrapper">
          <div
            className="profile-trigger"
            onClick={() => setOpen(!open)}
          >
            <div className="profile-avatar">
              {userInitial}
            </div>
            <span className="profile-arrow">▾</span>
          </div>

          {open && (
            <div className="profile-menu">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/profile");
                }}
              >
                Profile
              </button>

              <button
                className="logout"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* GRID */}
      <div className="dashboard-grid">
        <Link to="/parties" className="dashboard-card card-blue">
          <h3>Parties</h3>
          <p>Manage clients and balances</p>
        </Link>

        <Link to="/records" className="dashboard-card card-green">
          <h3>Records</h3>
          <p>Track work entries</p>
        </Link>

        <Link to="/payments" className="dashboard-card card-yellow">
          <h3>Payments</h3>
          <p>View and manage payments</p>
        </Link>

        <Link to="/work-rates" className="dashboard-card card-purple">
          <h3>Work Rates</h3>
          <p>Rates per party & service</p>
        </Link>

        <Link to="/service-types" className="dashboard-card card-teal">
          <h3>Service Types</h3>
          <p>Overview of services</p>
        </Link>

        <Link to="/summary" className="dashboard-card card-red">
          <h3>Summary</h3>
          <p>Business overview & totals</p>
        </Link>

        <Link to="/audit-log" className="dashboard-card card-slate">
          <h3>Audit Log</h3>
          <p>System activity & history</p>
        </Link>
      </div>
    </div>
  );
}
