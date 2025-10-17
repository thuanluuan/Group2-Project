import React, { useEffect, useState } from "react";
import api from "../lib/api";

export default function AdminUserList({ onSelect, refreshKey = 0 }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/users');
        if (!cancelled) setUsers(res.data || []);
      } catch (e) {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (loading) return <div className="card"><div className="card__body">Đang tải...</div></div>;

  return (
    <div className="card">
      <div className="card__header">Danh sách tài khoản</div>
      <div className="card__body">
        <ul className="list">
          {users.map(u => (
            <li key={u._id} className="item" onClick={() => onSelect?.(u)} style={{ cursor: 'pointer' }}>
              <div style={{ fontWeight: 600 }}>{u.name}</div>
              <div className="meta">{u.email}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
