import React, { useEffect, useState } from "react";
import api from "../lib/api";

export default function ResetPasswordByToken({ defaultToken = "", onDone }) {
  const [token, setToken] = useState(defaultToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!defaultToken) {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('resetToken') || params.get('token') || '';
      if (t) setToken(t);
    }
  }, [defaultToken]);

  const submit = async (e) => {
    e.preventDefault();
    if (!token) { setMsg('Thiếu token'); return; }
    if (!newPassword || newPassword.length < 6) { setMsg('Mật khẩu tối thiểu 6 ký tự'); return; }
    if (newPassword !== confirm) { setMsg('Xác nhận mật khẩu không khớp'); return; }
    setLoading(true);
    setMsg("");
    try {
      const res = await api.post(`/auth/resetpassword/${encodeURIComponent(token)}`, { newPassword });
      setMsg(res?.data?.message || 'Đặt lại mật khẩu thành công. Nhấn OK để quay lại trang đăng nhập.');
      setDone(true);
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="form">
        <div className="empty" style={{ marginTop: 8 }}>{msg || 'Đặt lại mật khẩu thành công. Nhấn OK để quay lại trang đăng nhập.'}</div>
        <div className="row">
          <button className="button" type="button" onClick={() => onDone?.()}>OK</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="form">
      {!defaultToken && (
        <div className="field">
          <label className="label">Token</label>
          <input className="input" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Dán token từ email vào đây" />
        </div>
      )}
      <div className="field">
        <label className="label">Mật khẩu mới</label>
        <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
      </div>
      <div className="field">
        <label className="label">Nhập lại mật khẩu</label>
        <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={6} required />
        {newPassword && confirm && newPassword !== confirm && (
          <div className="empty" style={{ color: '#c62828', marginTop: 6 }}>Mật khẩu nhập lại không khớp</div>
        )}
      </div>
      <div className="row">
        <button className="button" type="submit" disabled={loading}>{loading ? 'Đang đổi...' : 'Đổi mật khẩu'}</button>
      </div>
      {msg && <div className="empty" style={{ marginTop: 8 }}>{msg}</div>}
    </form>
  );
}
