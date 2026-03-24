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

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["parties", filters],
    queryFn: () => getParties(filters).then((res) => res.data.results),
    placeholderData: (previousData) => previousData,
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => getEmployees().then((res) => res.data.results),
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Something went wrong</div>;

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

  return (
    <div>
      <Navbar />
      <PartyFiltersBar filters={filters} onChange={setFilters} />
      {!user.parent && (
        <form onSubmit={handleSubmit}>
          <input
            name="logo"
            placeholder="logo"
            value={formData.logo}
            onChange={handleFormChange}
          />
          <input
            name="first_name"
            placeholder="first name"
            value={formData.first_name}
            onChange={handleFormChange}
          />
          <input
            name="last_name"
            placeholder="last name"
            value={formData.last_name}
            onChange={handleFormChange}
          />
          <input
            name="number"
            placeholder="number"
            value={formData.number}
            onChange={handleFormChange}
          />
          <input
            name="email"
            placeholder="email"
            value={formData.email}
            onChange={handleFormChange}
          />
          <input
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
              handleFormChange({ target: { name: "assigned_to", value: id } })
            }
          />

          <button type="submit">Create Party</button>
        </form>
      )}

      <div>
        {data.map((party) => (
          <div key={party.id} onClick={() => navigate(`/parties/${party.id}`)}>
            <span>
              {party.first_name} {party.last_name}
            </span>
            <span>{party.address}</span>
            <span>{party.due}</span>
            <span>{party.advance_balance}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PartiesPage;
