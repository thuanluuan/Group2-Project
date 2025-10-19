import { useEffect, useRef, useState } from 'react';
import api from '../lib/api';

export default function ChangePasswordAdmin() {
  const [otpMsg, setOtpMsg] = useState('');
  const [pw, setPw] = useState({ otp: '', newPassword: '', confirm: '' });
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const sendOtp = async () => {
    setSending(true);
    setOtpMsg('');
    try {
      await api.post('/auth/me/forgot-password');
      setOtpMsg('Đã gửi OTP đến email của bạn (2 phút).');
      setRemaining(120);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRemaining((s) => {
          if (s <= 1) { clearInterval(timerRef.current); timerRef.current = null; return 0; }
          return s - 1;
        });
      }, 1000);
    } catch (e) {
      setOtpMsg(e?.response?.data?.message || 'Không gửi được OTP');
    } finally {
      setSending(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setOtpMsg('');
    try {
      if (pw.newPassword.length < 6) throw new Error('Mật khẩu mới tối thiểu 6 ký tự');
      if (pw.newPassword !== pw.confirm) throw new Error('Xác nhận mật khẩu không khớp');
      await api.post('/auth/me/reset-password', { otp: pw.otp, newPassword: pw.newPassword });
      setOtpMsg('Đổi mật khẩu thành công');
      setPw({ otp: '', newPassword: '', confirm: '' });
    } catch (e) {
      setOtpMsg(e?.response?.data?.message || e.message || 'Đổi mật khẩu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="empty" style={{ marginBottom: 8, fontSize: 12, opacity: 0.8 }}>
        Quản trị › Đổi mật khẩu
      </div>
      <div className="card">
      <div className="card__header">Đổi mật khẩu (Admin)</div>
      <div className="card__body">
        <div className="row" style={{ gap: 8 }}>
          <button className="button" type="button" onClick={sendOtp} disabled={sending}>
            {sending ? 'Đang gửi OTP...' : 'Gửi OTP đến email của tôi'}
          </button>
          {remaining > 0 && (
            <span className="badge">OTP còn: {Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</span>
          )}
        </div>
        <form className="form" onSubmit={submit} style={{ marginTop: 12 }}>
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
          </div>
          <div className="row">
            <button className="button" type="submit" disabled={submitting}>{submitting ? 'Đang đổi...' : 'Đổi mật khẩu'}</button>
          </div>
          {otpMsg && <div className="empty" style={{ marginTop: 8 }}>{otpMsg}</div>}
        </form>
      </div>
    </div>
    </>
  );
}
