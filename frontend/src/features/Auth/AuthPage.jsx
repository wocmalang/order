import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthPage.css";

function AuthPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const API_URL = "https://order-be.gunawanferdian007.workers.dev/login";

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

      // Simpan user ke localStorage
      sessionStorage.setItem("user", JSON.stringify(data.user));

      // Redirect ke halaman utama
      navigate("/", { replace: true });
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
              <button type="button" className="btn btn-secondary">
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
