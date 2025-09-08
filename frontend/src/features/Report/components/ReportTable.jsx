const ReportTable = ({ reports, sortConfig, requestSort, handleReopen, actionLoading, allReports }) => {

  const getTableHeaders = () => {
    if (allReports.length === 0) return [];
    const preferredOrder = ["incident", "summary", "reported_date", "owner_group", "witel", "sektor", "workzone", "status"];
    const headers = Object.keys(allReports[0]);
    return preferredOrder.filter((h) => headers.includes(h));
  };
    
  return (
    <div className="table-container">
      <table className="report-table">
        <thead>
          <tr>
            <th className="action-header sticky-col">AKSI</th>
            {getTableHeaders().map((key) => (
              <th key={key} onClick={() => requestSort(key)} className="sortable-header">
                {key.replace(/_/g, " ").toUpperCase()}
                {sortConfig.key === key && (
                  <span className="sort-indicator">
                    {sortConfig.direction === "ascending" ? " ▲" : " ▼"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reports.length === 0 ? (
            <tr>
              <td colSpan={getTableHeaders().length + 1} className="no-data">
                Tidak ada data laporan yang cocok.
              </td>
            </tr>
          ) : (
            reports.map((report) => (
              <tr key={report.incident}>
                <td className="action-cell sticky-col">
                  <button
                    onClick={() => handleReopen(report.incident)}
                    className="btn btn-reopen"
                    disabled={actionLoading === report.incident}
                  >
                    {actionLoading === report.incident ? "Memproses..." : "Re-open"}
                  </button>
                </td>
                {getTableHeaders().map((key) => (
                  <td key={key} className="data-cell truncate" title={report[key]}>
                    {String(report[key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ReportTable;