import React, { useEffect, useRef, useState } from "react";
import api from "../lib/api";

export default function ProfileForm({ initialUser, onSaved, isAdminEditing, userId, focusChangePassword = false, allowSelfChangePassword = false }) {
  const [form, setForm] = useState({ name: "", dob: "", address: "", phone: "", avatarUrl: "" });
  const [saving, setSaving] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(allowSelfChangePassword && !!focusChangePassword);
  const [otpMsg, setOtpMsg] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [pw, setPw] = useState({ otp: "", newPassword: "", confirm: "" });
  const [cpLoading, setCpLoading] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [resending, setResending] = useState(false);
  const otpIntervalRef = useRef(null);
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

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

  useEffect(() => {
    if (allowSelfChangePassword && focusChangePassword) setShowChangePwd(true);
  }, [allowSelfChangePassword, focusChangePassword]);

  useEffect(() => {
    return () => {
      if (otpIntervalRef.current) {
        clearInterval(otpIntervalRef.current);
        otpIntervalRef.current = null;
      }
    };
  }, []);

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

  const sendOtp = async () => {
    setResending(true);
    setOtpMsg("");
    setDevOtp("");
    try {
      const res = await api.post('/auth/me/forgot-password');
      setOtpMsg('Đã gửi OTP đến email của bạn (hiệu lực 2 phút).');
      if (res?.data?.otp) setDevOtp(String(res.data.otp));
      setRemaining(120);
      if (otpIntervalRef.current) {
        clearInterval(otpIntervalRef.current);
      }
      otpIntervalRef.current = setInterval(() => {
        setRemaining((s) => {
          if (s <= 1) {
            if (otpIntervalRef.current) {
              clearInterval(otpIntervalRef.current);
              otpIntervalRef.current = null;
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (e) {
      setOtpMsg(e?.response?.data?.message || 'Không gửi được OTP');
    } finally {
      setResending(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (!pw.newPassword || pw.newPassword.length < 6) { setOtpMsg('Mật khẩu mới tối thiểu 6 ký tự'); return; }
    if (pw.newPassword !== pw.confirm) { setOtpMsg('Xác nhận mật khẩu không khớp'); return; }
    setCpLoading(true);
    setOtpMsg("");
    try {
      await api.post('/auth/me/reset-password', { otp: pw.otp, newPassword: pw.newPassword });
      setOtpMsg('Đổi mật khẩu thành công');
      setPw({ otp: "", newPassword: "", confirm: "" });
    } catch (e) {
      setOtpMsg(e?.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setCpLoading(false);
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
            <label className="label">Ảnh cá nhân</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ width: 68, height: 68, borderRadius: 8, overflow: 'hidden', background: '#1b2230', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 12, opacity: 0.7 }}>No image</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Đang tải...' : '📤 Tải ảnh lên'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setUploading(true);
                  try {
                    const fd = new FormData();
                    fd.append('avatar', f);
                    const res = await api.post('/upload/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                    const url = res?.data?.fullUrl || res?.data?.url;
                    if (url) setForm(prev => ({ ...prev, avatarUrl: url }));
                  } catch (err) {
                    alert(err?.response?.data?.message || 'Tải ảnh thất bại (chỉ hỗ trợ jpeg/png/webp/gif, tối đa 2MB)');
                  } finally {
                    setUploading(false);
                    try { e.target.value = ''; } catch {}
                  }
                }} />
                <input className="input" name="avatarUrl" value={form.avatarUrl} onChange={change} placeholder="https://...jpg" style={{ minWidth: 260 }} />
              </div>
            </div>
            <div className="empty" style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>Bạn có thể dán URL ảnh hoặc tải ảnh từ máy. Ảnh tối đa 2MB.</div>
          </div>
          <div className="field">
            <label className="label">Số điện thoại</label>
            <input className="input" name="phone" value={form.phone} onChange={change} placeholder="Ví dụ: 0901234567" />
          </div>
          <div className="field">
            <label className="label">Địa chỉ</label>
            <input className="input" name="address" value={form.address} onChange={change} placeholder="Số nhà, đường, quận/huyện, tỉnh" />
          </div>
        </>
      )}
      {allowSelfChangePassword && !isAdminEditing && (
        <div className="row" style={{ marginTop: 12 }}>
          <button className="button button--ghost" type="button" onClick={() => setShowChangePwd(s => !s)}>
            {showChangePwd ? 'Ẩn đổi mật khẩu' : 'Đổi mật khẩu'}
          </button>
        </div>
      )}
      {allowSelfChangePassword && !isAdminEditing && showChangePwd && (
        <div className="card" style={{ marginTop: 8 }}>
          <div className="card__header">Đổi mật khẩu</div>
          <div className="card__body">
            <div className="row" style={{ gap: 8 }}>
              <button type="button" className="button" onClick={sendOtp} disabled={resending}>{resending ? 'Đang gửi OTP...' : 'Gửi OTP đến email của tôi'}</button>
              {remaining > 0 && (
                <span className="badge">OTP còn: {Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</span>
              )}
            </div>
            {devOtp && (
              <div className="empty" style={{ marginTop: 8, color: '#0a7' }}>
                OTP (dev): <b>{devOtp}</b>
              </div>
            )}
            <div className="form" style={{ marginTop: 12 }}>
              <div className="field">
                <label className="label">OTP</label>
                <input className="input" value={pw.otp} onChange={(e) => setPw({ ...pw, otp: e.target.value })} placeholder="6 chữ số" inputMode="numeric" pattern="^\\d{6}$" title="Nhập 6 chữ số" required />
              </div>
              <div className="field">
                <label className="label">Mật khẩu mới</label>
                <input className="input" type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} minLength={6} required />
              </div>
              <div className="field">
                <label className="label">Nhập lại mật khẩu mới</label>
                <input className="input" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} minLength={6} required />
                {pw.newPassword && pw.confirm && pw.newPassword !== pw.confirm && (
                  <div className="empty" style={{ color: '#c62828', marginTop: 6 }}>Mật khẩu nhập lại không khớp</div>
                )}
              </div>
              <div className="row">
                <button className="button" type="button" onClick={changePassword} disabled={cpLoading}>{cpLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}</button>
              </div>
              {otpMsg && <div className="empty" style={{ marginTop: 8 }}>{otpMsg}</div>}
            </div>
          </div>
        </div>
      )}
      <div className="row">
        <button className="button" type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
      </div>
    </form>
  );
}
