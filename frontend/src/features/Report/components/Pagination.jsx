const Pagination = ({ currentPage, totalPages, setCurrentPage }) => {
  return (
    <div className="pagination-controls">
      <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
        &laquo; Sebelumnya
      </button>
      <span>
        Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
      </span>
      <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
        Berikutnya &raquo;
      </button>
    </div>
  );
};

export default Pagination;