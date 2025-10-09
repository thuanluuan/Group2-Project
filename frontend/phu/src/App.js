import React, { useEffect, useState } from "react";
import AddUser from "./AddUser";
import UserList from "./UserList";
import "./App.css";
import api from "./api";

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/users");
        // Chấp nhận nhiều định dạng response phổ biến
        const raw = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.users)
          ? res.data.users
          : [];
        // Chuẩn hoá một chút nếu backend dùng MongoDB (có thể name/email nằm ở fields khác)
        const normalized = raw.map((u) => ({
          _id: u._id ?? u.id,
          name: u.name ?? u.fullName ?? u.username ?? "(Không tên)",
          email: u.email ?? u.mail ?? "(Không email)",
        }));
        setUsers(normalized);
      } catch (err) {
        console.error(err);
        setError("Không thể tải danh sách người dùng. Hãy kiểm tra API backend.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleAddUser = async (newUser) => {
    try {
      setError("");
      const res = await api.post("/users", newUser);
      // Chấp nhận các dạng trả về: object user, {data: user}, hoặc {user: user}
      const createdRaw = res?.data?.user ?? res?.data?.data ?? res?.data ?? newUser;
      const created = {
        _id: createdRaw._id ?? createdRaw.id,
        name: createdRaw.name ?? createdRaw.fullName ?? createdRaw.username ?? newUser.name,
        email: createdRaw.email ?? createdRaw.mail ?? newUser.email,
      };
      setUsers((prev) => [...prev, created]);
    } catch (err) {
      console.error(err);
      setError("Không thể thêm người dùng. Hãy kiểm tra API backend.");
      throw err; // cho phép component con biết lỗi nếu cần
    }
  };

  return (
    <div className="app-container">
      <h1>Quản lý người dùng</h1>
      {error && <div className="error">{error}</div>}
      <AddUser onAddUser={handleAddUser} />
      {loading ? <p>Đang tải...</p> : <UserList users={users} />}
    </div>
  );
}

export default App;
