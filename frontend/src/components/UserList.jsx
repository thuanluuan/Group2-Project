import { useEffect, useState } from "react";
import axios from "axios";

// base API URL: use REACT_APP_API_URL when provided (e.g. http://192.168.x.y:3000)
const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/users`);
        if (!cancelled) setUsers(res.data || []);
      } catch (err) {
        console.error(err);
        alert("Không tải được users");
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="loading">Đang tải...</p>;
  if (!users.length)
    return <div className="empty">Chưa có user nào. Hãy thêm mới ở khung bên cạnh.</div>;

  return (
    <ul className="list">
      {users.map((u) => (
        <li key={u._id || `${u.name}-${u.email}`}
            className="item"
            title={`${u.name} <${u.email}>`}>
          <div>
            <div style={{ fontWeight: 600 }}>{u.name}</div>
            <div className="meta">{u.email}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
