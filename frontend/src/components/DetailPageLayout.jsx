import Navbar from "./Navbar";

export default function DetailPageLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-3xl mx-auto p-6 space-y-4">{children}</div>
    </div>
  );
}
