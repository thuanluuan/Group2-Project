import React from "react";

export default function ProfileView({ user }) {
  if (!user) return null;
  const dobStr = user.dob ? new Date(user.dob).toLocaleDateString() : "-";
  return (
    <div className="card">
      <div className="card__header">Thông tin cá nhân</div>
      <div className="card__body">
        {user.avatarUrl && (
          <div style={{ marginBottom: 12 }}>
            <img src={user.avatarUrl} alt="avatar" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)' }} />
          </div>
        )}
        <div className="field"><span className="label">Họ tên</span><div>{user.name}</div></div>
        <div className="spacer" />
        <div className="field"><span className="label">Email</span><div>{user.email}</div></div>
        <div className="spacer" />
        <div className="field"><span className="label">Ngày sinh</span><div>{dobStr}</div></div>
        <div className="spacer" />
        {user.phone && (<><div className="field"><span className="label">Số điện thoại</span><div>{user.phone}</div></div><div className="spacer" /></>)}
        {user.address && (<><div className="field"><span className="label">Địa chỉ</span><div>{user.address}</div></div><div className="spacer" /></>)}
        {user.avatarUrl && (<><div className="field"><span className="label">Ảnh</span><div><a href={user.avatarUrl} target="_blank" rel="noreferrer">Mở ảnh</a></div></div><div className="spacer" /></>)}
        
        <div className="field"><span className="label">Vai trò</span><div>{user.role}</div></div>
      </div>
    </div>
  );
}
