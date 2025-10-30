import { useState } from "react";
import api from "../lib/api";

const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "";

export default function Login({ onLoggedIn, onForgot }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/auth/login`, form);
      // Save token in localStorage for simple client-side auth
      localStorage.setItem("auth_token", res.data.token);
      localStorage.setItem("auth_user", JSON.stringify(res.data.user));
      onLoggedIn?.(res.data.user);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="form">
      <div className="field">
        <label className="label">Email</label>
        <input className="input" name="email" type="email" value={form.email} onChange={change} required />
      </div>
      <div className="field">
        <label className="label">Mật khẩu</label>
        <input className="input" name="password" type="password" value={form.password} onChange={change} required />
      </div>

      <div className="row">
        <button className="button" type="submit" disabled={loading}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</button>
      </div>
    </form>
  );
}
