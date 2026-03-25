import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteParty, getParty, updateParty } from "../api/parties";
import { useForm } from "../hooks/useForm.js";
import { useState } from "react";
import Navbar from "../components/Navbar";
import EditableField from "../components/EditableField.jsx";
import GoBackButton from "../components/GoBackButton.jsx";

function partyToForm(party) {
  return {
    logo: party?.logo ?? "",
    first_name: party?.first_name ?? "",
    last_name: party?.last_name ?? "",
    number: party?.number ?? "",
    email: party?.email ?? "",
    address: party?.address ?? "",
    assigned_to: party?.assigned_to ?? "",
    due: party?.due ?? "",
    advance_balance: party?.advance_balance ?? "",
  };
}

function PartyDetailPage() {
  //States
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Api Call
  const { data, isLoading, isError } = useQuery({
    queryKey: ["party", id],
    queryFn: () => getParty(id).then((res) => res.data),
  });

  //initialState
  const { formData, handleFormChange, resetForm } = useForm({
    logo: "",
    first_name: "",
    last_name: "",
    number: "",
    email: "",
    address: "",
    assigned_to: "",
    due: "",
    advance_balance: "",
  });

  // Functions
  function handleEdit() {
    setDeleteError("");
    resetForm(partyToForm(data));
    setIsEditing(true);
  }

  function handleCancel() {
    setDeleteError("");
    resetForm(partyToForm(data));
    setIsEditing(false);
  }

  async function handleSave(params) {
    try {
      await updateParty(id, formData);
      await queryClient.invalidateQueries({ queryKey: ["party", id] });
      await queryClient.invalidateQueries({ queryKey: ["parties"] });
      setIsEditing(false);
    } catch (err) {
      console.log(err);
    }
  }

  async function handleDelete() {
    setDeleteError("");

    try {
      await deleteParty(id);
      await queryClient.invalidateQueries({ queryKey: ["parties"] });
      navigate("/parties");
    } catch (err) {
      setDeleteError(err.response?.data?.error || "Could not delete party.");
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
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <EditableField
          label="Logo"
          name="logo"
          value={isEditing ? formData.logo : data.logo}
          onChange={handleFormChange}
          isEditing={isEditing}
        />
        <EditableField
          label="First name"
          name="first_name"
          value={isEditing ? formData.first_name : data.first_name}
          onChange={handleFormChange}
          isEditing={isEditing}
        />
        <EditableField
          label="Last name"
          name="last_name"
          value={isEditing ? formData.last_name : data.last_name}
          onChange={handleFormChange}
          isEditing={isEditing}
        />
        <EditableField
          label="Number"
          name="number"
          value={isEditing ? formData.number : data.number}
          onChange={handleFormChange}
          isEditing={isEditing}
        />
        <EditableField
          label="Email"
          name="email"
          value={isEditing ? formData.email : data.email}
          onChange={handleFormChange}
          isEditing={isEditing}
        />
        <EditableField
          type={"textArea"}
          label="Address"
          name="address"
          value={isEditing ? formData.address : data.address}
          onChange={handleFormChange}
          isEditing={isEditing}
        />
        <EditableField
          label="Due"
          name="due"
          value={isEditing ? formData.due : data.due}
          onChange={handleFormChange}
          isEditing={false}
        />
        <EditableField
          label="Advance Balance"
          name="advance_balance"
          value={isEditing ? formData.advance_balance : data.advance_balance}
          onChange={handleFormChange}
          isEditing={false}
        />
        {deleteError && <p className="text-red-600 text-sm">{deleteError}</p>}

        {isEditing ? (
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-400 text-white rounded"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Delete
            </button>
          </div>
        )}
      </div>
      <GoBackButton to="/parties/" />
    </div>
  );
}

export default PartyDetailPage;
