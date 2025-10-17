import { useState } from "react";
import UserList from "./components/UserList";
import AddUser from "./components/AddUser";

export default function App() {
  const [reloadKey, setReloadKey] = useState(0);
  const [editUser, setEditUser] = useState(null);

  const handleEdit = (user) => {
    setEditUser(user);
  };

  const handleCancelEdit = () => {
    setEditUser(null);
  };

  const handleAdded = () => {
    setReloadKey((k) => k + 1);
    setEditUser(null);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Users App</h1>
        <span className="badge">MongoDB + Express + React</span>
      </header>

      <div className="grid" style={{ marginTop: 16 }}>
        <section className="card">
          <div className="card__header">
            {editUser ? "Sửa User" : "Thêm User"}
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
          <div className="card__header">Danh sách Users</div>
          <div className="card__body">
            <UserList key={reloadKey} onEdit={handleEdit} />
          </div>
        </section>
      </div>
    </div>
  );
}
