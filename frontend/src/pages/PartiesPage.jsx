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

  //quaries
  const { data, isLoading, isError } = useQuery({
    queryKey: ["parties", filters],
    queryFn: () => getParties(filters).then((res) => res.data.results),
    placeholderData: (previousData) => previousData,
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => getEmployees().then((res) => res.data.results),
  });

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
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Something went wrong</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10 ">
        <PartyFiltersBar filters={filters} onChange={setFilters} />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 item-start">
          <div className="lg:col-span-2">
            {!user.parent && (
              <div className="bg-white shadow-sm p-10 rounded-lg mt-6">
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <input
                    className="w-full px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    name="logo"
                    placeholder="logo"
                    value={formData.logo}
                    onChange={handleFormChange}
                  />
                  <input
                    className="w-full px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    name="first_name"
                    placeholder="first name"
                    value={formData.first_name}
                    onChange={handleFormChange}
                  />
                  <input
                    className="w-full px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-900 focus:outline-none  focus:ring-2 focus:ring-blue-500"
                    name="last_name"
                    placeholder="last name"
                    value={formData.last_name}
                    onChange={handleFormChange}
                  />
                  <input
                    className="w-full px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-900 focus:outline-none  focus:ring-2 focus:ring-blue-500"
                    name="number"
                    placeholder="number"
                    value={formData.number}
                    onChange={handleFormChange}
                  />
                  <input
                    className="w-full px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-900 focus:outline-none  focus:ring-2 focus:ring-blue-500"
                    name="email"
                    placeholder="email"
                    value={formData.email}
                    onChange={handleFormChange}
                  />
                  <input
                    className="w-full px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-900 focus:outline-none  focus:ring-2 focus:ring-blue-500"
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
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                    type="submit"
                  >
                    Create Party
                  </button>
                </form>
              </div>
            )}
          </div>
          <div className="lg:col-span-3 space-y-4">
            {data.map((party) => (
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
      </div>
    </div>
  );
}

export default PartiesPage;
