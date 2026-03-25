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
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-gray-800 text-2xl font-semibold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((card) => (
            <DashboardCard
              key={card.title}
              title={card.title}
              path={card.path}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
