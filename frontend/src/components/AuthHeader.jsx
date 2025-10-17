import React from "react";

export default function AuthHeader({ user }) {
  if (!user) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
        {String(user.name || user.email || '?').charAt(0).toUpperCase()}
      </div>
      <div>
        <div style={{ fontWeight: 700 }}>{user?.name}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{user?.email}</div>
      </div>
    </div>
  );
}
