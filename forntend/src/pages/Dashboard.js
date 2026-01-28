import { Link } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Business control center</p>
      </header>

      <section className="dashboard-grid">
        <Link to="/parties" className="dashboard-card card-blue">
          <h3>Parties</h3>
          <p>Create and manage parties</p>
        </Link>

        <Link to="/service-types" className="dashboard-card card-green">
          <h3>Service Types</h3>
          <p>Manage available services</p>
        </Link>

        <Link to="/work-rates" className="dashboard-card card-yellow">
          <h3>Work Rates</h3>
          <p>Define service pricing</p>
        </Link>

        <Link to="/records" className="dashboard-card card-purple">
          <h3>Records</h3>
          <p>View work records</p>
        </Link>

        <Link to="/payments" className="dashboard-card card-red">
          <h3>Payments</h3>
          <p>Track payments</p>
        </Link>

        <Link to="/summary" className="dashboard-card card-teal">
          <h3>Summary</h3>
          <p>Business overview</p>
        </Link>
      </section>
    </div>
  );
}
