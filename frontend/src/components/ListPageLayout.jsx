import Navbar from "../components/Navbar.jsx";

export default function ListPageLayout({ form, list, filter }) {
  return (
    <div className="page-shell">
      <Navbar />

      <main className="content-shell">
        <div className="stack-layout">
          {filter && (
            <section className="section-card section-card--padded">
              <p className="section-kicker">Filters</p>
              {filter}
            </section>
          )}

          {(form || list) && (
            <div className="list-page-grid">
              {form && (
                <section className="list-page-form section-card section-card--padded">
                  {form}
                </section>
              )}

              {list && (
                <section className="list-page-list section-card section-card--padded">
                  {list}
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
