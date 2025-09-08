import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
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

  // State untuk data pemetaan dari API
  const [workzoneMap, setWorkzoneMap] = useState({});
  const [isMapLoading, setIsMapLoading] = useState(true);

  const allowedFields = [
    "incident","ttr_customer","summary","reported_date","owner_group","owner","customer_segment","service_type", "witel","workzone","status","status_date","ticket_id_gamas","reported_by","contact_phone","contact_name", "contact_email","booking_date","description_assignment","reported_priority","source_ticket","subsidiary", "external_ticket_id","channel","customer_type","closed_by","closed_reopen_by","customer_id","customer_name", "service_id","service_no","slg","technology","lapul","gaul","onu_rx","pending_reason","date_modified", "incident_domain","region","symptom","hierarchy_path","solution","description_actual_solution","kode_produk", "perangkat","technician","device_name","worklog_summary","last_update_worklog","classification_flag", "realm","related_to_gamas","tsc_result","scc_result","ttr_agent","ttr_mitra","ttr_nasional","ttr_pending", "ttr_region","ttr_witel","ttr_end_to_end","note","guarantee_status","resolve_date","sn_ont","tipe_ont", "manufacture_ont","impacted_site","cause","resolution","notes_eskalasi","rk_information", "external_ticket_tier_3","customer_category","classification_path","territory_near_end", "territory_far_end","urgency","alamat","sektor", // Tambahkan sektor ke allowedFields
  ];
  const datetimeFields = [
    "reported_date", "status_date", "booking_date", "date_modified", "last_update_worklog", "resolve_date",
  ];
  
  // Ambil data pemetaan dari API saat komponen dimuat
  useEffect(() => {
    const fetchWorkzoneMap = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/workzone-map`);
        if (!response.ok) throw new Error("Gagal mengambil data pemetaan");
        const data = await response.json();
        const map = data.reduce((acc, item) => {
          acc[item.workzone] = item.sektor;
          return acc;
        }, {});
        setWorkzoneMap(map);
      } catch (error) {
        setMessage(`Error: ${error.message}`);
      } finally {
        setIsMapLoading(false);
      }
    };
    fetchWorkzoneMap();
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
  
  // Fungsi ini sekarang menerima map untuk mengisi sektor secara otomatis
  const processData = (dataArray, map) => {
    return dataArray.map((row) => {
      const obj = {};
      const normalizedRow = {};
      
      // Normalisasi semua keys di baris data terlebih dahulu
      for (const key in row) {
        const normalizedKey = key.trim().toLowerCase().replace(/\s+|\//g, "_").replace(/[^a-z0-9_]/g, "");
        normalizedRow[normalizedKey] = row[key];
      }

      // Ambil workzone dari data yang sudah dinormalisasi
      const workzone = normalizedRow.workzone || "";
      
      // Isi sektor secara otomatis jika workzone ada di map
      if (workzone && map[workzone]) {
        obj.sektor = map[workzone];
      } else {
        obj.sektor = null; // atau string kosong ''
      }
      
      // Proses field lainnya
      allowedFields.forEach(allowedKey => {
        if (allowedKey !== 'sektor' && normalizedRow.hasOwnProperty(allowedKey)) {
          let v = normalizedRow[allowedKey] !== undefined ? String(normalizedRow[allowedKey]) : "";
          if (datetimeFields.includes(allowedKey)) {
            obj[allowedKey] = isValidDate(v) ? v : null;
          } else {
            obj[allowedKey] = v;
          }
        } else if (!obj.hasOwnProperty(allowedKey)) {
           // Inisialisasi field lain yang tidak ada di data input
           if (!obj.hasOwnProperty(allowedKey)) obj[allowedKey] = null;
        }
      });
      return obj;
    });
  };

  const parseTSV = (tsv, map) => {
    const lines = tsv.trim().split(/\r?\n/);
    // Jika input kosong atau hanya berisi spasi, kembalikan array kosong.
    if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) return [];

    let headers;
    let dataLines;

    // Logika untuk mendeteksi keberadaan header
    const firstLineValues = lines[0].split("\t");
    const normalizedFirstLine = normalizeHeaders(firstLineValues);
    
    // Heuristik: Anggap sebagai header jika setidaknya setengah dari kolom cocok dengan field yang diizinkan
    // atau jika kolom pertama adalah 'aksi' (berdasarkan data contoh).
    const matchingHeaders = normalizedFirstLine.filter(h => allowedFields.includes(h));
    const isHeaderPresent = normalizedFirstLine[0] === 'aksi' || matchingHeaders.length >= firstLineValues.length / 2;

    if (isHeaderPresent && lines.length > 1) {
      // Header terdeteksi dan ada setidaknya satu baris data
      headers = lines[0].split("\t"); 
      dataLines = lines.slice(1);
      console.log("Header terdeteksi, memproses data.");
    } else {
      // Tidak ada header yang terdeteksi, anggap semua baris adalah data
      // dan gunakan urutan kolom default dari 'allowedFields'.
      headers = allowedFields; 
      dataLines = lines;
      console.log("Header tidak terdeteksi, menggunakan urutan kolom default.");
    }

    // Jika tidak ada baris data setelah pemrosesan, hentikan.
    if (dataLines.length === 0) {
        setMessage("Tidak ada baris data untuk diimpor.");
        return [];
    }

    // Ubah setiap baris data menjadi objek berdasarkan header
    const dataArray = dataLines.map((line) => {
      const values = line.split("\t");
      const obj = {};
      headers.forEach((h, i) => {
        if (i < values.length) { // Pastikan tidak ada error jika baris data lebih pendek dari header
          obj[h.trim()] = values[i];
        }
      });
      return obj;
    });

    // Proses lebih lanjut data yang sudah menjadi array of objects
    return processData(dataArray, map);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    setMessage("Membaca file...");
    const fileExtension = file.name.split(".").pop().toLowerCase();

    const processAndSetPreview = (jsonData) => {
      const processed = processData(jsonData, workzoneMap);
      if (processed.length === 0) throw new Error("File tidak mengandung data.");
      setJsonPreview(processed);
      setMessage(`Berhasil memuat dan memproses ${processed.length} baris dari file ${file.name}`);
    };

    if (["xlsx", "xls", "csv"].includes(fileExtension)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const bstr = event.target.result;
          const workbook = XLSX.read(bstr, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
          processAndSetPreview(jsonData);
        } catch (error) {
          setMessage(`Error saat membaca file: ${error.message}`);
          setJsonPreview([]);
          setFileName("");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsBinaryString(file);
    } else if (fileExtension === "json") {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target.result;
          const jsonData = JSON.parse(text);
          if (!Array.isArray(jsonData)) throw new Error("File JSON harus berisi sebuah array of objects.");
          processAndSetPreview(jsonData);
        } catch (error) {
          setMessage(`Error saat membaca file JSON: ${error.message}`);
          setJsonPreview([]);
          setFileName("");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsText(file);
    } else {
      setMessage(`Tipe file .${fileExtension} tidak didukung.`);
      setFileName("");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let dataToSubmit = [];

    try {
      if (inputType === "upload") {
        if (jsonPreview.length === 0) throw new Error("Upload file terlebih dahulu atau file tidak valid.");
        dataToSubmit = jsonPreview;
      } else if (inputType === "paste-tsv") {
        if (!textData.trim()) throw new Error("Silakan paste data TSV terlebih dahulu.");
        const parsedData = parseTSV(textData, workzoneMap);
        if (parsedData.length === 0) throw new Error("Format data TSV tidak valid atau kosong.");
        setJsonPreview(parsedData);
        dataToSubmit = parsedData;
      } else if (inputType === "paste-json") {
        if (!textData.trim()) throw new Error("Silakan paste data JSON terlebih dahulu.");
        const jsonData = JSON.parse(textData);
        if (!Array.isArray(jsonData)) throw new Error("Teks JSON harus berupa array of objects.");
        const processed = processData(jsonData, workzoneMap);
        setJsonPreview(processed);
        dataToSubmit = processed;
      }
    } catch (error) {
      setMessage("Error: " + error.message);
      return;
    }

    if (dataToSubmit.length === 0) {
      setMessage("Tidak ada data untuk disimpan!");
      return;
    }

    setIsLoading(true);
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

          {inputType === "upload" ? (
            <div className="form-group">
              <label htmlFor="fileInput" className="form-label">Pilih File (Excel, CSV, atau JSON)</label>
              <div className="file-upload-container">
                <input type="file" id="fileInput" className="file-input" accept=".xlsx, .xls, .csv, .json" onChange={handleFileChange} />
                <label htmlFor="fileInput" className="file-input-label">{fileName ? `${fileName}` : "Pilih sebuah file..."}</label>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="textData" className="form-label">{inputType === "paste-tsv" ? "Data Incident (Tab Separated)" : "Data Incident (JSON Array)"}</label>
              <div className="textarea-container">
                <textarea id="textData" value={textData} onChange={(e) => setTextData(e.target.value)} placeholder={inputType === "paste-tsv" ? "Paste data dari Excel (TSV) di sini..." : 'Paste array of objects JSON di sini...\nContoh:\n[\n  {\n    "incident": "INC123",\n    "summary": "Internet Lambat"\n  }\n]'} className="excel-textarea" rows={12} />
              </div>
            </div>
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

      {jsonPreview && jsonPreview.length > 0 && (
        <div className="json-preview-panel">
          <h3>Preview Data JSON (Total: {jsonPreview.length} baris)</h3>
          <pre>
            {JSON.stringify(jsonPreview.slice(0, 5), null, 2)}
            {jsonPreview.length > 5 && "\n..."}
          </pre>
        </div>
      )}

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