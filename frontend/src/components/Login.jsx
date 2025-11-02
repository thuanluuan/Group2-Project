import { useState } from "react";
import api from "../lib/api";

const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "";

export default function Login({ onLoggedIn, onForgot }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [blockInfo, setBlockInfo] = useState(null);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setBlockInfo(null);
    try {
      const res = await api.post(`/auth/login`, form);
      // Save token in localStorage for simple client-side auth
      localStorage.setItem("auth_token", res.data.token);
      localStorage.setItem("auth_user", JSON.stringify(res.data.user));
      onLoggedIn?.(res.data.user);
    } catch (err) {
      console.error(err);
      const errorData = err?.response?.data;
      
      // Kiểm tra nếu tài khoản bị block
      if (err?.response?.status === 429 && errorData?.blocked) {
        setBlockInfo({
          message: errorData.message,
          remainingMinutes: errorData.remainingMinutes,
          adminEmail: errorData.adminContactEmail,
        });
      } else {
        alert(errorData?.message || "Đăng nhập thất bại");
      }
    } finally {
      setLoading(false);
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
