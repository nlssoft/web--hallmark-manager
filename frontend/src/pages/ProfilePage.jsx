import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile } from "../api/profile";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
  });

  const isAdmin = user?.parent_id === null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        number: user.number,
        address: user.address,
      });
    }
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(["my-profile"], updated);
      reset({
        first_name: updated.first_name,
        last_name: updated.last_name,
        email: updated.email,
        number: updated.number,
        address: updated.address,
      });
      setIsEditing(false);
    },
  });

  const handleCancel = () => {
    reset({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      number: user.number,
      address: user.address,
    });
    setIsEditing(false);
  };

  const onSubmit = (data) => mutation.mutate(data);

  if (isLoading) return <p className="p-8 text-gray-400">Loading...</p>;
  if (isError)
    return <p className="p-8 text-red-500">Failed to load profile.</p>;

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-8">
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-2xl p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {user.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              {user.username}
            </h1>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                isAdmin
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {isAdmin ? "Admin" : "Sub User"}
            </span>
          </div>
          <p className="ml-auto text-sm text-gray-400">
            Joined:{" "}
            {new Date(user.joined_at).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Row label="First Name" error={errors.first_name}>
            <input
              {...register("first_name")}
              disabled={!isEditing}
              className={inputClass(isEditing)}
            />
          </Row>

          <Row label="Last Name" error={errors.last_name}>
            <input
              {...register("last_name")}
              disabled={!isEditing}
              className={inputClass(isEditing)}
            />
          </Row>

          <Row label="Email" error={errors.email}>
            <input
              {...register("email")}
              type="email"
              disabled={!isEditing}
              className={inputClass(isEditing)}
            />
          </Row>

          <Row label="Phone Number" error={errors.number}>
            <input
              {...register("number")}
              disabled={!isEditing}
              className={inputClass(isEditing)}
            />
          </Row>

          <Row label="Address" error={errors.address}>
            <textarea
              {...register("address")}
              rows={3}
              disabled={!isEditing}
              className={inputClass(isEditing) + " resize-none"}
            />
          </Row>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-3">
            {isAdmin && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
              >
                Update
              </button>
            )}

            {isEditing && (
              <>
                {mutation.isError && (
                  <p className="text-red-500 text-sm">
                    {mutation.error?.message || "Update failed."}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mutation.isPending ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={mutation.isPending}
                  className="px-6 py-2 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Row({ label, error, children }) {
  return (
    <div className="flex items-start gap-4">
      <label className="w-36 shrink-0 text-sm text-gray-500 pt-2.5">
        {label}
      </label>
      <div className="flex-1">
        {children}
        {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
      </div>
    </div>
  );
}

function inputClass(isEditing) {
  return `w-full border rounded-lg px-4 py-2.5 text-sm outline-none transition
    ${
      isEditing
        ? "text-gray-800 bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        : "text-gray-700 bg-gray-50 border-gray-200 cursor-default"
    }`;
}
