const ReportFilter = ({ searchTerm, setSearchTerm, dateFilter, setDateFilter }) => {
  return (
    <div className="filter-container">
      <input
        type="text"
        placeholder="Cari di semua kolom..."
        className="search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <select
        className="date-filter-dropdown"
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
      >
        <option value="all">Semua Waktu</option>
        <option value="1m">1 Bulan Terakhir</option>
        <option value="3m">3 Bulan Terakhir</option>
        <option value="6m">6 Bulan Terakhir</option>
        <option value="1y">1 Tahun Terakhir</option>
      </select>
    </div>
  );
};

export default ReportFilter;