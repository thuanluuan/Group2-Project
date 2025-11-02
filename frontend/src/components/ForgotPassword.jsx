import { useState } from 'react';
import api from '../lib/api';

export default function ForgotPassword({ onRequested }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setDevOtp('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage('Đã gửi OTP đến email (hiệu lực 2 phút).');
      if (res?.data?.otp) setDevOtp(String(res.data.otp));
      onRequested?.(email);
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Yêu cầu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="form">
      <div className="field">
        <label className="label">Email đã đăng ký</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="row">
        <button className="button" type="submit" disabled={loading}>{loading ? 'Đang gửi...' : 'Gửi OTP'}</button>
      </div>
      {message && <div className="empty" style={{ marginTop: 8 }}>{message}</div>}
      {devOtp && (
        <div className="empty" style={{ marginTop: 8, color: '#0a7' }}>
          OTP (dev): <b>{devOtp}</b>
        </div>
      )}
      <div className="empty" style={{ marginTop: 8 }}>
        Sau khi nhận OTP, bạn sẽ được chuyển sang bước nhập OTP và tạo mật khẩu mới.
      </div>
    </form>
  );
}
