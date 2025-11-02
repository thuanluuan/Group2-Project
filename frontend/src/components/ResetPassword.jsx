import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function ResetPassword({ defaultEmail = '', onDone }) {
  const [form, setForm] = useState({ email: defaultEmail, otp: '', newPassword: '' });
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [remaining, setRemaining] = useState(120); // seconds for OTP validity
  const [resending, setResending] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    setRemaining(120);
    const id = setInterval(() => {
      setRemaining((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    if (form.newPassword.length < 6) {
      setLoading(false);
      setMessage('Mật khẩu mới phải từ 6 ký tự trở lên');
      return;
    }
    if (form.newPassword !== confirm) {
      setLoading(false);
      setMessage('Xác nhận mật khẩu không khớp');
      return;
    }
    try {
      await api.post('/auth/reset-password', form);
      setMessage('Đặt lại mật khẩu thành công.');
      onDone?.();
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Đặt lại thất bại');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!form.email) {
      setMessage('Vui lòng nhập email để gửi lại OTP');
      return;
    }
    setResending(true);
    setMessage('');
    try {
      await api.post('/auth/forgot-password', { email: form.email });
      setRemaining(120);
      setMessage('Đã gửi lại OTP. OTP có hiệu lực 2 phút.');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Gửi lại OTP thất bại');
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={submit} className="form">
      <div className="field">
        <label className="label">Email</label>
        <input className="input" name="email" type="email" value={form.email} onChange={change} required />
      </div>
      <div className="field">
        <label className="label">OTP</label>
        <input className="input" name="otp" value={form.otp} onChange={change} placeholder="6 ký tự" inputMode="numeric" pattern="^\\d{6}$" title="Nhập 6 chữ số" required />
      </div>
      <div className="field">
        <label className="label">Mật khẩu mới</label>
        <input className="input" name="newPassword" type="password" value={form.newPassword} onChange={change} required minLength={6} />
      </div>
      <div className="field">
        <label className="label">Nhập lại mật khẩu mới</label>
        <input className="input" name="confirmPassword" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
        {form.newPassword && confirm && form.newPassword !== confirm && (
          <div className="empty" style={{ color: '#c62828', marginTop: 6 }}>Mật khẩu nhập lại không khớp</div>
        )}
      </div>
      <div className="row">
        <button className="button" type="submit" disabled={loading}>{loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}</button>
      </div>
      <div className="row" style={{ marginTop: 8, gap: 8, alignItems: 'center' }}>
        <span className="badge">OTP còn hiệu lực: {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2,'0')}</span>
        <button type="button" className="button button--ghost" onClick={resend} disabled={resending}>
          {resending ? 'Đang gửi lại...' : 'Gửi lại OTP'}
        </button>
      </div>
      {message && <div className="empty" style={{ marginTop: 8 }}>{message}</div>}
    </form>
  );
}
