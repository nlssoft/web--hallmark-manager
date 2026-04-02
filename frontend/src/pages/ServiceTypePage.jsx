import { useQuery } from "@tanstack/react-query";
import { loadService } from "../api/serviceType";
import Navbar from "../components/Navbar";
import GoBackButton from "../components/GoBackButton.jsx";
import EarlyReturn from "../components/EarlyReturns.jsx";

function ServiceTypePage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["serviceType"],
    queryFn: loadService,
  });

  if (isLoading || isError) {
    return (
      <EarlyReturn isLoading={isLoading} isError={isError} error={error} />
    );
  }

  return (
    <div className="page-shell">
      <Navbar />

      <main className="content-shell stack-layout">
        <section className="section-card section-card--padded section-card--narrow">
          <p className="section-kicker">Services</p>
          <h1 className="section-title">Service types at a glance</h1>
          <p className="section-copy">
            Review available service categories and see how often each one has
            been used this month.
          </p>
        </section>

        <section className="section-card section-card--padded section-card--narrow">
          <div className="service-list">
            {data.map((service) => (
              <div key={service.id} className="list-card cursor-default">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">
                      {service.type_of_work}
                    </div>
                    <div className="meta-muted mt-1">Used this month</div>
                  </div>

                  <div className="info-pill">{service.used}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <GoBackButton to="/dashboard/" />
      </main>
    </div>
  );
}

export default ServiceTypePage;
