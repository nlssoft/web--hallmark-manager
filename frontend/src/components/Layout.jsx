import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/parties", label: "Parties" },
  { to: "/records", label: "Records" },
  { to: "/profile", label: "Profile" },
];

export default function Layout({ user, onLogout, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h2>Manager</h2>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="main-area">
        <header className="topbar">
          <div>
            <strong>{user?.username || "User"}</strong>
            <p>{user?.email || ""}</p>
          </div>
          <button onClick={onLogout}>Logout</button>
        </header>
        <main>{children}</main>
      </section>
    </div>
  );
}
