import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { loadEmployees, createEmployees } from "../api/employees";
import CreateField from "../components/CreateField";
import { useForm } from "../hooks/useForm";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PaginationControls from "../components/PaginationControls";

function SubUserPage() {
  //initial state
  const { formData, handleFormChange, resetForm } = useForm({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    address: "",
    number: "",
  });

  //varibles
  const queryClient = useQueryClient();
  const [confirmPassword, setConfirmPassword] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const navigate = useNavigate();

  //querys
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["employees"],
    queryFn: loadEmployees,
    placeholderData: (previousData) => previousData,
  });

  const employees = data?.results ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / pageSize));

  //function
  async function handleSubmit(e) {
    e.preventDefault();
    if (formData.password === confirmPassword) {
      try {
        await createEmployees(formData);
        resetForm();
        setConfirmPassword("");
        queryClient.invalidateQueries({ queryKey: ["employees"] });
      } catch (err) {
        console.log(err);
      }
    } else {
      alert("Password doesn't match");
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
        <div className="bg-white px-6 py-4 rounded-lg shadow-sm text-center max-w-sm">
          <p className="text-red-500 font-medium">
            {error?.message || "Something went wrong"}
          </p>

          <p className="text-gray-500 text-sm mt-1">
            {error?.message?.includes("not allowed")
              ? "You don’t have permission to view this."
              : "Please try again later."}
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* FORM */}
          <div className="w-full lg:w-96 flex-shrink-0 lg:sticky lg:top-20 self-start">
            <div className="bg-white p-5 border border-gray-300 rounded-lg shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-3">
                <CreateField
                  name={"username"}
                  label={"Username"}
                  value={formData.username}
                  onChange={handleFormChange}
                />

                <CreateField
                  type={"password"}
                  name={"password"}
                  label={"Password"}
                  value={formData.password}
                  onChange={handleFormChange}
                />

                <CreateField
                  type={"password"}
                  name={"confirmPassword"}
                  label={"Password confirmation"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <CreateField
                  name={"first_name"}
                  label={"First Name"}
                  value={formData.first_name}
                  onChange={handleFormChange}
                />

                <CreateField
                  name={"last_name"}
                  label={"Last Name"}
                  value={formData.last_name}
                  onChange={handleFormChange}
                />

                <CreateField
                  name={"email"}
                  label={"Email"}
                  value={formData.email}
                  onChange={handleFormChange}
                />

                <CreateField
                  type={"textArea"}
                  name={"address"}
                  label={"Address"}
                  value={formData.address}
                  onChange={handleFormChange}
                />

                <CreateField
                  name={"number"}
                  label={"Number"}
                  value={formData.number}
                  onChange={handleFormChange}
                />

                <button
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                  type="submit"
                >
                  Add Employee
                </button>
              </form>
            </div>
          </div>

          {/* LIST */}
          <div className="flex-1">
            <div className="flex flex-col gap-4">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => navigate(`${emp.id}/`)}
                  className="bg-white p-4 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow-md cursor-pointer transition"
                >
                  <div className="text-gray-900 font-semibold">
                    {emp.username}
                  </div>
                  <div className="text-gray-500 text-sm">{emp.address}</div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <PaginationControls
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                showBack
                onBack={() => navigate(-1)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubUserPage;
