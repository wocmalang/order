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

  const allowedFields = [
    "incident",
    "ttr_customer",
    "summary",
    "reported_date",
    "owner_group",
    "owner",
    "customer_segment",
    "service_type",
    "witel",
    "workzone",
    "status",
    "status_date",
    "ticket_id_gamas",
    "reported_by",
    "contact_phone",
    "contact_name",
    "contact_email",
    "booking_date",
    "description_assignment",
    "reported_priority",
    "source_ticket",
    "subsidiary",
    "external_ticket_id",
    "channel",
    "customer_type",
    "closed_by",
    "closed_reopen_by",
    "customer_id",
    "customer_name",
    "service_id",
    "service_no",
    "slg",
    "technology",
    "lapul",
    "gaul",
    "onu_rx",
    "pending_reason",
    "date_modified",
    "incident_domain",
    "region",
    "symptom",
    "hierarchy_path",
    "solution",
    "description_actual_solution",
    "kode_produk",
    "perangkat",
    "technician",
    "device_name",
    "worklog_summary",
    "last_update_worklog",
    "classification_flag",
    "realm",
    "related_to_gamas",
    "tsc_result",
    "scc_result",
    "ttr_agent",
    "ttr_mitra",
    "ttr_nasional",
    "ttr_pending",
    "ttr_region",
    "ttr_witel",
    "ttr_end_to_end",
    "note",
    "guarantee_status",
    "resolve_date",
    "sn_ont",
    "tipe_ont",
    "manufacture_ont",
    "impacted_site",
    "cause",
    "resolution",
    "notes_eskalasi",
    "rk_information",
    "external_ticket_tier_3",
    "customer_category",
    "classification_path",
    "territory_near_end",
    "territory_far_end",
    "urgency",
    "alamat",
    "sektor",
  ];
  const datetimeFields = [
    "reported_date",
    "status_date",
    "booking_date",
    "date_modified",
    "last_update_worklog",
    "resolve_date",
  ];

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
      h
        .trim()
        .toLowerCase()
        .replace(/\s+|\//g, "_")
        .replace(/[^a-z0-9_]/g, "")
    );
  };

  const processData = (dataArray, map) => {
    return dataArray.map((row) => {
      const obj = {};
      const normalizedRow = {};

      for (const key in row) {
        const normalizedKey = key
          .trim()
          .toLowerCase()
          .replace(/\s+|\//g, "_")
          .replace(/[^a-z0-9_]/g, "");
        normalizedRow[normalizedKey] = row[key];
      }

      const workzone = normalizedRow.workzone || "";

      if (workzone && map[workzone]) {
        obj.sektor = map[workzone];
      } else {
        obj.sektor = null;
      }

      allowedFields.forEach((allowedKey) => {
        if (
          allowedKey !== "sektor" &&
          normalizedRow.hasOwnProperty(allowedKey)
        ) {
          let v =
            normalizedRow[allowedKey] !== undefined
              ? String(normalizedRow[allowedKey])
              : "";
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
    if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === ""))
      return [];

    let headers;
    let dataLines;

    const firstLineValues = lines[0].split("\t");
    const normalizedFirstLine = normalizeHeaders(firstLineValues);

    const matchingHeaders = normalizedFirstLine.filter((h) =>
      allowedFields.includes(h)
    );
    const isHeaderPresent =
      normalizedFirstLine[0] === "aksi" ||
      matchingHeaders.length >= firstLineValues.length / 2;

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
    let dataToSubmit = [];

    try {
      if (inputType === "upload") {
        if (jsonPreview.length === 0)
          throw new Error("Upload file terlebih dahulu atau file tidak valid.");
        dataToSubmit = jsonPreview;
      } else if (inputType === "paste-tsv") {
        if (!textData.trim())
          throw new Error("Silakan paste data TSV terlebih dahulu.");
        const parsedData = parseTSV(textData, workzoneMap);
        if (parsedData.length === 0)
          throw new Error("Format data TSV tidak valid atau kosong.");
        setJsonPreview(parsedData);
        dataToSubmit = parsedData;
      } else if (inputType === "paste-json") {
        if (!textData.trim())
          throw new Error("Silakan paste data JSON terlebih dahulu.");
        const jsonData = JSON.parse(textData);
        if (!Array.isArray(jsonData))
          throw new Error("Teks JSON harus berupa array of objects.");
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
        const err = await response
          .json()
          .catch(() => ({ message: "Gagal menyimpan data" }));
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

  const sampleData = `Aksi	INCIDENT	TTR CUSTOMER	SUMMARY	REPORTED DATE	OWNER GROUP	OWNER	CUSTOMER SEGMENT	SERVICE TYPE	WITEL	WORKZONE	STATUS	STATUS DATE	TICKET ID GAMAS	REPORTED BY	CONTACT PHONE	CONTACT NAME	CONTACT EMAIL	BOOKING DATE	DESCRIPTION ASSIGMENT	REPORTED PRIORITY	SOURCE TICKET	SUBSIDIARY	EXTERNAL TICKET ID	CHANNEL	CUSTOMER TYPE	CLOSED BY	CLOSED / REOPEN by	CUSTOMER ID	CUSTOMER NAME	SERVICE ID	SERVICE NO	SLG	TECHNOLOGY	LAPUL	GAUL	ONU RX	PENDING REASON	DATEMODIFIED	INCIDENT DOMAIN	REGION	SYMPTOM	HIERARCHY PATH	SOLUTION	DESCRIPTION ACTUAL SOLUTION	KODE PRODUK	PERANGKAT	TECHNICIAN	DEVICE NAME	WORKLOG SUMMARY	LAST UPDATE WORKLOG	CLASSIFICATION FLAG	REALM	RELATED TO GAMAS	TSC RESULT	SCC RESULT	TTR AGENT	TTR MITRA	TTR NASIONAL	TTR PENDING	TTR REGION	TTR WITEL	TTR END TO END	NOTE	GUARANT STATUS	RESOLVE DATE	SN ONT	TIPE ONT	MANUFACTURE ONT	IMPACTED SITE	CAUSE	RESOLUTION	NOTES ESKALASI	RK INFORMATION	EXTERNAL TICKET TIER 3	CUSTOMER CATEGORY	CLASSIFICATION PATH	TERITORY NEAR END	TERITORY FAR END	URGENCY	URGENCY DESCRIPTION
Format Hapus	INC38587292	01:56:01	WAJIB DIISI MSISDN CONTACT PELANGGAN 085852387143	2025-08-12 17:42:15	TIF HD DISTRICT MALANG		PL-TSEL	INTERNET	MALANG	BTU	BACKEND	2025-08-12 17:42:20		23255804	6285852387143	IKA			Assigned By STO		CUSTOMER			1-NOL1KRM	21	REGULER			1-MOUEVP2	IKA	1-MOUEVP2_152707234425_INTERNET	152707234425		Fiber	0	0	-504		2025-08-12 19:38:21		REG-5	INTERNET | TECHNICAL | Tidak Bisa Browsing - 2P / 3P Mati Total				16830458	ODP-BTU-FX/08 FX/D01/08.01			TECHNICAL	telkom.net	NO	N/A | N/A		00:00:00	00:00:00	01:56:01	00:00:00	01:56:01	01:56:01	01:56:01		NOT GUARANTEE		ZTEGD826190E	ZTEG-F672Y			ODC-BTU-FX ODC-BTU-FX	INC000015453134		A_INTERNET_001_001_002			3-Medium	`;

  const handleSampleData = () => {
    setTextData(sampleData);
    setInputType("paste-tsv");
    setMessage("Sample data telah dimuat ke area paste TSV");
  };

  return (
    <div className="input-wo-container">
      <div className="page-header">
        <h1>Input Incident Data</h1>
        <p>
          Paste data dari Excel, atau upload file untuk disimpan ke database.
        </p>
      </div>

      <div className="input-form-card">
        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-type-tabs">
            <button
              type="button"
              onClick={() => setInputType("paste-tsv")}
              className={inputType === "paste-tsv" ? "active" : ""}
            >
              Paste TSV
            </button>
            <button
              type="button"
              onClick={() => setInputType("paste-json")}
              className={inputType === "paste-json" ? "active" : ""}
            >
              Paste JSON
            </button>
            <button
              type="button"
              onClick={() => setInputType("upload")}
              className={inputType === "upload" ? "active" : ""}
            >
              Upload File
            </button>
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
            <PasteTSV
              value={textData}
              onChange={(e) => setTextData(e.target.value)}
            />
          )}

          {inputType === "paste-json" && (
            <PasteJSON
              value={textData}
              onChange={(e) => setTextData(e.target.value)}
            />
          )}

          <div className="button-group">
            <button
              type="button"
              onClick={handleSampleData}
              className="btn btn-secondary"
            >
              Load Sample
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-outline"
              disabled={!textData && !jsonPreview.length}
            >
              Clear
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                isLoading ||
                isMapLoading ||
                (!textData.trim() && jsonPreview.length === 0)
              }
            >
              {isMapLoading
                ? "Memuat Peta..."
                : isLoading
                ? "Memproses..."
                : "Simpan ke Database"}
            </button>
          </div>
        </form>

        {message && (
          <div
            className={`message ${
              message.includes("berhasil")
                ? "success"
                : message.includes("Error")
                ? "error"
                : "info"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      <JsonPreview data={jsonPreview} />

      <div className="info-panel">
        <h3>Informasi</h3>
        <ul>
          <li>
            Data akan disimpan ke database <strong>CloudFlare</strong>
          </li>
          <li>
            Format yang didukung: Tab-separated (TSV), JSON, Excel (.xlsx,
            .xls), dan CSV.
          </li>
          <li>
            Baris pertama pada data tabular (TSV/Excel/CSV) harus berisi header
            kolom.
          </li>
          <li>Data JSON harus berupa *array of objects*.</li>
        </ul>
      </div>
    </div>
  );
};

export default InputWO;
