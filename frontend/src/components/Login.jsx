import { useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { loginThunk, selectAuth } from '../store/authSlice';

const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "";

export default function Login({ onLoggedIn, onForgot }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const { status } = useSelector(selectAuth);
  const loading = status === 'loading';
  const [blockInfo, setBlockInfo] = useState(null);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBlockInfo(null);
    const action = await dispatch(loginThunk({ email: form.email, password: form.password }));
    if (loginThunk.fulfilled.match(action)) {
      onLoggedIn?.(action.payload.user);
    } else if (action.payload?.status === 429 && action.payload?.data?.blocked) {
      setBlockInfo({
        message: action.payload.data.message,
        remainingMinutes: action.payload.data.remainingMinutes,
        adminEmail: action.payload.data.adminContactEmail,
      });
    } else {
      alert(action.payload?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div>
      {blockInfo && (
        <div style={{
          background: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <div style={{ 
            fontWeight: 'bold', 
            color: '#856404', 
            marginBottom: '12px',
            fontSize: '16px',
          }}>
            🔒 Tài khoản bị khóa
          </div>
          <div style={{ color: '#856404', marginBottom: '12px' }}>
            {blockInfo.message}
          </div>
          <div style={{
            background: 'white',
            padding: '12px',
            borderRadius: '4px',
            marginTop: '12px',
          }}>
            <div style={{ 
              fontWeight: '600', 
              color: '#dc3545',
              marginBottom: '8px',
            }}>
              📧 Liên hệ Admin để mở khóa:
            </div>
            <a 
              href={`mailto:${blockInfo.adminEmail}?subject=Yêu cầu mở khóa tài khoản&body=Xin chào Admin,%0D%0A%0D%0ATài khoản của tôi (${form.email}) đã bị khóa do đăng nhập sai quá nhiều lần.%0D%0A%0D%0AVui lòng hỗ trợ mở khóa tài khoản.%0D%0A%0D%0AXin cảm ơn!`}
              style={{
                color: '#007bff',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '16px',
              }}
            >
              {blockInfo.adminEmail}
            </a>
          </div>
          <div style={{ 
            marginTop: '12px',
            fontSize: '14px',
            color: '#666',
          }}>
            ⏱️ Hoặc đợi {blockInfo.remainingMinutes} phút để thử lại
          </div>
        </div>
      )}
      
      <form onSubmit={submit} className="form">
        <div className="field">
          <label className="label">Email</label>
          <input className="input" name="email" type="email" value={form.email} onChange={change} required />
        </div>
        <div className="field">
          <label className="label">Mật khẩu</label>
          <input className="input" name="password" type="password" value={form.password} onChange={change} required />
        </div>

        <div className="row">
          <button className="button" type="submit" disabled={loading}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</button>
        </div>
      </form>
    </div>
  );
}
