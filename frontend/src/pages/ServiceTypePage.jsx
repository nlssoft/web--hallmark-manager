import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getServices } from "../api/serviceType";
import Navbar from "../components/Navbar";

function ServiceTypePage() {
  //varibles
  const navigate = useNavigate();

  //querys
  const { data, isLoading, isError } = useQuery({
    queryKey: ["serviceType"],
    queryFn: () => getServices().then((res) => res.data),
  });

  //earlyReturns
  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white px-6 py-4 rounded-lg shadow-sm flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700 text-sm">Loading...</span>
        </div>
      </div>
    );

  if (isError)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white px-6 py-4 rounded-lg shadow-sm text-center">
          <p className="text-red-500 font-medium">Something went wrong</p>
          <p className="text-gray-500 text-sm mt-1">Please try again later.</p>
        </div>
      </div>
    );

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-100 py-10">
        <div className="max-w-2xl mx-auto space-y-4">
          {data.map((service) => (
            <div
              key={service.id}
              className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                {/* LEFT SIDE */}
                <div>
                  <div className="text-gray-900 font-semibold text-sm">
                    {service.type_of_work}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    Used this month
                  </div>
                </div>

                {/* RIGHT SIDE (FIXED) */}
                <div className="bg-blue-50 text-blue-600 text-sm font-semibold px-3 py-1 rounded-md">
                  {service.used}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-2xl mx-auto mt-6 flex justify-center">
          <button
            onClick={() => navigate("/dashboard/")}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default ServiceTypePage;
