import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Layout from "./components/Layout";
import InputWO from "./features/InputWO/InputWO";
import LihatWO from "./features/LihatWO/LihatWO";
import Report from "./features/Report/Report";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route index element={<InputWO />} />
          <Route path="/lihat-wo" element={<LihatWO />} />
          <Route path="/report" element={<Report />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
