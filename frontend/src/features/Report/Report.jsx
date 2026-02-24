import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import "./Report.css";
import ReportTable from "./components/ReportTable";
import ReportChart from "./components/ReportChart";

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ITEMS_PER_PAGE = 15;

const Report = () => {
  const [allReports, setAllReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "reported_date",
    direction: "descending",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/reports`);
        if (!response.ok)
          throw new Error("Gagal mengambil data laporan dari server.");
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

    // Filter Tanggal
    if (dateFilter !== "all") {
      const now = new Date();
      const startDate = new Date();
      if (dateFilter === "1m") startDate.setMonth(now.getMonth() - 1);
      if (dateFilter === "3m") startDate.setMonth(now.getMonth() - 3);
      if (dateFilter === "6m") startDate.setMonth(now.getMonth() - 6);
      if (dateFilter === "1y") startDate.setFullYear(now.getFullYear() - 1);
      processedData = processedData.filter(
        (report) => new Date(report.reported_date) >= startDate
      );
    }

    // Filter Search
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      processedData = processedData.filter((report) =>
        Object.values(report).some((value) =>
          String(value).toLowerCase().includes(lowercasedTerm)
        )
      );
    }

    // Sorting
    if (sortConfig.key) {
      processedData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue)
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue)
          return sortConfig.direction === "ascending" ? 1 : -1;
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
    if (
      window.confirm(
        `Apakah Anda yakin ingin membuka kembali tiket ${incident}?`
      )
    ) {
      setActionLoading(incident);
      try {
        const response = await fetch(
          `${API_BASE_URL}/reports/${incident}/reopen`,
          { method: "POST" }
        );
        const result = await response.json();
        if (!response.ok || !result.success)
          throw new Error(result.message || "Gagal membuka kembali tiket.");
        setAllReports((prev) =>
          prev.filter((report) => report.incident !== incident)
        );
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

  const getTableHeaders = () => {
    if (allReports.length === 0) return [];
    const preferredOrder = [
      "incident",
      "summary",
      "reported_date",
      "korlap",
      "witel",
      "sektor",
      "workzone",
      "status",
    ];
    const headers = Object.keys(allReports[0]);
    return preferredOrder.filter((h) => headers.includes(h));
  };

  const handleExport = (format) => {
    const dataToExport = filteredReports;
    if (dataToExport.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }
    const filename = `laporan_tiket_selesai_${new Date()
      .toISOString()
      .slice(0, 10)}`;

    if (format === "excel") {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } else if (format === "csv") {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === "pdf") {
      try {
        const doc = new jsPDF({ orientation: "landscape" });
        doc.setFontSize(18);
        doc.text("Laporan Tiket Selesai", 14, 22);

        const pdfHeaders = getTableHeaders();
        const displayHeaders = pdfHeaders.map((h) =>
          h.replace(/_/g, " ").toUpperCase()
        );
        const body = dataToExport.map((row) =>
          pdfHeaders.map((header) => String(row[header] ?? ""))
        );

        autoTable(doc, {
          head: [displayHeaders],
          body: body,
          startY: 30,
          theme: "grid",
          headStyles: { fillColor: [229, 30, 37], textColor: 255 },
          styles: { fontSize: 8 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        doc.save(`${filename}.pdf`);
      } catch (err) {
        alert("Terjadi kesalahan saat membuat file PDF.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Memuat data laporan...</p>
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

      {/* Controls: Search, Filter, Export */}
      <div className="report-controls-wrapper">
        <div className="search-and-filters-report">
          <input
            type="text"
            placeholder="Cari di semua kolom..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="filter-item-report">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="date-select"
            >
              <option value="all">Semua Waktu</option>
              <option value="1m">1 Bulan Terakhir</option>
              <option value="3m">3 Bulan Terakhir</option>
              <option value="6m">6 Bulan Terakhir</option>
              <option value="1y">1 Tahun Terakhir</option>
            </select>
          </div>
        </div>

        <div className="export-buttons-row">
          <button onClick={() => handleExport("excel")} className="btn btn-success btn-export">
            <span className="icon">📊</span> Excel
          </button>
          <button onClick={() => handleExport("csv")} className="btn btn-primary btn-export">
            <span className="icon">📄</span> CSV
          </button>
          <button onClick={() => handleExport("pdf")} className="btn btn-danger btn-export">
            <span className="icon">📕</span> PDF
          </button>
        </div>
      </div>

      <ReportTable
        reports={paginatedReports}
        sortConfig={sortConfig}
        requestSort={requestSort}
        handleReopen={handleReopen}
        actionLoading={actionLoading}
        allReports={allReports}
      />

      {/* PAGINATION SECTION - DISAMAKAN DENGAN LIHAT WO */}
      <div className="pagination">
        <span className="page-info">
          {filteredReports.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}{" "}
          - {Math.min(filteredReports.length, currentPage * ITEMS_PER_PAGE)} dari{" "}
          {filteredReports.length}
        </span>
        <div className="pagination-controls">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            &laquo;
          </button>
          <span className="page-number">
            Hal {currentPage}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            &raquo;
          </button>
        </div>
      </div>

      <ReportChart filteredReports={filteredReports} isLoading={isLoading} />
    </div>
  );
};

export default Report;