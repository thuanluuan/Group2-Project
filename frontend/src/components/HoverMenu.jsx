import React from "react";

export default function HoverMenu({ user, onLogout, onEditProfile, onDeleteSelf, onChangePassword, isChangePasswordMode = false, isProfileEditMode = false, onGoHome }) {
  if (!user) return null;
  return (
    <aside className="hover-menu" title={`${user.name} <${user.email}>`}>
      <div className="hover-menu__tab" aria-hidden>
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="avatar" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 6 }} />
        ) : (
          <span>{String(user.name || user.email || '?').charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="hover-menu__content">
        <div className="hover-menu__name">{user.name}</div>
        {user.email && <div className="hover-menu__email">{user.email}</div>}
        <div className="spacer" />
        {user?.role !== 'admin' && (
          <>
            {isProfileEditMode ? (
              <button className="button button--ghost hover-menu__logout" onClick={onGoHome}>Về trang chủ</button>
            ) : (
              <button className="button button--ghost hover-menu__logout" onClick={onEditProfile}>Cập nhật thông tin</button>
            )}
            <div className="spacer" />
            <button className="button button--danger hover-menu__logout" onClick={onDeleteSelf}>Xóa tài khoản</button>
          </>
        )}
        {user?.role === 'admin' && (
          <>
            {isChangePasswordMode ? (
              <button className="button button--ghost hover-menu__logout" onClick={onGoHome}>Về trang chủ</button>
            ) : (
              <button className="button button--ghost hover-menu__logout" onClick={onChangePassword}>Đổi mật khẩu</button>
            )}
          </>
        )}
        <div className="spacer" />
        <button className="button hover-menu__logout" onClick={onLogout}>Đăng xuất</button>
      </div>
    </aside>
  );
}
