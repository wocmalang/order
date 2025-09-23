import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import "./App.css";
import Layout from "./components/Layout";
import InputWO from "./features/InputWO/InputWO";
import LihatWO from "./features/LihatWO/LihatWO";
import Report from "./features/Report/Report";
import AuthPage from "./features/Auth/AuthPage";

// Komponen ProtectedRoute
function ProtectedRoute({ children }) {
  const location = useLocation();
  const user = sessionStorage.getItem("user"); // gunakan sessionStorage
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Login tanpa Layout */}
        <Route path="/login" element={<AuthPage />} />
        {/* Semua halaman lain pakai Layout dan proteksi */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <InputWO />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/lihat-wo"
          element={
            <ProtectedRoute>
              <Layout>
                <LihatWO />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <Layout>
                <Report />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
