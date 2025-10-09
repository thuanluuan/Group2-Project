import React from "react";

function UserList({ users }) {
  return (
    <div className="user-list">
      <h2>Danh sách người dùng</h2>
      {users.length === 0 ? (
        <p>Chưa có người dùng nào.</p>
      ) : (
        <ul>
          {users.map((user, index) => (
            <li key={user._id ?? user.id ?? `${user.email}-${index}`}>
              <strong>{user.name}</strong> - {user.email}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UserList;
