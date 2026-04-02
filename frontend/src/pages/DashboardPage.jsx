import DashboardCard from "../components/DashboardCard";
import Navbar from "../components/Navbar";

const cards = [
  { title: "Parties", path: "/parties" },
  { title: "Service Type", path: "/service-type" },
  { title: "Work Rate", path: "/work-rate" },
  { title: "Record", path: "/record" },
  { title: "Payment", path: "/payment" },
  { title: "Summary", path: "/summary" },
  { title: "Audit", path: "/audit" },
  { title: "Advance Ledger", path: "/advance-ledger" },
  { title: "Sub User", path: "/sub-user" },
  { title: "Payment Request", path: "/payment-request" },
];

function DashboardPage() {
  return (
    <div className="page-shell">
      <Navbar />

      <main className="content-shell stack-layout">
        <section className="section-card section-card--padded">
          <p className="section-kicker">Dashboard</p>
          <h1 className="section-title">Everything in one clean workspace</h1>
          <p className="section-copy">
            Open the section you need and manage records, parties, rates, and
            users from a consistent white interface.
          </p>
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
