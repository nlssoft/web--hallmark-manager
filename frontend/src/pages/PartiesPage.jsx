import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createParties, getParties } from "../api/parties";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "../hooks/useForm";
import { getEmployees } from "../api/employees";

import Navbar from "../components/Navbar";
import PartyFiltersBar from "../components/PartyFiltersBar";
import AutoCompleteInput from "../components/AutocompleteInput";
import PaginationControls from "../components/PaginationControls";

function PartiesPage() {
  // initialStates
  const [filters, setFilters] = useState({
    first_name: "",
    last_name: "",
    logo: "",
  });

  const { formData, handleFormChange, resetForm } = useForm({
    logo: "",
    first_name: "",
    last_name: "",
    number: "",
    email: "",
    address: "",
    assigned_to: "",
  });

  //varibles
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  //quaries
  const { data, isLoading, isError } = useQuery({
    queryKey: ["parties", filters, page],
    queryFn: () => getParties({ ...filters, page }).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => getEmployees().then((res) => res.data.results),
  });

  const parties = data?.results ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  //functions
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await createParties(formData);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["parties"] });
    } catch (err) {
      console.log(err);
    }
  }

  //Early returns
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
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10 ">
        <PartyFiltersBar
          filters={filters}
          onChange={(nextFilters) => {
            setFilters(nextFilters);
            setPage(1);
          }}
        />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <div className="lg:col-span-2 lg:sticky lg:top-16 self-start">
            {!user.parent && (
              <div className="bg-white shadow-sm p-5 rounded-lg ">
                <form className="space-y-3" onSubmit={handleSubmit}>
                  <input
                    className="w-full px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    name="logo"
                    placeholder="logo"
                    value={formData.logo}
                    onChange={handleFormChange}
                  />
                  <input
                    className="w-full px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    name="first_name"
                    placeholder="first name"
                    value={formData.first_name}
                    onChange={handleFormChange}
                  />
                  <input
                    className="w-full px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-900 focus:outline-none  focus:ring-2 focus:ring-blue-500"
                    name="last_name"
                    placeholder="last name"
                    value={formData.last_name}
                    onChange={handleFormChange}
                  />
                  <input
                    className="w-full px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-900 focus:outline-none  focus:ring-2 focus:ring-blue-500"
                    name="number"
                    placeholder="number"
                    value={formData.number}
                    onChange={handleFormChange}
                  />
                  <input
                    className="w-full px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-900 focus:outline-none  focus:ring-2 focus:ring-blue-500"
                    name="email"
                    placeholder="email"
                    value={formData.email}
                    onChange={handleFormChange}
                  />
                  <input
                    className="w-full px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-900 focus:outline-none  focus:ring-2 focus:ring-blue-500"
                    name="address"
                    placeholder="address"
                    value={formData.address}
                    onChange={handleFormChange}
                  />

                  <AutoCompleteInput
                    options={employees}
                    labelKey={"username"}
                    subLabelKey={"address"}
                    placeholder={"assigned_to"}
                    value={formData.assigned_to}
                    onChange={(id) =>
                      handleFormChange({
                        target: { name: "assigned_to", value: id },
                      })
                    }
                  />

                  <button
                    className="w-full bg-blue-600 text-white py-1.5 rounded-md hover:bg-blue-700 transition"
                    type="submit"
                  >
                    Create Party
                  </button>
                </form>
              </div>
            )}
          </div>
          <div className="lg:col-span-3 space-y-4 pr-2">
            {parties.map((party) => (
              <div
                key={party.id}
                onClick={() => navigate(`/parties/${party.id}`)}
                className="bg-white shadow-sm p-4 rounded-lg hover:shadow-md hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-gray-900 font-semibold">
                    {party.first_name} {party.last_name}
                  </span>
                  <span className="text-gray-500 text-sm">{party.address}</span>

                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-red-400">Due: {party.due}</span>
                    <span className="text-green-400">
                      Advance: {party.advance_balance}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <PaginationControls
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          showBack
          onBack={() => navigate(-1)}
        />
      </div>
    </div>
  );
}

export default PartiesPage;
