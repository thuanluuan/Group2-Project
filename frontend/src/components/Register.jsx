import { useState } from "react";
import api from "../lib/api";

export default function Register({ onRegistered }) {
  const [form, setForm] = useState({ name: "", email: "", dob: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return alert("Mật khẩu và xác nhận không khớp");
    setLoading(true);
    try {
        await api.post(`/auth/register`, { name: form.name, email: form.email, dob: form.dob, password: form.password });
      alert("Đăng ký thành công. Bạn có thể đăng nhập ngay.");
      onRegistered?.();
      setForm({ name: "", email: "", dob: "", password: "", confirm: "" });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="form">
      <div className="field">
        <label className="label">Tên</label>
        <input className="input" name="name" value={form.name} onChange={change} required />
      </div>
      <div className="field">
        <label className="label">Gmail</label>
        <input className="input" name="email" type="email" placeholder="name@gmail.com" value={form.email} onChange={change} required />
      </div>
      <div className="field">
        <label className="label">Ngày tháng năm sinh</label>
        <input className="input" name="dob" type="date" value={form.dob} onChange={change} required />
      </div>
      <div className="field">
        <label className="label">Mật khẩu</label>
        <input className="input" name="password" type="password" value={form.password} onChange={change} required minLength={6} />
      </div>
      <div className="field">
        <label className="label">Xác nhận mật khẩu</label>
        <input className="input" name="confirm" type="password" value={form.confirm} onChange={change} required minLength={6} />
      </div>

      <div className="row">
        <button className="button" type="submit" disabled={loading}>{loading ? "Đang đăng ký..." : "Đăng ký"}</button>
      </div>
    </form>
  );
}
