import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "";

export default function AddUser({ onAdded, editUser, onCancelEdit }) {
  const [form, setForm] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({ name: "", email: "" });

  // Update form when editUser changes
  useEffect(() => {
    if (editUser) {
      setForm({ name: editUser.name, email: editUser.email });
      setErrors({ name: "", email: "" });
    } else {
      setForm({ name: "", email: "" });
      setErrors({ name: "", email: "" });
    }
  }, [editUser]);

  const change = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors = { name: "", email: "" };
    let isValid = true;

    // Validate name
    if (!form.name.trim()) {
      newErrors.name = "Tên không được để trống";
      isValid = false;
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Tên phải có ít nhất 2 ký tự";
      isValid = false;
    } else if (form.name.trim().length > 50) {
      newErrors.name = "Tên không được quá 50 ký tự";
      isValid = false;
    }

    // Validate email
    if (!form.email.trim()) {
      newErrors.email = "Email không được để trống";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email không hợp lệ";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const submit = async (e) => {
    e.preventDefault();

    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      if (editUser) {
        // Update existing user
        await axios.put(`${API_BASE}/users/${editUser._id}`, form);
      } else {
        // Add new user
        await axios.post(`${API_BASE}/users`, form);
      }
      onAdded?.();
      setForm({ name: "", email: "" });
      setErrors({ name: "", email: "" });
      onCancelEdit?.();
    } catch (e) {
      alert(e?.response?.data?.message || (editUser ? "Cập nhật user thất bại" : "Thêm user thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: "", email: "" });
    setErrors({ name: "", email: "" });
    onCancelEdit?.();
  };

  return (
    <form onSubmit={submit} className="form">
      <div className="field">
        <label className="label" htmlFor="name">Tên</label>
        <input 
          className={`input ${errors.name ? 'input--error' : ''}`}
          id="name" 
          name="name" 
          placeholder="Nhập tên (2-50 ký tự)" 
          value={form.name} 
          onChange={change}
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>
      <div className="field">
        <label className="label" htmlFor="email">Email</label>
        <input 
          className={`input ${errors.email ? 'input--error' : ''}`}
          id="email" 
          name="email" 
          type="email" 
          placeholder="Nhập email (vd: user@example.com)" 
          value={form.email} 
          onChange={change}
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>
      <div className="row">
        <button type="submit" className="button" disabled={saving}>
          {saving ? "Đang lưu..." : (editUser ? "Cập nhật" : "Thêm")}
        </button>
        <button type="button" className="button button--ghost" onClick={handleCancel}>
          {editUser ? "Hủy" : "Xóa"}
        </button>
      </div>
    </form>
  );
}

