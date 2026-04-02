import Navbar from "./Navbar";

export default function DetailPageLayout({ children }) {
  return (
    <div className="page-shell">
      <Navbar />
      <main className="content-shell">
        <div className="section-card section-card--padded section-card--narrow space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
