import React, { useEffect, useState } from "react";
import "./UserManagementPage.css";
const USER_MANAGE_URL = "https://order-be.gunawanferdian007.workers.dev/users";

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "user",
  });
  const [msg, setMsg] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch(USER_MANAGE_URL);
      const data = await res.json();
      if (data.success) setUsers(data.users || []);
      else setMsg(data.message || "Gagal mengambil data user.");
    } catch {
      setMsg("Gagal mengambil data user.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetch(USER_MANAGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("User berhasil ditambahkan.");
        setNewUser({ username: "", password: "", role: "user" });
        fetchUsers();
      } else {
        setMsg(data.message || "Gagal menambah user.");
      }
    } catch {
      setMsg("Gagal menambah user.");
    }
  };

  const handleDeleteUser = async (username) => {
    if (!window.confirm(`Hapus user ${username}?`)) return;
    try {
      const res = await fetch(`${USER_MANAGE_URL}/${username}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setMsg("User berhasil dihapus.");
        fetchUsers();
      } else {
        setMsg(data.message || "Gagal menghapus user.");
      }
    } catch {
      setMsg("Gagal menghapus user.");
    }
  };

  return (
    <div className="user-management-container">
      <h2>Manajemen User</h2>
      <form onSubmit={handleAddUser} className="user-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Username baru"
              value={newUser.username}
              onChange={(e) =>
                setNewUser((u) => ({ ...u, username: e.target.value }))
              }
              required
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Password baru"
              value={newUser.password}
              onChange={(e) =>
                setNewUser((u) => ({ ...u, password: e.target.value }))
              }
              required
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="form-row align-end">
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={newUser.role}
              onChange={(e) =>
                setNewUser((u) => ({ ...u, role: e.target.value }))
              }
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="btn-full">
            Tambah User
          </button>
        </div>
      </form>
      <ul className="user-list">
        {users.map((u) => (
          <li key={u.username}>
            <span>
              <b>{u.username}</b> <span className="role-badge">{u.role}</span>
            </span>
            <button
              className="btn-delete"
              onClick={() => handleDeleteUser(u.username)}
            >
              Hapus
            </button>
          </li>
        ))}
      </ul>
      {msg && <p className="message">{msg}</p>}
    </div>
  );
}

export default UserManagementPage;
