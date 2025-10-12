import { useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "";

export default function AddUser({ onAdded }) {
  const [form, setForm] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/users`, form);
      onAdded?.();
      setForm({ name: "", email: "" });
    } catch (e) {
      alert(e?.response?.data?.message || "Thêm user thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="form">
      <div className="field">
        <label className="label" htmlFor="name">Tên</label>
        <input className="input" id="name" name="name" placeholder="Tên" value={form.name} onChange={change} required />
      </div>
      <div className="field">
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" placeholder="Email" value={form.email} onChange={change} required />
      </div>
      <div className="row">
        <button type="submit" className="button" disabled={saving}>{saving ? "Đang lưu..." : "Thêm"}</button>
        <button type="button" className="button button--ghost" onClick={() => setForm({ name: "", email: "" })}>Xóa</button>
      </div>
    </form>
  );
}

