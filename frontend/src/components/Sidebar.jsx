// src/components/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ isOpen, closeSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Hapus data user dari storage
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");

    // 2. Redirect ke halaman login
    navigate("/login", { replace: true });
  };

  return (
    <aside className={`sidebar ${isOpen ? "show" : ""}`}>
      {/* Tombol Close Mobile */}
      <button className="sidebar-close-btn" onClick={closeSidebar}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div className="sidebar-header">
        <h2>Dashboard</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>Input WO</span>
        </NavLink>
        <NavLink
          to="/lihat-wo"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>Lihat WO</span>
        </NavLink>
        <NavLink
          to="/report"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>Laporan</span>
        </NavLink>
      </nav>

      {/* Tambahan: Bagian Footer Sidebar untuk Logout */}
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="nav-link logout-btn">
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;