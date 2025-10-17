import React, { useEffect, useState } from "react";
import api from "../lib/api";

export default function ProfileForm({ initialUser, onSaved, isAdminEditing, userId }) {
  const [form, setForm] = useState({ name: "", dob: "", address: "", phone: "", avatarUrl: "" });
  const [saving, setSaving] = useState(false);
  const [showExtras, setShowExtras] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setForm({
        name: initialUser.name || "",
        dob: initialUser.dob ? new Date(initialUser.dob).toISOString().slice(0,10) : "",
        address: initialUser.address || "",
        phone: initialUser.phone || "",
        avatarUrl: initialUser.avatarUrl || "",
      });
    }
  }, [initialUser]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, dob: form.dob };
      if (showExtras) {
        payload.address = form.address;
        payload.phone = form.phone;
        payload.avatarUrl = form.avatarUrl;
      }
      if (isAdminEditing && userId) {
        // Admin updates another user
        await api.put(`/users/${userId}`, payload);
      } else {
        // Self update
        await api.put(`/auth/me`, payload);
      }
      onSaved?.();
    } catch (err) {
      alert(err?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="form">
      <div className="field">
        <label className="label">Họ tên</label>
        <input className="input" name="name" value={form.name} onChange={change} required />
      </div>
      <div className="field">
        <label className="label">Ngày sinh</label>
        <input className="input" name="dob" type="date" value={form.dob} onChange={change} required />
      </div>
      <div className="row">
        <button className="button button--ghost" type="button" onClick={() => setShowExtras(s => !s)}>
          {showExtras ? 'Ẩn bổ sung' : 'Bổ sung thông tin'}
        </button>
      </div>
      {showExtras && (
        <>
          <div className="field">
            <label className="label">Số điện thoại</label>
            <input className="input" name="phone" value={form.phone} onChange={change} placeholder="Ví dụ: 0901234567" />
          </div>
          <div className="field">
            <label className="label">Địa chỉ</label>
            <input className="input" name="address" value={form.address} onChange={change} placeholder="Số nhà, đường, quận/huyện, tỉnh" />
          </div>
          <div className="field">
            <label className="label">Ảnh cá nhân (URL)</label>
            <input className="input" name="avatarUrl" value={form.avatarUrl} onChange={change} placeholder="https://...jpg" />
          </div>
        </>
      )}
      <div className="row">
        <button className="button" type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
      </div>
    </form>
  );
}
