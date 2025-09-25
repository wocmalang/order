import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthPage.css";

// Mode penyimpanan user: "session" atau "local"
const STORAGE_MODE = "session"; // Ubah ke "local" jika ingin persistent login

function setUser(user) {
  if (STORAGE_MODE === "session") {
    sessionStorage.setItem("user", user);
  } else {
    localStorage.setItem("user", user);
  }
}

function getUser() {
  if (STORAGE_MODE === "session") {
    return sessionStorage.getItem("user");
  }
  return localStorage.getItem("user");
}

function removeUser() {
  if (STORAGE_MODE === "session") {
    sessionStorage.removeItem("user");
  } else {
    localStorage.removeItem("user");
  }
}

const API_URL = "https://order-be.gunawanferdian007.workers.dev/login";
// Endpoint untuk mengelola user (pastikan backend sudah ada)
const USER_MANAGE_URL = "https://order-be.gunawanferdian007.workers.dev/users";

function AuthPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // State untuk admin panel
  const [adminUsers, setAdminUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "user",
  });
  const [adminCred, setAdminCred] = useState({ username: "", password: "" });
  const [adminMsg, setAdminMsg] = useState("");

  const navigate = useNavigate();

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!data.success) {
        setMessage(data.message || "Gagal untuk login, silakan coba lagi.");
        setIsError(true);
        return;
      }

      setMessage("Login berhasil!");
      setIsError(false);

      setUser(JSON.stringify(data.user));
      navigate("/", { replace: true });
    } catch (error) {
      setMessage("Terjadi kesalahan koneksi ke server.");
      setIsError(true);
    }
  };

  // --- ADMIN PANEL FITUR ---
  // Cek apakah user login adalah admin
  const isAdmin = () => {
    try {
      const user = JSON.parse(getUser());
      return user && user.role === "admin";
    } catch {
      return false;
    }
  };

  // Tampilkan panel admin jika user admin
  React.useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
    // eslint-disable-next-line
  }, [showAdminPanel]);

  // Ambil daftar user dari backend
  const fetchUsers = async () => {
    try {
      const res = await fetch(USER_MANAGE_URL);
      const data = await res.json();
      if (data.success) setAdminUsers(data.users || []);
    } catch {
      setAdminMsg("Gagal mengambil data user.");
    }
  };

  // Tambah user baru
  const handleAddUser = async (e) => {
    e.preventDefault();
    setAdminMsg("");
    try {
      const res = await fetch(USER_MANAGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (data.success) {
        setAdminMsg("User berhasil ditambahkan.");
        setNewUser({ username: "", password: "", role: "user" });
        fetchUsers();
      } else {
        setAdminMsg(data.message || "Gagal menambah user.");
      }
    } catch {
      setAdminMsg("Gagal menambah user.");
    }
  };

  // Hapus user
  const handleDeleteUser = async (username) => {
    if (!window.confirm(`Hapus user ${username}?`)) return;
    try {
      const res = await fetch(`${USER_MANAGE_URL}/${username}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setAdminMsg("User berhasil dihapus.");
        fetchUsers();
      } else {
        setAdminMsg(data.message || "Gagal menghapus user.");
      }
    } catch {
      setAdminMsg("Gagal menghapus user.");
    }
  };

  // Ganti kredensial admin sendiri
  const handleChangeAdminCred = async (e) => {
    e.preventDefault();
    setAdminMsg("");
    try {
      const res = await fetch(`${USER_MANAGE_URL}/admin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminCred),
      });
      const data = await res.json();
      if (data.success) {
        setAdminMsg("Kredensial admin berhasil diubah.");
        setAdminCred({ username: "", password: "" });
      } else {
        setAdminMsg(data.message || "Gagal mengubah kredensial admin.");
      }
    } catch {
      setAdminMsg("Gagal mengubah kredensial admin.");
    }
  };

  return (
    <div className="auth-page-container">
      <div className="login-card">
        <div className="form-panel">
          <div className="form-header">
            <h1 className="logo-text">IOC-W</h1>
            <h2>Flexible Order and Workforce System</h2>
            <p>Hello! Please enter your details</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                Remember Me
              </label>
            </div>

            <div className="button-group">
              <button type="submit" className="btn btn-primary">
                Log in
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAdminPanel((v) => !v)}
              >
                Admin IOC-W
              </button>
            </div>

            {message && (
              <p className={`message ${isError ? "error" : "success"}`}>
                {message}
              </p>
            )}
          </form>

          {/* Panel Admin */}
          {showAdminPanel && isAdmin() && (
            <div className="admin-panel">
              <h3>Manajemen User</h3>
              <form onSubmit={handleAddUser} className="admin-form">
                <input
                  type="text"
                  placeholder="Username baru"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser((u) => ({ ...u, username: e.target.value }))
                  }
                  required
                />
                <input
                  type="password"
                  placeholder="Password baru"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser((u) => ({ ...u, password: e.target.value }))
                  }
                  required
                />
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser((u) => ({ ...u, role: e.target.value }))
                  }
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit">Tambah User</button>
              </form>
              <ul>
                {adminUsers.map((u) => (
                  <li key={u.username}>
                    {u.username} ({u.role}){" "}
                    <button onClick={() => handleDeleteUser(u.username)}>
                      Hapus
                    </button>
                  </li>
                ))}
              </ul>
              <h4>Ganti Kredensial Admin</h4>
              <form onSubmit={handleChangeAdminCred} className="admin-form">
                <input
                  type="text"
                  placeholder="Username admin baru"
                  value={adminCred.username}
                  onChange={(e) =>
                    setAdminCred((c) => ({ ...c, username: e.target.value }))
                  }
                  required
                />
                <input
                  type="password"
                  placeholder="Password admin baru"
                  value={adminCred.password}
                  onChange={(e) =>
                    setAdminCred((c) => ({ ...c, password: e.target.value }))
                  }
                  required
                />
                <button type="submit">Ganti Admin</button>
              </form>
              {adminMsg && <p className="message">{adminMsg}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
