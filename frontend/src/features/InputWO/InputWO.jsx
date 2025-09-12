import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

import UploadFile from "./components/UploadFile";
import PasteTSV from "./components/PasteTSV";
import PasteJSON from "./components/PasteJSON";
import JsonPreview from "./components/JSONPreview";
import "./InputWO.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const InputWO = () => {
  const navigate = useNavigate();
  const [textData, setTextData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [jsonPreview, setJsonPreview] = useState([]);
  const [inputType, setInputType] = useState("paste-tsv");
  const [fileName, setFileName] = useState("");
  const [workzoneMap, setWorkzoneMap] = useState({});
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [existingWoData, setExistingWoData] = useState([]);

  const allowedFields = [
    "incident","ttr_customer","summary","reported_date","owner_group","owner","customer_segment","service_type", "witel","workzone","status","status_date","ticket_id_gamas","reported_by","contact_phone","contact_name", "contact_email","booking_date","description_assignment","reported_priority","source_ticket","subsidiary", "external_ticket_id","channel","customer_type","closed_by","closed_reopen_by","customer_id","customer_name", "service_id","service_no","slg","technology","lapul","gaul","onu_rx","pending_reason","date_modified", "incident_domain","region","symptom","hierarchy_path","solution","description_actual_solution","kode_produk", "perangkat","technician","device_name","worklog_summary","last_update_worklog","classification_flag", "realm","related_to_gamas","tsc_result","scc_result","ttr_agent","ttr_mitra","ttr_nasional","ttr_pending", "ttr_region","ttr_witel","ttr_end_to_end","note","guarantee_status","resolve_date","sn_ont","tipe_ont", "manufacture_ont","impacted_site","cause","resolution","notes_eskalasi","rk_information", "external_ticket_tier_3","customer_category","classification_path","territory_near_end", "territory_far_end","urgency","alamat","sektor",
  ];
  const datetimeFields = [
    "reported_date", "status_date", "booking_date", "date_modified", "last_update_worklog", "resolve_date",
  ];

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsMapLoading(true);
      try {
        const [mapResponse, existingDataResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/workzone-map`),
            fetch(`${API_BASE_URL}/view-d1`)
        ]);

        if (!mapResponse.ok) throw new Error("Gagal mengambil data pemetaan workzone.");
        const mapData = await mapResponse.json();
        const map = mapData.reduce((acc, item) => {
          acc[item.workzone] = item.sektor;
          return acc;
        }, {});
        setWorkzoneMap(map);

        if (!existingDataResponse.ok) throw new Error("Gagal mengambil data WO yang ada.");
        const existingData = await existingDataResponse.json();
        if (existingData.success && Array.isArray(existingData.data)) {
            setExistingWoData(existingData.data);
        }

      } catch (error) {
        setMessage(`Error: ${error.message}`);
      } finally {
        setIsMapLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const isValidDate = (val) => {
    if (!val) return false;
    return /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/.test(val.trim());
  };

  const normalizeHeaders = (headers) => {
    return headers.map((h) =>
      h.trim().toLowerCase().replace(/\s+|\//g, "_").replace(/[^a-z0-9_]/g, "")
    );
  };

  const processData = (dataArray, map) => {
    return dataArray.map((row) => {
      const obj = {};
      const normalizedRow = {};
      
      for (const key in row) {
        const normalizedKey = key.trim().toLowerCase().replace(/\s+|\//g, "_").replace(/[^a-z0-9_]/g, "");
        normalizedRow[normalizedKey] = row[key];
      }

      const workzone = normalizedRow.workzone || "";
      
      if (workzone && map[workzone]) {
        obj.sektor = map[workzone];
      } else {
        obj.sektor = null;
      }
      
      allowedFields.forEach(allowedKey => {
        if (allowedKey !== 'sektor' && normalizedRow.hasOwnProperty(allowedKey)) {
          let v = normalizedRow[allowedKey] !== undefined ? String(normalizedRow[allowedKey]) : "";
          if (datetimeFields.includes(allowedKey)) {
            obj[allowedKey] = isValidDate(v) ? v : null;
          } else {
            obj[allowedKey] = v;
          }
        } else if (!obj.hasOwnProperty(allowedKey)) {
           if (!obj.hasOwnProperty(allowedKey)) obj[allowedKey] = null;
        }
      });
      return obj;
    });
  };

  const parseTSV = (tsv, map) => {
    const lines = tsv.trim().split(/\r?\n/);
    if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) return [];

    let headers;
    let dataLines;

    const firstLineValues = lines[0].split("\t");
    const normalizedFirstLine = normalizeHeaders(firstLineValues);
    
    const matchingHeaders = normalizedFirstLine.filter(h => allowedFields.includes(h));
    const isHeaderPresent = normalizedFirstLine[0] === 'aksi' || matchingHeaders.length >= firstLineValues.length / 2;

    if (isHeaderPresent && lines.length > 1) {
      headers = lines[0].split("\t"); 
      dataLines = lines.slice(1);
    } else {
      headers = allowedFields; 
      dataLines = lines;
    }

    if (dataLines.length === 0) {
        setMessage("Tidak ada baris data untuk diimpor.");
        return [];
    }

    const dataArray = dataLines.map((line) => {
      const values = line.split("\t");
      const obj = {};
      headers.forEach((h, i) => {
        if (i < values.length) {
          obj[h.trim()] = values[i];
        }
      });
      return obj;
    });

    return processData(dataArray, map);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let dataToProcess = [];

    try {
      if (inputType === "upload") {
        if (jsonPreview.length === 0) throw new Error("Upload file terlebih dahulu atau file tidak valid.");
        dataToProcess = jsonPreview;
      } else if (inputType === "paste-tsv") {
        if (!textData.trim()) throw new Error("Silakan paste data TSV terlebih dahulu.");
        const parsedData = parseTSV(textData, workzoneMap);
        if (parsedData.length === 0) throw new Error("Format data TSV tidak valid atau kosong.");
        setJsonPreview(parsedData);
        dataToProcess = parsedData;
      } else if (inputType === "paste-json") {
        if (!textData.trim()) throw new Error("Silakan paste data JSON terlebih dahulu.");
        const jsonData = JSON.parse(textData);
        if (!Array.isArray(jsonData)) throw new Error("Teks JSON harus berupa array of objects.");
        const processed = processData(jsonData, workzoneMap);
        setJsonPreview(processed);
        dataToProcess = processed;
      }
    } catch (error) {
      setMessage("Error: " + error.message);
      return;
    }

    if (dataToProcess.length === 0) {
      setMessage("Tidak ada data untuk disimpan!");
      return;
    }

    setIsLoading(true);

    const existingTicketsMap = new Map();
    existingWoData.forEach(ticket => {
      const key = `${ticket.service_id}_${ticket.customer_id}`;
      if (!existingTicketsMap.has(key)) {
        existingTicketsMap.set(key, []);
      }
      existingTicketsMap.get(key).push(ticket);
    });

    const dataToSubmit = dataToProcess.map(newTicket => {
      const key = `${newTicket.service_id}_${newTicket.customer_id}`;
      if (existingTicketsMap.has(key)) {
        const duplicatesInDB = existingTicketsMap.get(key);
        const newIncidentId = `${newTicket.incident}-${duplicatesInDB.length + 1}`;
        return { ...newTicket, incident: newIncidentId };
      }
      return newTicket;
    });

    setMessage(`Mengirim ${dataToSubmit.length} baris data ke server...`);

    try {
      const response = await fetch(`${API_BASE_URL}/mypost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
      });

      if (response.ok) {
        setMessage("Data berhasil disimpan! Mengarahkan ke halaman utama...");
        setTimeout(() => navigate("/lihat-wo"), 1500);
      } else {
        const err = await response.json().catch(() => ({ message: "Gagal menyimpan data" }));
        throw new Error(err.message || "Gagal menyimpan data");
      }
    } catch (error) {
      setMessage("Error: " + error.message);
      setIsLoading(false);
    }
  };
  
  const handleClear = () => {
    setTextData("");
    setMessage("");
    setJsonPreview([]);
    setFileName("");
    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";
  };
  
  const sampleData = `Aksi\tINCIDENT\tTTR CUSTOMER\tSUMMARY\tREPORTED DATE\tOWNER GROUP\tOWNER\tCUSTOMER SEGMENT\tSERVICE TYPE\tWITEL\tWORKZONE\tSTATUS\tSTATUS DATE\tTICKET ID GAMAS\tREPORTED BY\tCONTACT PHONE\tCONTACT NAME\tCONTACT EMAIL\tBOOKING DATE\tDESCRIPTION ASSIGMENT\tREPORTED PRIORITY\tSOURCE TICKET\tSUBSIDIARY\tEXTERNAL TICKET ID\tCHANNEL\tCUSTOMER TYPE\tCLOSED BY\tCLOSED / REOPEN by\tCUSTOMER ID\tCUSTOMER NAME\tSERVICE ID\tSERVICE NO\tSLG\tTECHNOLOGY\tLAPUL\tGAUL\tONU RX\tPENDING REASON\tDATEMODIFIED\tINCIDENT DOMAIN\tREGION\tSYMPTOM\tHIERARCHY PATH\tSOLUTION\tDESCRIPTION ACTUAL SOLUTION\tKODE PRODUK\tPERANGKAT\tTECHNICIAN\tDEVICE NAME\tWORKLOG SUMMARY\tLAST UPDATE WORKLOG\tCLASSIFICATION FLAG\tREALM\tRELATED TO GAMAS\tTSC RESULT\tSCC RESULT\tTTR AGENT\tTTR MITRA\tTTR NASIONAL\tTTR PENDING\tTTR REGION\tTTR WITEL\tTTR END TO END\tNOTE\tGUARANT STATUS\tRESOLVE DATE\tSN ONT\tTIPE ONT\tMANUFACTURE ONT\tIMPACTED SITE\tCAUSE\tRESOLUTION\tNOTES ESKALASI\tRK INFORMATION\tEXTERNAL TICKET TIER 3\tCUSTOMER CATEGORY\tCLASSIFICATION PATH\tTERITORY NEAR END\tTERITORY FAR END\tURGENCY\tURGENCY DESCRIPTION\nFormat Hapus\tINC38587292\t01:56:01\tWAJIB DIISI MSISDN CONTACT PELANGGAN 085852387143\t2025-08-12 17:42:15\tTIF HD DISTRICT MALANG\t\tPL-TSEL\tINTERNET\tMALANG\tBTU\tBACKEND\t2025-08-12 17:42:20\t\t23255804\t6285852387143\tIKA\t\t\tAssigned By STO\t\tCUSTOMER\t\t\t1-NOL1KRM\t21\tREGULER\t\t\t\t1-MOUEVP2\tIKA\t1-MOUEVP2_152707234425_INTERNET\t152707234425\t\tFiber\t0\t0\t-504\t\t2025-08-12 19:38:21\t\tREG-5\tINTERNET | TECHNICAL | Tidak Bisa Browsing - 2P / 3P Mati Total\t\t\t\t\t\t16830458\tODP-BTU-FX/08 FX/D01/08.01\t\t\tTECHNICAL\ttelkom.net\tNO\tN/A | N/A\t\t00:00:00\t00:00:00\t01:56:01\t00:00:00\t01:56:01\t01:56:01\t01:56:01\t\tNOT GUARANTEE\t\tZTEGD826190E\tZTEG-F672Y\t\t\t\t\t\tODC-BTU-FX ODC-BTU-FX\tINC000015453134\t\tA_INTERNET_001_001_002\t\t\t3-Medium\t`;

  const handleSampleData = () => {
    setTextData(sampleData);
    setInputType("paste-tsv");
    setMessage("Sample data telah dimuat ke area paste TSV");
  };

  return (
    <div className="input-wo-container">
      <div className="page-header">
        <h1>Input Incident Data</h1>
        <p>Paste data dari Excel, atau upload file untuk disimpan ke database.</p>
      </div>

      <div className="input-form-card">
        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-type-tabs">
            <button type="button" onClick={() => setInputType("paste-tsv")} className={inputType === "paste-tsv" ? "active" : ""}>Paste TSV</button>
            <button type="button" onClick={() => setInputType("paste-json")} className={inputType === "paste-json" ? "active" : ""}>Paste JSON</button>
            <button type="button" onClick={() => setInputType("upload")} className={inputType === "upload" ? "active" : ""}>Upload File</button>
          </div>
            
          {inputType === "upload" && (
            <UploadFile
              onFileProcessed={setJsonPreview}
              setMessage={setMessage}
              setIsLoading={setIsLoading}
              setFileName={setFileName}
              fileName={fileName}
              processData={processData}
              workzoneMap={workzoneMap}
            />
          )}

          {inputType === "paste-tsv" && (
            <PasteTSV value={textData} onChange={(e) => setTextData(e.target.value)} />
          )}
          
          {inputType === "paste-json" && (
            <PasteJSON value={textData} onChange={(e) => setTextData(e.target.value)} />
          )}

          <div className="button-group">
            <button type="button" onClick={handleSampleData} className="btn btn-secondary">Load Sample</button>
            <button type="button" onClick={handleClear} className="btn btn-outline" disabled={!textData && !jsonPreview.length}>Clear</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || isMapLoading || (!textData.trim() && jsonPreview.length === 0)}>
              {isMapLoading ? "Memuat Peta..." : isLoading ? "Memproses..." : "Simpan ke Database"}
            </button>
          </div>
        </form>

        {message && (<div className={`message ${message.includes("berhasil") ? "success" : message.includes("Error") ? "error" : "info"}`}>{message}</div>)}
      </div>

      <JsonPreview data={jsonPreview} />

      <div className="info-panel">
        <h3>Informasi</h3>
        <ul>
          <li>Data akan disimpan ke database <strong>CloudFlare</strong></li>
          <li>Format yang didukung: Tab-separated (TSV), JSON, Excel (.xlsx, .xls), dan CSV.</li>
          <li>Baris pertama pada data tabular (TSV/Excel/CSV) harus berisi header kolom.</li>
          <li>Data JSON harus berupa *array of objects*.</li>
        </ul>
      </div>
    </div>
  );
};

export default InputWO;