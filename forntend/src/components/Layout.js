import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../store/authStore";

export default function Layout() {
  const logout = useAuth(s => s.logout);

  return (
    <>
      <nav style={{ padding: 10, borderBottom: "1px solid #ccc" }}>
        <Link to="/" style={{ marginRight: 10 }}>Dashboard</Link>
        <Link to="/parties" style={{ marginRight: 10 }}>Parties</Link>
        <button onClick={logout}>Logout</button>
      </nav>

      <main style={{ padding: 20 }}>
        <Outlet />
      </main>
    </>
  );
}
