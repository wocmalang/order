import { useState, useEffect, useMemo, useCallback } from "react";
import "./LihatWO.css";
import { useDebounce } from "../../hooks/useDebounce";
import { getInitialVisibleKeys } from "../../utils/woUtils";
import { WorkOrderRow } from "./components/WorkOrderRow";
import { EditModal } from "./components/EditModal";
import SortIcon from "../../components/SortIcon";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ALL_POSSIBLE_KEYS = [
  "incident", "korlap", "sektor", "workzone", "status", "summary", "reported_date",
  "ticket_id_gamas", "external_ticket_id", "customer_id", "customer_name",
  "service_id", "service_no", "description_assignment", "reported_by",
  "reported_priority", "source_ticket", "channel", "contact_phone",
  "contact_name", "contact_email", "status_date", "booking_date",
  "resolve_date", "date_modified", "last_update_worklog", "closed_by",
  "closed_reopen_by", "guarantee_status", "ttr_customer", "ttr_agent",
  "ttr_mitra", "ttr_nasional", "th_pending", "th_region", "th_witel",
  "ttr_end_to_end", "owner_group", "owner", "witel", "region", "subsidiary",
  "territory_near_end", "territory_far_end", "customer_segment",
  "customer_type", "customer_category", "service_type", "slg", "technology",
  "lapul", "gaul", "onu_rx", "pending_reason", "incident_domain", "symptom",
  "hierarchy_path", "solution", "description_actual_solution", "kode_produk",
  "perangkat", "technician", "device_name", "sn_ont", "tipe_ont",
  "manufacture_ont", "impacted_site", "cause", "resolution",
  "worklog_summary", "classification_flag", "realm", "related_to_gamas",
  "toc_result", "scc_result", "note", "notes_eskalasi", "rk_information",
  "external_ticket_tier_3", "classification_path", "urgency", "alamat",
];

const ALL_STATUS_OPTIONS = ["OPEN", "BACKEND", "CLOSED"];

const getFormatText = (item) => {
    let format = `*INCIDENT*
- TICKET ID: ${item.incident || ""}
- SERVICE ID: ${item.service_id || ""}
- CUSTOMER: ${item.customer_name || ""}
- CP: ${item.contact_name || ""} (${item.contact_phone || ""})
- PROBLEM: ${item.summary || ""}
- WITEL: ${item.witel || ""}
- SEKTOR: ${item.sektor || ""}
- WORKZONE: ${item.workzone || ""}`;

    if (["HVC_PLATINUM", "HV_DIAMOND"].includes(item.customer_type)) {
        format += `
- KORLAP: ${item.korlap || ""}`;
    }
    return format;
};

const LihatWO = () => {
  const [woData, setWoData] = useState([]);
  const [workzoneMap, setWorkzoneMap] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formatIncident, setFormatIncident] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [filter, setFilter] = useState({ status: "", sektor: "", workzone: "", korlap: "", witel: "" });
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "incident", direction: "asc" });
  const [visibleKeys, setVisibleKeys] = useState(new Set());
  const [draftVisibleKeys, setDraftVisibleKeys] = useState(new Set());
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  
  // --- PERUBAHAN 1: State untuk search term di modal kolom ---
  const [columnSearchTerm, setColumnSearchTerm] = useState(""); 
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [woResponse, workzoneMapResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/view-mysql`),
          fetch(`${API_BASE_URL}/workzone-map`),
        ]);

        if (!woResponse.ok || !workzoneMapResponse.ok) throw new Error(`Gagal mengambil data.`);

        const woResult = await woResponse.json();
        const workzoneMapResult = await workzoneMapResponse.json();
        
        setWoData(Array.isArray(woResult.data) ? woResult.data : []);
        setWorkzoneMap(Array.isArray(workzoneMapResult) ? workzoneMapResult : []);
      } catch (err) {
        console.error("Gagal mengambil data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getSektorForWorkzone = useCallback((workzone) => {
    if (!workzone) return "";
    const match = workzoneMap.find((m) => m.workzone === workzone);
    return match ? match.sektor : "";
  }, [workzoneMap]);

  const getKorlapsForWorkzone = useCallback((workzone) => {
    if (!workzone) return [];
    const match = workzoneMap.find((m) => m.workzone === workzone);
    const korlapString = match ? (match.korlaps || match.korlap_username || "") : "";
    return korlapString.split(',').map(k => k.trim()).filter(Boolean);
  }, [workzoneMap]);

  const getWorkzonesForSektor = useCallback((sektor) => {
    if (!sektor) return [];
    return workzoneMap.filter((m) => m.sektor === sektor).map((m) => m.workzone).sort();
  }, [workzoneMap]);

  const workzoneToKorlapMap = useMemo(() => {
    if (!workzoneMap) return {};
    return Object.fromEntries(
      workzoneMap.map(item => [item.workzone, item.korlaps || item.korlap_username])
    );
  }, [workzoneMap]);

  const allKeys = useMemo(() => ALL_POSSIBLE_KEYS, []);

  useEffect(() => {
    if (allKeys.length > 0 && visibleKeys.size === 0) {
      setVisibleKeys(getInitialVisibleKeys(allKeys));
    }
  }, [allKeys, visibleKeys.size]);

  const {
    statusOptions, witelOptions, sektorOptions, workzoneFilterOptions, korlapFilterOptions, allWorkzoneOptions
  } = useMemo(() => {
    const allSektors = [...new Set(workzoneMap.map((item) => item.sektor).filter(Boolean))].sort();
    const allWorkzones = [...new Set(workzoneMap.map((item) => item.workzone).filter(Boolean))].sort();
    const availableWorkzones = filter.sektor ? getWorkzonesForSektor(filter.sektor) : allWorkzones;
    
    const allKorlaps = [...new Set(workzoneMap.flatMap(item => getKorlapsForWorkzone(item.workzone)))].sort();
    
    const availableKorlaps = filter.workzone 
      ? getKorlapsForWorkzone(filter.workzone)
      : allKorlaps;

    return {
      statusOptions: ALL_STATUS_OPTIONS,
      witelOptions: Array.from(new Set(woData.map((d) => d.witel).filter(Boolean))).sort(),
      sektorOptions: allSektors,
      workzoneFilterOptions: availableWorkzones,
      korlapFilterOptions: availableKorlaps,
      allWorkzoneOptions: allWorkzones.map(wz => ({ label: wz, value: wz })),
    };
  }, [woData, filter, workzoneMap, getWorkzonesForSektor, getKorlapsForWorkzone]);

  const sortedData = useMemo(() => {
    const filtered = woData.filter((item) => {
      const searchMatch = Object.entries(item).some(([key, value]) =>
        visibleKeys.has(key) && String(value).toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
      return (
        searchMatch &&
        (!filter.status || item.status === filter.status) &&
        (!filter.witel || item.witel === filter.witel) &&
        (!filter.sektor || item.sektor === filter.sektor) &&
        (!filter.workzone || item.workzone === filter.workzone) &&
        (!filter.korlap || item.korlap === filter.korlap)
      );
    });
    if (!sortConfig.key) return filtered;
    return [...filtered].sort((a, b) => {
      const valA = a[sortConfig.key] || "";
      const valB = b[sortConfig.key] || "";
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [debouncedSearchTerm, woData, filter, visibleKeys, sortConfig]);

  useEffect(() => { setCurrentPage(1); }, [sortedData.length]);

  const requestSort = useCallback((key) => {
    setSortConfig((prev) => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));
  }, []);

  const handleFilterChange = useCallback((field, value) => {
    setFilter((prev) => {
      const newFilter = { ...prev, [field]: value };
      if (field === "sektor") { newFilter.workzone = ""; newFilter.korlap = ""; }
      if (field === "workzone") {
        const korlaps = getKorlapsForWorkzone(value);
        newFilter.korlap = korlaps.length === 1 ? korlaps[0] : "";
      }
      return newFilter;
    });
  }, [getKorlapsForWorkzone]);

  const handleUpdateRow = useCallback(async (originalItem, updatedFields) => {
    const incidentId = originalItem.incident;
    let dataToSend = { ...originalItem, ...updatedFields };

    if ('workzone' in updatedFields) {
      const newWorkzone = updatedFields.workzone;
      const match = workzoneMap.find(m => m.workzone === newWorkzone);
      
      dataToSend.sektor = match ? match.sektor : "";
      dataToSend.korlap = match ? (match.korlaps || match.korlap_username || null) : null;
    }
    
    setUpdatingStatus((p) => ({ ...p, [incidentId]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/work-orders/${incidentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Gagal menyimpan, respons server tidak valid" }));
        throw new Error(errorData.message || "Gagal menyimpan data");
      }
      const result = await response.json();
      setWoData((prev) => 
        prev.map((d) => (d.incident === incidentId ? result.data : d))
      );
    } catch (error) {
      console.error("Gagal update data:", error);
      alert(`Terjadi kesalahan saat memperbarui data: ${error.message}.`);
    } finally {
      setUpdatingStatus((p) => ({ ...p, [incidentId]: false }));
    }
  }, [workzoneMap]);
  
  const handleEditSave = useCallback(async (updatedItem) => {
    await handleUpdateRow(editItem, updatedItem);
    setEditItem(null); 
  }, [editItem, handleUpdateRow]);

  const handleDelete = async (incident) => {
    if (window.confirm("Yakin ingin menghapus data ini?")) {
      try {
        await fetch(`${API_BASE_URL}/work-orders/${incident}`, { method: "DELETE" });
        setWoData((prev) => prev.filter((item) => item.incident !== incident));
        setSelectedItems((prev) => prev.filter((item) => item !== incident));
      } catch (err) {
        alert("Gagal menghapus data.");
      }
    }
  };

  const handleCompleteTicket = useCallback(async (incident) => {
    const ticketToComplete = woData.find((item) => item.incident === incident);
    if (!ticketToComplete || !ticketToComplete.sektor) {
      alert("Gagal! Pastikan Sektor sudah dipilih sebelum menyelesaikan tiket.");
      return;
    }
    if (window.confirm("Apakah Anda yakin ingin menyelesaikan tiket ini? Data akan dipindahkan ke laporan.")) {
      try {
        const response = await fetch(`${API_BASE_URL}/work-orders/${incident}/complete`, { method: "POST" });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Gagal menyelesaikan tiket di server.");
        }
        setWoData((prev) => prev.filter((item) => item.incident !== incident));
        setSelectedItems((prev) => prev.filter((item) => item !== incident));
        alert("Tiket berhasil diselesaikan dan dipindahkan ke laporan.");
      } catch (err) {
        console.error("Gagal menyelesaikan tiket:", err);
        alert("Gagal menyelesaikan tiket: " + err.message);
      }
    }
  }, [woData]);
  
  const handleBulkDelete = useCallback(() => {
    if (selectedItems.length > 0 && window.confirm(`Yakin ingin menghapus ${selectedItems.length} data terpilih?`)) {
      Promise.all(selectedItems.map((id) => fetch(`${API_BASE_URL}/work-orders/${id}`, { method: "DELETE" })))
        .then(() => {
          setWoData((prev) => prev.filter((item) => !selectedItems.includes(item.incident)));
          setSelectedItems([]);
        })
        .catch(() => alert("Gagal menghapus beberapa item."));
    }
  }, [selectedItems]);

  const handleBulkComplete = useCallback(async () => {
    if (selectedItems.length === 0) return;
    if (window.confirm(`Yakin ingin menyelesaikan ${selectedItems.length} tiket terpilih?`)) {
      const ticketsToComplete = woData.filter(item => selectedItems.includes(item.incident));
      const invalidTickets = ticketsToComplete.filter(item => !item.sektor);

      if (invalidTickets.length > 0) {
        alert(`Gagal! ${invalidTickets.length} tiket belum memiliki Sektor. Selesaikan tiket ini satu per satu.`);
        return;
      }

      try {
        const promises = selectedItems.map(id => 
          fetch(`${API_BASE_URL}/work-orders/${id}/complete`, { method: "POST" })
        );
        const results = await Promise.all(promises);

        const failed = results.filter(res => !res.ok);
        if (failed.length > 0) {
          throw new Error(`${failed.length} tiket gagal diselesaikan.`);
        }
        
        setWoData(prev => prev.filter(item => !selectedItems.includes(item.incident)));
        setSelectedItems([]);
        alert(`${selectedItems.length} tiket berhasil diselesaikan.`);

      } catch (err) {
        alert(`Terjadi kesalahan saat menyelesaikan tiket secara massal: ${err.message}`);
      }
    }
  }, [selectedItems, woData]);

  const handleRemoveDuplicates = useCallback(() => {
    if (window.confirm("Yakin ingin menghapus data duplikat berdasarkan Ticket ID Gamas?")) {
      const seen = new Set();
      const duplicates = [];
      const uniqueData = [];

      [...woData].reverse().forEach(item => {
        if (item.ticket_id_gamas && seen.has(item.ticket_id_gamas)) {
          duplicates.push(item.incident);
        } else {
          if (item.ticket_id_gamas) {
            seen.add(item.ticket_id_gamas);
          }
          uniqueData.unshift(item); 
        }
      });
      
      if (duplicates.length > 0) {
        Promise.all(duplicates.map(id => fetch(`${API_BASE_URL}/work-orders/${id}`, { method: "DELETE" })))
          .then(() => {
            setWoData(uniqueData);
            alert(`${duplicates.length} data duplikat telah dihapus.`);
          })
          .catch(() => alert("Gagal menghapus beberapa item duplikat."));
      } else {
        alert("Tidak ditemukan data duplikat.");
      }
    }
  }, [woData]);

  const handleCopy = useCallback(async (item) => {
    try {
      await navigator.clipboard.writeText(getFormatText(item));
      alert("Format berhasil disalin!");
    } catch (err) {
      console.error("Gagal menyalin teks:", err);
    }
  }, []);

  const handleSelectItem = useCallback((id) => {
    setSelectedItems((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  }, []);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const getCurrentPageData = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const dataToShow = getCurrentPageData();

  const isAllOnPageSelected = useMemo(() => dataToShow.length > 0 && dataToShow.every((item) => selectedItems.includes(item.incident)), [dataToShow, selectedItems]);

  const handleSelectAll = useCallback((e) => {
    const currentPageIds = dataToShow.map((item) => item.incident);
    if (e.target.checked) {
      setSelectedItems((prev) => [...new Set([...prev, ...currentPageIds])]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    }
  }, [dataToShow]);

  const handleApplyColumnChanges = () => {
    setVisibleKeys(draftVisibleKeys);
    try {
      localStorage.setItem("wo_visible_columns", JSON.stringify(Array.from(draftVisibleKeys)));
    } catch (error) {
      console.error("Gagal menyimpan kolom ke localStorage", error);
    }
    setShowColumnSelector(false);
  };
  
  const handleSelectAllColumns = (checked) => {
    if (checked) {
      setDraftVisibleKeys(new Set(allKeys));
    } else {
      setDraftVisibleKeys(new Set());
    }
  };
  
  // --- PERUBAHAN 2: Logika untuk memfilter kolom berdasarkan pencarian ---
  const filteredColumns = useMemo(() => {
      if (!columnSearchTerm) {
          return allKeys;
      }
      return allKeys.filter(key => 
          key.toLowerCase().replace(/_/g, " ").includes(columnSearchTerm.toLowerCase())
      );
  }, [allKeys, columnSearchTerm]);

  if (isLoading) return <div className="loading-container"><div className="loading-spinner"></div> <p>Memuat data...</p></div>;
  if (error) return <div className="lihat-wo-container"><div className="error-container"><h2>Gagal Memuat Data</h2><p>Terjadi kesalahan saat mengambil data dari server.</p><pre className="error-message">{error}</pre><p><strong>Pastikan server backend Anda berjalan</strong> dan alamat API sudah benar.</p></div></div>;

  return (
    <div className="lihat-wo-container">
      <div className="page-header"><h1>Incident Management</h1></div>
      <div className="table-controls">
        <div className="search-and-filters">
          <input type="text" placeholder="Cari di kolom yang tampil..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input"/>
          <div className="filter-box">
            <div className="filter-group">
              <div className="filter-item"><label>Status</label><select value={filter.status} onChange={(e) => handleFilterChange("status", e.target.value)}><option value="">Semua Status</option>{statusOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}</select></div>
              <div className="filter-item"><label>Witel</label><select value={filter.witel} onChange={(e) => handleFilterChange("witel", e.target.value)}><option value="">Semua Witel</option>{witelOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}</select></div>
            </div>
            <div className="filter-group">
              <div className="filter-item"><label>Sektor</label><select value={filter.sektor} onChange={(e) => handleFilterChange("sektor", e.target.value)}><option value="">Semua Sektor</option>{sektorOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}</select></div>
              <div className="filter-item"><label>Workzone</label><select value={filter.workzone} onChange={(e) => handleFilterChange("workzone", e.target.value)}><option value="">Semua Workzone</option>{workzoneFilterOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}</select></div>
              <div className="filter-item"><label>Korlap</label><select value={filter.korlap} onChange={(e) => handleFilterChange("korlap", e.target.value)}><option value="">Semua Korlap</option>
  
  {korlapFilterOptions.map((opt, index) => (
    <option key={`${opt}-${index}`} value={opt}>{opt}</option>
  ))}
              </select></div>
            </div>
          </div>
        </div>
        <div className="action-section">
          <button onClick={() => { setDraftVisibleKeys(new Set(visibleKeys)); setShowColumnSelector(true); }} className="btn btn-outline">Atur Kolom</button>
          <button onClick={handleBulkComplete} className="btn btn-success" disabled={selectedItems.length === 0}>Selesaikan ({selectedItems.length})</button>
          <button onClick={handleBulkDelete} className="btn btn-danger" disabled={selectedItems.length === 0}>Hapus ({selectedItems.length})</button>
          <button onClick={handleRemoveDuplicates} className="btn btn-warning">Hapus Duplikat</button>
        </div>
      </div>

      {/* --- PERUBAHAN 3: JSX untuk Modal Kolom diperbarui --- */}
      {showColumnSelector && (
        <div className="column-selector-overlay">
          <div className="column-selector">
            <div className="column-selector-header">
              <h4>Tampilkan Kolom</h4>
              <input 
                type="text" 
                placeholder="Cari nama kolom..."
                className="column-search-input"
                value={columnSearchTerm}
                onChange={(e) => setColumnSearchTerm(e.target.value)}
              />
              <div className="column-item select-all">
                <input 
                  type="checkbox" 
                  id="select-all-cols"
                  checked={draftVisibleKeys.size === allKeys.length}
                  onChange={(e) => handleSelectAllColumns(e.target.checked)}
                />
                <label htmlFor="select-all-cols"><b>Pilih Semua</b></label>
              </div>
            </div>
            <div className="column-selector-grid">
              {filteredColumns.map((key) => (
                <div key={key} className="column-item">
                  <input 
                    type="checkbox" 
                    id={`col-${key}`} 
                    checked={draftVisibleKeys.has(key)} 
                    onChange={() => setDraftVisibleKeys((prev) => { 
                      const newSet = new Set(prev); 
                      newSet.has(key) ? newSet.delete(key) : newSet.add(key); 
                      return newSet; 
                    })} 
                  />
                  <label htmlFor={`col-${key}`}>{key.replace(/_/g, " ")}</label>
                </div>
              ))}
            </div>
            <div className="column-selector-actions">
              <button onClick={() => setShowColumnSelector(false)} className="btn btn-outline">Batal</button>
              <button onClick={handleApplyColumnChanges} className="btn btn-primary">Terapkan</button>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="wo-table">
          <thead>
            <tr>
              <th><input type="checkbox" checked={isAllOnPageSelected} onChange={handleSelectAll} /></th>
              <th>AKSI</th>
              {allKeys.filter((key) => visibleKeys.has(key)).map((key) => (<th key={key} onClick={() => requestSort(key)}>{key.replace(/_/g, " ").toUpperCase()}<SortIcon direction={sortConfig.key === key ? sortConfig.direction : null}/></th>))}
            </tr>
          </thead>
          <tbody>
            {dataToShow.length === 0 ? (
              <tr><td colSpan={visibleKeys.size + 2} className="no-data">Tidak ada data yang cocok.</td></tr>
            ) : (
              dataToShow.map((item) => (
                <WorkOrderRow
                  key={item.incident}
                  item={item}
                  allKeys={allKeys}
                  visibleKeys={visibleKeys}
                  isSelected={selectedItems.includes(item.incident)}
                  onSelect={handleSelectItem}
                  onUpdate={handleUpdateRow}
                  updatingStatus={updatingStatus}
                  onEdit={setEditItem}
                  onDelete={handleDelete}
                  onFormat={setFormatIncident}
                  onCopy={handleCopy}
                  onComplete={handleCompleteTicket}
                  statusOptions={ALL_STATUS_OPTIONS.map(opt => ({ label: opt, value: opt }))}
                  allWorkzoneOptions={allWorkzoneOptions}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="page-info">
          Menampilkan {dataToShow.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(sortedData.length, currentPage * itemsPerPage)} dari {sortedData.length} data
        </span>
        <div>
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>&laquo; Sebelumnya</button>
          <span className="page-number">Halaman {currentPage} dari {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Berikutnya &raquo;</button>
        </div>
      </div>

      {formatIncident && (
        <div className="format-modal" onClick={() => setFormatIncident(null)}>
          <div className="format-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Format Incident</h2>
            <pre className="format-pre">{getFormatText(formatIncident)}</pre>
            <button className="btn btn-primary" onClick={() => setFormatIncident(null)}>Tutup</button>
          </div>
        </div>
      )}

      {editItem && (
        <EditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={handleEditSave}
          allSektorOptions={sektorOptions}
          getSektorForWorkzone={getSektorForWorkzone}
          getWorkzonesForSektor={getWorkzonesForSektor}
          getKorlapsForWorkzone={getKorlapsForWorkzone}
        />
      )}
    </div>
  );
};

export default LihatWO;