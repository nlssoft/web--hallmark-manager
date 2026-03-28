import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteEmployee,
  getEmployee,
  updateEmployee,
} from "../api/employees.js";
import { useForm } from "../hooks/useForm.js";
import { useState } from "react";
import Navbar from "../components/Navbar";
import EditableField from "../components/EditableField.jsx";
import GoBackButton from "../components/GoBackButton.jsx";
import DetailPageLayout from "../components/DetailPageLayout.jsx";
import ECSDButton from "../components/EditCancelSaveDelete.jsx";
import EarlyReturn from "../components/EarlyReturns.jsx";

function employeeToForm(employee) {
  return {
    logo: employee?.username ?? "",
    first_name: employee?.first_name ?? "",
    last_name: employee?.last_name ?? "",
    number: employee?.number ?? "",
    email: employee?.email ?? "",
    address: employee?.address ?? "",
    joined_at: employee?.joined_at ?? "",
  };
}

function SubUserDetailPage() {
  //states
  const { id } = useParams("id");
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  //api call
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => getEmployee(id),
    placeholderData: (previousData) => previousData,
  });

  //initial state
  const { formData, handleFormChange, resetForm } = useForm({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    address: "",
    number: "",
    joined_at: "",
  });

  const fields = [
    { label: "Username", name: "username", editable: false },
    { label: "First Name", name: "first_name", editable: true },
    { label: "Last Name", name: "last_name", editable: true },
    { label: "Email", name: "email", editable: true },
    { label: "Number", name: "number", editable: true },
    { label: "Address", name: "address", editable: true },
    { label: "Joined On", name: "joined_at", editable: false },
  ];

  // Functions
  function handleEdit() {
    resetForm(employeeToForm(data));
    setIsEditing(true);
  }

  function handleCancel() {
    resetForm(employeeToForm(data));
    setIsEditing(false);
  }

  async function handleSave(params) {
    try {
      await updateEmployee(id, formData);
      await queryClient.invalidateQueries({ queryKey: ["employee", id] });
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsEditing(false);
    } catch (err) {
      console.log(err);
    }
  }

  async function handleDelete() {
    try {
      await deleteEmployee(id);
      await queryClient.invalidateQueries({ queryKey: ["employee"] });
      navigate("/sub-user/");
    } catch (err) {
      console.log(err);
    }
  }

  //earlyReturn
  const earlyReturn = (
    <EarlyReturn isLoading={isLoading} isError={isError} error={error} />
  );

  if (isLoading || isError) return earlyReturn;

  return (
    <div>
      <DetailPageLayout>
        {fields.map((field) => (
          <EditableField
            key={field.name}
            label={field.label}
            name={field.name}
            value={
              isEditing && field.editable !== false
                ? formData[field.name]
                : data[field.name]
            }
            onChange={handleFormChange}
            isEditing={isEditing}
          />
        ))}
        <ECSDButton
          isEditing={isEditing}
          handleCancel={handleCancel}
          handleDelete={handleDelete}
          handleEdit={handleEdit}
          handleSave={handleSave}
        />

        <GoBackButton to={"/sub-user/"} />
      </DetailPageLayout>
    </div>
  );
}

export default SubUserDetailPage;
