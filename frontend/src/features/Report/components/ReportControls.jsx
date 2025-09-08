import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ReportControls = ({ filteredCount, totalCount, dataToExport, allReports }) => {
  
  const getTableHeaders = () => {
    if (allReports.length === 0) return [];
    const preferredOrder = ["incident", "summary", "reported_date", "owner_group", "witel", "sektor", "workzone", "status"];
    const headers = Object.keys(allReports[0]);
    return preferredOrder.filter((h) => headers.includes(h));
  };
  
  const handleExport = (format) => {
    if (dataToExport.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }
    const filename = `laporan_tiket_selesai_${new Date().toISOString().slice(0, 10)}`;

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
        const displayHeaders = pdfHeaders.map((h) => h.replace(/_/g, " ").toUpperCase());
        const body = dataToExport.map((row) => pdfHeaders.map((header) => String(row[header] ?? "")));

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

  return (
    <div className="controls-panel">
      <div className="export-controls">
        <button onClick={() => handleExport("excel")} className="btn btn-primary">Ekspor Excel</button>
        <button onClick={() => handleExport("csv")} className="btn btn-secondary">Ekspor CSV</button>
        <button onClick={() => handleExport("pdf")} className="btn btn-info">Ekspor PDF</button>
      </div>
      <div className="report-summary">
        Menampilkan: <strong>{filteredCount}</strong> dari <strong>{totalCount}</strong>
      </div>
    </div>
  );
};

export default ReportControls;