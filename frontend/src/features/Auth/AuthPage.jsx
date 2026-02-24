import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthPage.css";

// Mode penyimpanan user: "session" atau "local"
const STORAGE_MODE = "session";

function setUser(user) {
  if (STORAGE_MODE === "session") {
    sessionStorage.setItem("user", user);
  } else {
    localStorage.setItem("user", user);
  }
}
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const API_URL = `${API_BASE_URL}/login`;

function AuthPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const navigate = useNavigate();

  // Login handler untuk user biasa
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

  // Admin login handler - menggunakan input yang sama tapi validasi admin
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!username || !password) {
      setMessage("Masukkan username dan password untuk login admin.");
      setIsError(true);
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!data.success) {
        setMessage(data.message || "Username atau password salah!");
        setIsError(true);
        return;
      }

      // Cek apakah user adalah admin
      if (data.user.role !== "admin") {
        setMessage(
          "Akses ditolak. Hanya admin yang bisa mengakses halaman ini."
        );
        setIsError(true);
        return;
      }

      // Jika admin, simpan session dan redirect
      setMessage("Login admin berhasil!");
      setIsError(false);

      setUser(JSON.stringify(data.user));
      navigate("/admin/users", { replace: true });
    } catch (error) {
      setMessage("Terjadi kesalahan koneksi ke server.");
      setIsError(true);
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

          <form className="login-form">
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
              <button
                type="button"
                onClick={handleLogin}
                className="btn btn-primary"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={handleAdminLogin}
                className="btn btn-secondary"
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
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
