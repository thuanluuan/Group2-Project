import { useState, useEffect } from "react";
import UserList from "./components/UserList";
import AddUser from "./components/AddUser";

export default function App() {
  const [reloadKey, setReloadKey] = useState(0);
  const [editUser, setEditUser] = useState(null);
  const [notification, setNotification] = useState(null);

  // Handle notifications with auto-dismiss
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleEdit = (user) => {
    setEditUser(user);
    // Scroll to form when editing
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditUser(null);
  };

  const handleAdded = () => {
    setReloadKey((k) => k + 1);
    setEditUser(null);
    setNotification({
      type: 'success',
      message: editUser ? 'Cập nhật user thành công!' : 'Thêm user thành công!'
    });
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Users App</h1>
        <span className="badge">MongoDB + Express + React</span>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`notification notification--${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="grid" style={{ marginTop: 16 }}>
        <section className="card">
          <div className="card__header">
            {editUser ? "✏️ Sửa User" : "➕ Thêm User Mới"}
          </div>
          <div className="card__body">
            <AddUser 
              onAdded={handleAdded} 
              editUser={editUser}
              onCancelEdit={handleCancelEdit}
            />
          </div>
        </section>

        <section className="card">
          <div className="card__header">📋 Danh sách Users</div>
          <div className="card__body">
            <UserList key={reloadKey} onEdit={handleEdit} />
          </div>
        </section>
      </div>
    </div>
  );
}
