import React from "react";

export default function AuthHeader({ user, onLogout }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 700 }}>{user?.name}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{user?.email}</div>
      </div>
      <div style={{ marginLeft: 12 }}>
        <button className="button button--ghost" onClick={onLogout}>Đăng xuất</button>
      </div>
    </div>
  );
}
