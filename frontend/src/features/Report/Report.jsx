import { useState, useEffect, useMemo } from "react";
import "./Report.css";

import ReportControls from "./components/ReportControls";
import ReportFilter from "./components/ReportFilter";
import ReportTable from "./components/ReportTable";
import ReportChart from "./components/ReportChart";
import Pagination from "./components/Pagination";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ITEMS_PER_PAGE = 15;

const Report = () => {
  const [allReports, setAllReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "reported_date", direction: "descending" });
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/reports`);
        if (!response.ok) throw new Error("Gagal mengambil data laporan dari server.");
        const result = await response.json();
        setAllReports(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  const filteredReports = useMemo(() => {
    let processedData = [...allReports];

    // Filter berdasarkan tanggal
    if (dateFilter !== "all") {
      const now = new Date();
      const startDate = new Date();
      if (dateFilter === "1m") startDate.setMonth(now.getMonth() - 1);
      if (dateFilter === "3m") startDate.setMonth(now.getMonth() - 3);
      if (dateFilter === "6m") startDate.setMonth(now.getMonth() - 6);
      if (dateFilter === "1y") startDate.setFullYear(now.getFullYear() - 1);
      processedData = processedData.filter((report) => new Date(report.reported_date) >= startDate);
    }

    // Filter berdasarkan pencarian
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      processedData = processedData.filter((report) =>
        Object.values(report).some((value) => String(value).toLowerCase().includes(lowercasedTerm))
      );
    }

    // Penyortiran data
    if (sortConfig.key) {
      processedData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return processedData;
  }, [allReports, searchTerm, dateFilter, sortConfig]);

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter]);

  const handleReopen = async (incident) => {
    if (window.confirm(`Apakah Anda yakin ingin membuka kembali tiket ${incident} dan memindahkannya ke Work Order?`)) {
      setActionLoading(incident);
      try {
        const response = await fetch(`${API_BASE_URL}/reports/${incident}/reopen`, { method: "POST" });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Gagal membuka kembali tiket.");
        setAllReports((prev) => prev.filter((report) => report.incident !== incident));
        alert("Tiket berhasil dibuka kembali!");
      } catch (err) {
        alert(`Error: ${err.message}`);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };
  
  if (isLoading) {
    return (
      <div className="report-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Memuat data laporan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-container">
        <div className="error-container">
          <h2>Gagal Memuat Laporan</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-container">
      <div className="page-header">
        <h1>Laporan Tiket Selesai</h1>
      </div>

      <ReportControls
        filteredCount={filteredReports.length}
        totalCount={allReports.length}
        dataToExport={filteredReports}
        allReports={allReports}
      />

      <ReportFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
      />

      <ReportTable
        reports={paginatedReports}
        sortConfig={sortConfig}
        requestSort={requestSort}
        handleReopen={handleReopen}
        actionLoading={actionLoading}
        allReports={allReports}
      />
      
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />
      )}

      <ReportChart 
        filteredReports={filteredReports} 
        isLoading={isLoading} 
      />
    </div>
  );
};

export default Report;