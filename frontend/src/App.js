import { useState, useEffect } from "react";
import api from "./lib/api";
import UserList from "./components/UserList";
import AddUser from "./components/AddUser";
import Register from "./components/Register";
import Login from "./components/Login";
import AuthHeader from "./components/AuthHeader";

export default function App() {
  const [reloadKey, setReloadKey] = useState(0);
  const [editUser, setEditUser] = useState(null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("auth_user")) || null;
    } catch (e) {
      return null;
    }
  });
  const [view, setView] = useState(user ? "app" : "login"); // 'app' | 'login' | 'register'

  useEffect(() => {
    if (user) setView("app");
  }, [user]);

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
      }
    })();
  }, []);

  const handleEdit = (u) => setEditUser(u);
  const handleCancelEdit = () => setEditUser(null);
  const handleAdded = () => { setReloadKey((k) => k + 1); setEditUser(null); };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
    setView("login");
  };

  const handleLoggedIn = (u) => {
    setUser(u);
    setView("app");
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Users App</h1>
        <span className="badge">MongoDB + Express + React</span>
      </header>

      <div style={{ marginTop: 16 }}>
        {!user && (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ flex: 1 }}>
                {view === "login" ? (
                  <>
                    <div className="card__header">Đăng nhập</div>
                    <div className="card__body"><Login onLoggedIn={handleLoggedIn} /></div>
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
                      <button className="button button--ghost" onClick={() => setView('register')}>Tạo tài khoản</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="card__header">Đăng ký</div>
                    <div className="card__body"><Register onRegistered={() => setView('login')} /></div>
                    <div style={{ marginTop: 12 }}>
                      <button className="button button--ghost" onClick={() => setView('login')}>Đã có tài khoản? Đăng nhập</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {user && user.role === 'admin' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <AuthHeader user={user} onLogout={handleLogout} />
            </div>

            <div className="grid">
              <section className="card">
                <div className="card__header">{editUser ? "Sửa User" : "Thêm User"}</div>
                <div className="card__body">
                  {editUser ? (
                    <AddUser onAdded={handleAdded} editUser={editUser} onCancelEdit={handleCancelEdit} />
                  ) : (
                    <div className="empty">Để tạo tài khoản mới, vui lòng dùng mục Đăng ký ở màn hình đăng nhập.</div>
                  )}
                </div>
              </section>

              {user?.role === 'admin' && (
                <section className="card">
                  <div className="card__header">Danh sách Users</div>
                  <div className="card__body">
                    <UserList key={reloadKey} onEdit={handleEdit} />
                  </div>
                </section>
              )}
            </div>
          </>
  )}
      </div>
    </div>
  );
}
