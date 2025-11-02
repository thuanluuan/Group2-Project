import React, { useState } from "react";
import api from "../lib/api";

export default function ForgotPasswordLink({ onRequested }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await api.post('/auth/forgot-password-link', { email });
      setMsg(res?.data?.message || 'Nếu email hợp lệ, đã gửi liên kết đặt lại mật khẩu');
      onRequested?.(email);
    } catch (e) {
      setMsg('Nếu email hợp lệ, đã gửi liên kết đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="form">
      <div className="field">
        <label className="label">Email</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
      </div>
      <div className="row">
        <button className="button" type="submit" disabled={loading}>{loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại mật khẩu'}</button>
      </div>
      {msg && <div className="empty" style={{ marginTop: 8 }}>{msg}</div>}
    </form>
  );
}
