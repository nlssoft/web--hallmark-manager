import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

export default function Profile() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [form, setForm] = useState({});
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    /* LOAD PROFILE */
    useEffect(() => {
        api.get("/user/profile/me/")
            .then(res => {
                setUser(res.data);
                setForm(res.data);
            })
            .catch(() => setError("Failed to load profile"));
    }, []);

    const save = async () => {
        setError("");
        setSuccess("");

        try {
            const res = await api.patch(
                "/user/profile/update_profile/",
                {
                    first_name: form.first_name,
                    last_name: form.last_name,
                    email: form.email,
                    number: form.number,
                    address: form.address,
                }
            );

            setUser(res.data);
            setEditing(false);
            setSuccess("Profile updated");
        } catch {
            setError("Update failed");
        }
    };

    if (!user) return null;

    return (
        <div className="profile-page">
            <header className="profile-header">
                <h1>Profile</h1>
                <p>Your account information</p>
            </header>

            {error && <div className="error-box">{error}</div>}
            {success && <div className="success-box">{success}</div>}

            <div className="profile-card">
                <ProfileRow label="Username">
                    <span>{user.username}</span>
                </ProfileRow>

                <ProfileRow label="First name">
                    {editing ? (
                        <input
                            value={form.first_name || ""}
                            onChange={e => setForm({ ...form, first_name: e.target.value })}
                        />
                    ) : (
                        <span>{user.first_name}</span>
                    )}
                </ProfileRow>

                <ProfileRow label="Last name">
                    {editing ? (
                        <input
                            value={form.last_name || ""}
                            onChange={e => setForm({ ...form, last_name: e.target.value })}
                        />
                    ) : (
                        <span>{user.last_name}</span>
                    )}
                </ProfileRow>

                <ProfileRow label="Email">
                    {editing ? (
                        <input
                            value={form.email || ""}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                    ) : (
                        <span>{user.email}</span>
                    )}
                </ProfileRow>

                <ProfileRow label="Phone">
                    {editing ? (
                        <input
                            value={form.number || ""}
                            onChange={e => setForm({ ...form, number: e.target.value })}
                        />
                    ) : (
                        <span>{user.number}</span>
                    )}
                </ProfileRow>

                <ProfileRow label="Address">
                    {editing ? (
                        <input
                            value={form.address || ""}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                        />
                    ) : (
                        <span>{user.address}</span>
                    )}
                </ProfileRow>

                <ProfileRow label="Joined">
                    <span>{user.joined_at}</span>
                </ProfileRow>

                <div className="profile-actions">
                    {editing ? (
                        <>
                            <button className="primary" onClick={save}>
                                Save
                            </button>
                            <button onClick={() => setEditing(false)}>
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button className="primary" onClick={() => setEditing(true)}>
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>

            <div className="bottom-actions">
                <button onClick={() => navigate("/dashboard")}>
                    ← Back to Dashboard
                </button>
            </div>
        </div>
    );
}

function ProfileRow({ label, children }) {
    return (
        <div className="profile-row">
            <div className="profile-label">{label}</div>
            <div className="profile-value">{children}</div>
        </div>
    );
}
