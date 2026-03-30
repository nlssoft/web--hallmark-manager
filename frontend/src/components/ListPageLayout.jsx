import Navbar from "../components/Navbar.jsx";

export default function ListPageLayout({ form, list, filter }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* FILTER */}
        {filter && (
          <div className="bg-white border  border-gray-300 rounded-lg shadow-sm hover:shadow-md">
            {filter}
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* FORM */}
          <div className="w-full lg:w-96 flex-shrink-0 lg:sticky lg:top-20 self-start">
            <div className="bg-white p-5 border border-gray-300 rounded-lg shadow-sm">
              {form}
            </div>
          </div>

          {/* LIST */}
          <div className="flex-1">{list}</div>
        </div>
      </div>
    </div>
  );
}
