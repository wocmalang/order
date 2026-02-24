import { useState, useEffect, useMemo, useCallback } from "react";
import "./LihatWO.css";
import { useDebounce } from "../../hooks/useDebounce";
import { getInitialVisibleKeys } from "../../utils/woUtils";
import { WorkOrderRow } from "./components/WorkOrderRow";
import { EditModal } from "./components/EditModal";
import SortIcon from "../../components/SortIcon";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ITEMS_PER_PAGE = 10;
const ALL_STATUS_OPTIONS = ["OPEN", "CLOSED"];

const ALL_POSSIBLE_KEYS = [
  "incident", "korlap", "sektor", "workzone", "status", "summary", "reported_date",
  "ticket_id_gamas", "external_ticket_id", "customer_id", "customer_name",
  "service_id", "service_no", "description_assignment", "reported_by",
  "reported_priority", "source_ticket", "channel", "contact_phone", "contact_name",
  "contact_email", "status_date", "booking_date", "resolve_date", "date_modified",
  "last_update_worklog", "closed_by", "closed_reopen_by", "guarantee_status",
  "ttr_customer", "ttr_agent", "ttr_mitra", "ttr_nasional", "th_pending",
  "th_region", "th_witel", "ttr_end_to_end", "owner_group", "owner", "witel",
  "region", "subsidiary", "territory_near_end", "territory_far_end",
  "customer_segment", "customer_type", "customer_category", "service_type",
  "slg", "technology", "lapul", "gaul", "onu_rx", "pending_reason",
  "incident_domain", "symptom", "hierarchy_path", "solution",
  "description_actual_solution", "kode_produk", "perangkat", "technician",
  "device_name", "sn_ont", "tipe_ont", "manufacture_ont", "impacted_site",
  "cause", "resolution", "worklog_summary", "classification_flag", "realm",
  "related_to_gamas", "toc_result", "scc_result", "note", "notes_eskalasi",
  "rk_information", "external_ticket_tier_3", "classification_path", "urgency",
  "alamat",
];

// Helper untuk format text
const getFormatText = (item) => {
  if (!item) return "";
  let format = `*INCIDENT*
- TICKET ID: ${item.incident || "-"}
- SERVICE ID: ${item.service_id || "-"}
- CUSTOMER: ${item.customer_name || "-"}
- CP: ${item.contact_name || "-"} (${item.contact_phone || "-"})
- ALAMAT: ${item.alamat || "-"}
- PROBLEM: ${item.summary || "-"}
- WITEL: ${item.witel || "-"}
- SEKTOR: ${item.sektor || "-"}
- WORKZONE: ${item.workzone || "-"}`;

  if (["HVC_PLATINUM", "HV_DIAMOND"].includes(item.customer_type)) {
    format += `\n- KORLAP: ${item.korlap || "-"}`;
  }
  return format;
};

const LihatWO = () => {
  // --- STATE ---
  const [woData, setWoData] = useState([]);
  const [workzoneMap, setWorkzoneMap] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);

  // Modal States
  const [editItem, setEditItem] = useState(null);
  const [formatItem, setFormatItem] = useState(null); // State untuk Modal Format

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filter, setFilter] = useState({ status: "", sektor: "", workzone: "", korlap: "", witel: "" });
  const [sortConfig, setSortConfig] = useState({ key: "incident", direction: "asc" });

  // Column Visibility
  const [visibleKeys, setVisibleKeys] = useState(new Set());
  const [draftVisibleKeys, setDraftVisibleKeys] = useState(new Set());
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [columnSearchTerm, setColumnSearchTerm] = useState("");

  // --- EFFECT: FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [woRes, mapRes] = await Promise.all([
          fetch(`${API_BASE_URL}/view-d1`),
          fetch(`${API_BASE_URL}/workzone-map`),
        ]);

        if (!woRes.ok || !mapRes.ok) throw new Error("Gagal mengambil data.");

        const woJson = await woRes.json();
        const mapJson = await mapRes.json();

        setWoData(Array.isArray(woJson.data) ? woJson.data : []);
        setWorkzoneMap(Array.isArray(mapJson) ? mapJson : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (visibleKeys.size === 0) {
      setVisibleKeys(getInitialVisibleKeys(ALL_POSSIBLE_KEYS));
    }
  }, [visibleKeys.size]);

  // --- MEMOIZED HELPERS (Filter logic sama seperti sebelumnya) ---
  const getWorkzonesForSektor = useCallback((sektor) => {
    return workzoneMap.filter((m) => m.sektor === sektor).map((m) => m.workzone).sort();
  }, [workzoneMap]);

  const getKorlapsForWorkzone = useCallback((workzone) => {
    const match = workzoneMap.find((m) => m.workzone === workzone);
    return match ? (match.korlaps || match.korlap_username || "").split(",").map(k => k.trim()).filter(Boolean) : [];
  }, [workzoneMap]);

  const filterOptions = useMemo(() => {
    const allSektors = [...new Set(workzoneMap.map(i => i.sektor).filter(Boolean))].sort();
    const availableWorkzones = filter.sektor ? getWorkzonesForSektor(filter.sektor) : [...new Set(workzoneMap.map(i => i.workzone).filter(Boolean))].sort();
    const availableKorlaps = filter.workzone ? getKorlapsForWorkzone(filter.workzone) : [...new Set(workzoneMap.flatMap(i => getKorlapsForWorkzone(i.workzone)))].sort();
    const allWitels = [...new Set(woData.map(d => d.witel).filter(Boolean))].sort();

    return { witel: allWitels, sektor: allSektors, workzone: availableWorkzones, korlap: availableKorlaps };
  }, [woData, workzoneMap, filter, getWorkzonesForSektor, getKorlapsForWorkzone]);

  const sortedData = useMemo(() => {
    const filtered = woData.filter((item) => {
      const searchMatch = Object.entries(item).some(([key, val]) =>
        visibleKeys.has(key) && String(val).toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
      return searchMatch &&
        (!filter.status || item.status === filter.status) &&
        (!filter.witel || item.witel === filter.witel) &&
        (!filter.sektor || item.sektor === filter.sektor) &&
        (!filter.workzone || item.workzone === filter.workzone) &&
        (!filter.korlap || item.korlap === filter.korlap);
    });

    if (!sortConfig.key) return filtered;
    return [...filtered].sort((a, b) => {
      const valA = a[sortConfig.key] || "";
      const valB = b[sortConfig.key] || "";
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [woData, debouncedSearchTerm, filter, visibleKeys, sortConfig]);

  useEffect(() => setCurrentPage(1), [sortedData.length]);

  // --- HANDLERS ---
  const handleFilterChange = (field, value) => {
    setFilter(prev => {
      const next = { ...prev, [field]: value };
      if (field === "sektor") { next.workzone = ""; next.korlap = ""; }
      if (field === "workzone") next.korlap = getKorlapsForWorkzone(value)[0] || "";
      return next;
    });
  };

  const handleUpdateRow = useCallback(async (originalItem, updatedFields) => {
    const dataToSend = { ...originalItem, ...updatedFields };
    if (updatedFields.workzone) {
      const match = workzoneMap.find(m => m.workzone === updatedFields.workzone);
      dataToSend.sektor = match?.sektor || "";
      dataToSend.korlap = match?.korlaps || match?.korlap_username || null;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/work-orders/${originalItem.incident}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      if (!res.ok) throw new Error("Gagal menyimpan data");
      const result = await res.json();
      setWoData(prev => prev.map(d => d.incident === originalItem.incident ? result.data : d));
    } catch (err) {
      alert(err.message);
    }
  }, [workzoneMap]);

  const handleBulkAction = async (action, targetIds = null) => {
    // Jika ada targetIds (dari menu Aksi), gunakan itu. Jika tidak, gunakan selectedItems (Bulk).
    const idsToProcess = targetIds || selectedItems;

    if (!idsToProcess.length) {
      return alert("Pilih tiket terlebih dahulu.");
    }

    const isDelete = action === "delete";
    const confirmMsg = isDelete
      ? `Yakin ingin menghapus ${idsToProcess.length} tiket?`
      : `Yakin ingin menyelesaikan ${idsToProcess.length} tiket?`;

    if (!window.confirm(confirmMsg)) return;

    // Validasi sektor jika aksi "Selesaikan"
    if (!isDelete && woData.some(i => idsToProcess.includes(i.incident) && !i.sektor)) {
      return alert("Gagal! Ada tiket yang belum memiliki Sektor.");
    }

    try {
      await Promise.all(idsToProcess.map(id =>
        fetch(`${API_BASE_URL}/work-orders/${id}${isDelete ? "" : "/complete"}`, {
          method: isDelete ? "DELETE" : "POST"
        })
      ));

      // Update state data lokal
      setWoData(prev => prev.filter(i => !idsToProcess.includes(i.incident)));

      // Jika tadi hapus banyak (bulk), kosongkan pilihan
      if (!targetIds) setSelectedItems([]);

      alert(`Berhasil ${isDelete ? "dihapus" : "diselesaikan"}.`);
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menghubungi server.");
    }
  };

  // Handler Copy di dalam Modal
  const handleCopyToClipboard = () => {
    if (!formatItem) return;
    const text = document.getElementById("formatTextarea").value; // Ambil nilai dari textarea (mungkin sudah diedit user)
    navigator.clipboard.writeText(text).then(() => {
      alert("Teks berhasil disalin!");
      setFormatItem(null); // Tutup modal setelah copy
    });
  };

  const dataToShow = sortedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const isAllSelected = dataToShow.length > 0 && dataToShow.every(i => selectedItems.includes(i.incident));

  const toggleSelectAll = (checked) => {
    const ids = dataToShow.map(i => i.incident);
    setSelectedItems(prev => checked ? [...new Set([...prev, ...ids])] : prev.filter(id => !ids.includes(id)));
  };

  const filteredCols = ALL_POSSIBLE_KEYS.filter(k => k.toLowerCase().replace(/_/g, " ").includes(columnSearchTerm.toLowerCase()));

  if (isLoading) return <div className="loading-container"><div className="loading-spinner" /> Memuat data...</div>;
  if (error) return <div className="error-container"><h2>Error</h2><p>{error}</p></div>;

  return (
    <div className="lihat-wo-container">
      <div className="page-header"><h1>Incident Management</h1></div>

      {/* Controls */}
      <div className="table-controls">
        <div className="search-and-filters">
          <input className="search-input" placeholder="Cari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <div className="filter-box">
            <div className="filter-item"><label>Status</label>
              <select value={filter.status} onChange={e => handleFilterChange("status", e.target.value)}>
                <option value="">Semua</option>{ALL_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            {Object.entries(filterOptions).map(([key, opts]) => (
              <div className="filter-item" key={key}><label>{key}</label>
                <select value={filter[key]} onChange={e => handleFilterChange(key, e.target.value)}>
                  <option value="">Semua</option>{opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
        <div className="action-section">
          <button className="btn btn-outline" onClick={() => { setDraftVisibleKeys(new Set(visibleKeys)); setShowColumnSelector(true); }}>Atur Kolom</button>
          <button className="btn btn-success" onClick={() => handleBulkAction("complete")} disabled={!selectedItems.length}>Selesaikan ({selectedItems.length})</button>
          <button className="btn btn-danger" onClick={() => handleBulkAction("delete")} disabled={!selectedItems.length}>Hapus ({selectedItems.length})</button>
        </div>
      </div>

      {/* --- MODAL COLUMN SELECTOR --- */}
      {showColumnSelector && (
        <div className="format-modal" onClick={() => setShowColumnSelector(false)}>
          <div className="edit-modal-window" onClick={e => e.stopPropagation()}>
            <div className="edit-modal-header"><h2>Atur Kolom</h2><button className="btn-close-modal" onClick={() => setShowColumnSelector(false)}>&times;</button></div>
            <div className="edit-modal-subheader">
              <input className="column-search-input" placeholder="Cari kolom..." value={columnSearchTerm} onChange={e => setColumnSearchTerm(e.target.value)} autoFocus />
              <button className="select-all-btn" onClick={() => setDraftVisibleKeys(new Set(draftVisibleKeys.size < ALL_POSSIBLE_KEYS.length ? ALL_POSSIBLE_KEYS : []))}>
                {draftVisibleKeys.size < ALL_POSSIBLE_KEYS.length ? "Pilih Semua" : "Hapus Semua"}
              </button>
            </div>
            <div className="edit-modal-body">
              <div className="column-selector-grid">
                {filteredCols.map(key => (
                  <div key={key} className={`column-item ${draftVisibleKeys.has(key) ? "checked" : ""}`}
                    onClick={() => setDraftVisibleKeys(p => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; })}>
                    <input type="checkbox" checked={draftVisibleKeys.has(key)} readOnly /><label>{key.replace(/_/g, " ").toUpperCase()}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="edit-modal-footer">
              <button className="btn btn-outline" onClick={() => setShowColumnSelector(false)}>Batal</button>
              <button className="btn btn-primary" onClick={() => { setVisibleKeys(draftVisibleKeys); setShowColumnSelector(false); }}>Terapkan</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL FORMAT TEKS (Preview & Copy) --- */}
      {formatItem && (
        <div className="format-modal" onClick={() => setFormatItem(null)}>
          <div className="edit-modal-window modal-compact" onClick={e => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h2>Lihat Format (WhatsApp)</h2>
              <button className="btn-close-modal" onClick={() => setFormatItem(null)}>&times;</button>
            </div>
            <div className="edit-modal-body">
              <textarea
                id="formatTextarea"
                className="format-textarea"
                defaultValue={getFormatText(formatItem)}
              />
            </div>
            <div className="edit-modal-footer">
              <button className="btn btn-outline" onClick={() => setFormatItem(null)}>Tutup</button>
              <button className="btn btn-primary" onClick={handleCopyToClipboard}>Salin Teks</button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="table-card-wrapper">
        <div className="table-scroll-container">
          <table className="wo-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={isAllSelected} onChange={e => toggleSelectAll(e.target.checked)} /></th>
                <th>AKSI</th>
                {ALL_POSSIBLE_KEYS.filter(k => visibleKeys.has(k)).map(k => (
                  <th key={k} onClick={() => setSortConfig(p => ({ key: k, direction: p.key === k && p.direction === "asc" ? "desc" : "asc" }))}>
                    {k.replace(/_/g, " ").toUpperCase()} <SortIcon direction={sortConfig.key === k ? sortConfig.direction : null} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataToShow.length ? dataToShow.map(item => (
                <WorkOrderRow key={item.incident} item={item} isDuplicate={item.ttr_end_to_end === -2}
                  allKeys={ALL_POSSIBLE_KEYS} visibleKeys={visibleKeys} isSelected={selectedItems.includes(item.incident)}
                  onSelect={id => setSelectedItems(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])}
                  onUpdate={handleUpdateRow} onEdit={setEditItem} onDelete={id => handleBulkAction("delete", [id])}
                  onViewFormat={setFormatItem} // Mengirim fungsi untuk membuka modal format
                  onComplete={id => handleBulkAction("complete", [id])}
                />
              )) : <tr><td colSpan={visibleKeys.size + 2} className="no-data">Tidak ada data.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span className="page-info">{dataToShow.length ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(sortedData.length, currentPage * ITEMS_PER_PAGE)} dari {sortedData.length}</span>
          <div className="pagination-controls">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>&laquo;</button>
            <span className="page-number">Hal {currentPage}</span>
            <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(sortedData.length / ITEMS_PER_PAGE), p + 1))} disabled={currentPage >= Math.ceil(sortedData.length / ITEMS_PER_PAGE)}>&raquo;</button>
          </div>
        </div>
      </div>

      {editItem && <EditModal item={editItem} onClose={() => setEditItem(null)} onSave={async (updated) => { await handleUpdateRow(editItem, updated); setEditItem(null); }} workzoneMap={workzoneMap} />}
    </div>
  );
};

export default LihatWO;