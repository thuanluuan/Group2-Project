import React, { useState } from "react";

function AddUser({ onAddUser }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) return alert("Vui lòng nhập đủ thông tin!");
    try {
      setSubmitting(true);
      await onAddUser({ name, email });
      setName("");
      setEmail("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-user-form">
      <input
        type="text"
        placeholder="Tên người dùng"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email người dùng"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" disabled={submitting}>
        {submitting ? "Đang thêm..." : "Thêm người dùng"}
      </button>
    </form>
  );
}

export default AddUser;
