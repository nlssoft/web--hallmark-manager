import DashboardCard from "../components/DashboardCard";
import Navbar from "../components/Navbar";
import useTitle from "../utils/useTitle.js";

const cards = [
  { title: "Payment Request", path: "/payment-request" },
  { title: "Parties", path: "/parties" },
  { title: "Service Type", path: "/service-type" },
  { title: "Work Rate", path: "/work-rate" },
  { title: "Record", path: "/record" },
  { title: "Payment", path: "/payment" },
  { title: "Summary", path: "/summary" },
  { title: "Audit", path: "/audit" },
  { title: "Advance Ledger", path: "/advance-ledger" },
  { title: "Sub User", path: "/sub-user" },
];

function DashboardPage() {
  useTitle("Dashboard");

  return (
    <div className="page-shell">
      <Navbar />

      <main className="content-shell stack-layout">
        <section className="section-card section-card--padded">
          <p className="section-kicker">Dashboard</p>
          <h1 className="section-cppy">Everything in one clean workspace</h1>
        </section>

        <div className="dashboard-grid">
          {cards.map((card) => (
            <DashboardCard
              key={card.title}
              title={card.title}
              path={card.path}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
