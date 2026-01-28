import { useState } from "react";
import api from "../api/axios";
import useAuthStore from "../store/authStore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    const res = await api.post("/auth/jwt/create/", {
      username,
      password,
    });

    login(res.data);
    navigate("/dashboard");
  };

  return (
    <form onSubmit={submit}>
      <input value={username} onChange={e => setUsername(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button>Login</button>
    </form>
  );
}

