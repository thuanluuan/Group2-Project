import { useState, useEffect } from "react";
import { useDispatch } from 'react-redux';
import { logout as logoutAction } from './store/authSlice';
import { useLocation, useNavigate } from 'react-router-dom';
import api from "./lib/api";
import UserList from "./components/UserList";
import AddUser from "./components/AddUser";
import ProfileView from "./components/ProfileView";
import ProfileForm from "./components/ProfileForm";
import AdminUserList from "./components/AdminUserList";
import AdminLogViewer from "./components/AdminLogViewer";
import HoverMenu from "./components/HoverMenu";
import Register from "./components/Register";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import ForgotPasswordLink from "./components/ForgotPasswordLink";
import ResetPasswordByToken from "./components/ResetPasswordByToken";
import ChangePasswordAdmin from "./components/ChangePasswordAdmin";
import AuthHeader from "./components/AuthHeader";
import { useToast } from "./components/Toast";
import { useConfirm } from "./components/ConfirmDialog";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [reloadKey, setReloadKey] = useState(0);
  const [editUser, setEditUser] = useState(null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("auth_user")) || null;
    } catch (e) {
      return null;
    }
  });
  const [view, setView] = useState(user ? "app" : "login"); // 'app' | 'login' | 'register' | 'forgot' | 'reset' | 'forgot-link' | 'reset-link'
  const [resetToken, setResetToken] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState(null); // for admin viewing others
  const [mode, setMode] = useState('profile'); // 'profile' | 'profile-edit' | 'change-password' | 'logs'
  const [editTarget, setEditTarget] = useState('self'); // 'self' | 'selected'
  const [listRefreshKey, setListRefreshKey] = useState(0);

  useEffect(() => {
    if (user) setView("app");
  }, [user]);

  // Route guarding inside App (in addition to ProtectedRoute)
  useEffect(() => {
    const pathname = location.pathname || '/';
    const needsAuth = pathname === '/profile' || pathname === '/admin';
    if (needsAuth && !user) {
      navigate('/login', { replace: true, state: { from: pathname } });
    }
  }, [location.pathname, user, navigate]);

  // On app mount, if token exists, verify and load user from /auth/me
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    (async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
        setView('app');
      } catch (e) {
        // invalid token handled by interceptor; ensure state reflects logged out
        setUser(null);
        setView('login');
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate]);

  // Detect reset token from URL to open reset-by-token view directly
  useEffect(() => {
    if (user) return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get('resetToken') || params.get('token');
    if (t) {
      setResetToken(t);
      setView('reset-link');
    }
  }, [user]);

  const handleEdit = (u) => setEditUser(u);
  const handleCancelEdit = () => setEditUser(null);
  const handleAdded = () => { setReloadKey((k) => k + 1); setEditUser(null); };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
    setView("login");
    dispatch(logoutAction());
    navigate('/login', { replace: true });
  };

  const toast = useToast?.() || null;
  const confirm = useConfirm?.();
  const handleDeleteSelf = async () => {
  const ok = await (confirm ? confirm("Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.") : Promise.resolve(window.confirm("Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.")));
    if (!ok) return;
    try {
      await api.delete('/auth/me');
      toast?.success?.('Đã xóa tài khoản');
      handleLogout();
    } catch (e) {
      toast?.error?.(e?.response?.data?.message || 'Xóa tài khoản thất bại');
    }
  };

  const handleLoggedIn = (u) => {
    setUser(u);
    setView("app");
    // Navigate based on role if current path is auth pages
    const path = u?.role === 'admin' ? '/admin' : '/profile';
    const from = location.state?.from;
    navigate(from && from !== '/login' ? from : path, { replace: true });
  };

  return (
    <div className="container">
      <header className="header">
        <h1>User Portal</h1>
        <span className="badge">MongoDB · Express · React</span>
      </header>
      {user && (
        <HoverMenu 
          user={user} 
          onLogout={handleLogout} 
          onEditProfile={() => { setEditTarget('self'); setMode('profile-edit'); }}
          onChangePassword={() => { setEditTarget('self'); setMode('change-password'); }}
          isChangePasswordMode={user.role === 'admin' && mode === 'change-password'}
          isProfileEditMode={user.role !== 'admin' && mode === 'profile-edit'}
          onGoHome={() => { setMode('profile'); setEditTarget('self'); }}
          onDeleteSelf={handleDeleteSelf}
        />
      )}

      <div style={{ marginTop: 16 }}>
        {!user && (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ flex: 1 }}>
                {view === "login" ? (
                  <>
                    <div className="card__header">Đăng nhập</div>
                    <div className="card__body"><Login onLoggedIn={handleLoggedIn} onForgot={() => setView('forgot')} /></div>
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
                      <button className="button button--ghost" onClick={() => setView('register')}>Tạo tài khoản</button>
                      <button className="button button--ghost" onClick={() => setView('forgot')}>Quên mật khẩu (OTP)</button>
                      <button className="button button--ghost" onClick={() => setView('forgot-link')}>Quên mật khẩu (link)</button>
                    </div>
                  </>
                ) : view === 'register' ? (
                  <>
                    <div className="card__header">Đăng ký</div>
                    <div className="card__body"><Register onRegistered={() => setView('login')} /></div>
                    <div style={{ marginTop: 12 }}>
                      <button className="button button--ghost" onClick={() => setView('login')}>Đã có tài khoản? Đăng nhập</button>
                    </div>
                  </>
                ) : view === 'forgot' ? (
                  <>
                    <div className="card__header">Quên mật khẩu</div>
                    <div className="card__body">
                      <ForgotPassword onRequested={(email) => { setResetEmail(email); setView('reset'); }} />
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <button className="button button--ghost" onClick={() => setView('login')}>Quay lại đăng nhập</button>
                    </div>
                  </>
                ) : view === 'reset' ? (
                  <>
                    <div className="card__header">Nhập OTP và mật khẩu mới</div>
                    <div className="card__body">
                      <ResetPassword defaultEmail={resetEmail} onDone={() => setView('login')} />
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <button className="button button--ghost" onClick={() => setView('login')}>Quay lại đăng nhập</button>
                    </div>
                  </>
                ) : view === 'forgot-link' ? (
                  <>
                    <div className="card__header">Quên mật khẩu (nhận link qua email)</div>
                    <div className="card__body">
                      <ForgotPasswordLink onRequested={() => { /* stay here, user kiểm tra email */ }} />
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <button className="button button--ghost" onClick={() => setView('login')}>Quay lại đăng nhập</button>
                      <button className="button button--ghost" onClick={() => setView('forgot')}>Đổi sang OTP</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="card__header">Đặt lại mật khẩu từ link</div>
                    <div className="card__body">
                      <ResetPasswordByToken defaultToken={resetToken} onDone={() => setView('login')} />
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <button className="button button--ghost" onClick={() => setView('login')}>Quay lại đăng nhập</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {user && (
          <>
            {/* Removed inline user header for cleaner look as requested */}

            {/* Profile area for all users */}
            {user.role !== 'admin' && (
              <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
                {mode === 'profile' ? (
                  <div className="card">
                    <div className="card__header">Hồ sơ của tôi</div>
                    <div className="card__body">
                      <ProfileView user={user} />
                      <div className="empty" style={{ marginTop: 12 }}>Để cập nhật thông tin, mở menu bên phải và chọn "Cập nhật thông tin"</div>
                    </div>
                  </div>
                ) : (
                  <div className="card">
                    <div className="card__header">Cập nhật thông tin cá nhân</div>
                    <div className="card__body">
                      <ProfileForm initialUser={user} allowSelfChangePassword focusChangePassword={false} onSaved={async () => {
                        try {
                          const res = await api.get('/auth/me');
                          setUser(res.data);
                        } catch {}
                        setMode('profile');
                      }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {user.role === 'admin' && (
              mode === 'change-password' ? (
                // Separate page: only the Change Password card, no account list
                <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
                  <ChangePasswordAdmin />
                </div>
              ) : mode === 'logs' ? (
                // Separate page: Logs viewer
                <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
                  <AdminLogViewer onBack={() => setMode('profile')} />
                </div>
              ) : (
                <div className="grid" style={{ gridTemplateColumns: '0.9fr 1.1fr' }}>
                  <div>
                    <div className="card" style={{ marginBottom: 16 }}>
                      <div className="card__body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div className="badge">Quản trị</div>
                        <button className="button button--ghost" onClick={() => { setEditTarget('self'); setMode('profile'); }}>Hồ sơ của tôi</button>
                        <button className="button button--ghost" onClick={() => setMode('logs')}>📊 Logs</button>
                      </div>
                    </div>
                    <AdminUserList
                      refreshKey={listRefreshKey}
                      onSelect={(u) => { setSelectedUser(u); setEditTarget('selected'); setMode('profile'); }}
                      onDeleted={(summary) => {
                        setListRefreshKey(k => k + 1);
                        if (selectedUser && summary?.deleted > 0) {
                          setSelectedUser(null);
                          setEditTarget('self');
                          setMode('profile');
                        }
                      }}
                    />
                  </div>
                  <div className="card">
                    <div className="card__header">{editTarget === 'self' ? `Hồ sơ: ${user.name}` : (selectedUser ? `Hồ sơ: ${selectedUser.name}` : 'Hồ sơ')}</div>
                    <div className="card__body">
                      {editTarget === 'self' ? (
                        mode === 'profile' ? (
                          <>
                            <ProfileView user={user} />
                            <div className="row" style={{ marginTop: 12 }}>
                              <button className="button" onClick={() => setMode('profile-edit')}>Sửa thông tin</button>
                            </div>
                          </>
                        ) : (
                          <ProfileForm initialUser={user} allowSelfChangePassword={false} focusChangePassword={false} onSaved={async () => {
                            try {
                              const res = await api.get('/auth/me');
                              setUser(res.data);
                            } catch {}
                            setMode('profile');
                          }} />
                        )
                      ) : (
                        !selectedUser ? (
                          <div className="empty">Chọn một tài khoản ở danh sách để xem/cập nhật</div>
                        ) : (
                          mode === 'profile' ? (
                            <>
                              <ProfileView user={selectedUser} />
                              <div className="row" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                <button className="button" onClick={() => setMode('profile-edit')}>Sửa thông tin</button>
                                {selectedUser?.role !== 'admin' && (
                                  <button className="button button--danger" onClick={async () => {
                                    if (!selectedUser) return;
                                    const ok = await (confirm ? confirm(`Xóa người dùng '${selectedUser.name}'? Hành động này không thể hoàn tác.`) : Promise.resolve(window.confirm(`Xóa người dùng '${selectedUser.name}'? Hành động này không thể hoàn tác.`)));
                                    if (!ok) return;
                                    try {
                                      await api.delete(`/users/${selectedUser._id}`);
                                      setSelectedUser(null);
                                      setListRefreshKey(k => k + 1);
                                      toast?.success?.('Đã xóa người dùng');
                                    } catch (e) {
                                      toast?.error?.(e?.response?.data?.message || 'Xóa thất bại');
                                    }
                                  }}>Xóa người dùng</button>
                                )}
                              </div>
                            </>
                          ) : (
                            <ProfileForm initialUser={selectedUser} isAdminEditing userId={selectedUser._id} onSaved={async () => {
                              try {
                                const res = await api.get(`/users/${selectedUser._id}`);
                                setSelectedUser(res.data);
                              } catch {}
                              setMode('profile');
                            }} />
                          )
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </>
  )}
      </div>
    </div>
  );
}
