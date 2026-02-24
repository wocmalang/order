-- 1. Tabel Users
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- PK sekarang angka otomatis
  username TEXT NOT NULL UNIQUE,        -- Username tetap harus unik
  password TEXT NOT NULL,
  role TEXT NOT NULL
);

-- Insert User Admin Default
INSERT INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin');

-- 2. Tabel Work Orders (Tidak berubah, tetap pakai incident)
DROP TABLE IF EXISTS work_orders;
CREATE TABLE work_orders (
  incident TEXT PRIMARY KEY,
  -- ... (kolom lainnya sama seperti sebelumnya, tidak perlu diubah) ...
  ticket_id_gamas TEXT,
  external_ticket_id TEXT,
  customer_id TEXT,
  customer_name TEXT,
  service_id TEXT,
  service_no TEXT,
  summary TEXT,
  description_assignment TEXT,
  reported_date TEXT,
  reported_by TEXT,
  reported_priority TEXT,
  source_ticket TEXT,
  channel TEXT,
  contact_phone TEXT,
  contact_name TEXT,
  contact_email TEXT,
  status TEXT,
  status_date TEXT,
  booking_date TEXT,
  resolve_date TEXT,
  date_modified TEXT,
  last_update_worklog TEXT,
  closed_by TEXT,
  closed_reopen_by TEXT,
  guarantee_status TEXT,
  ttr_customer TEXT,
  ttr_agent TEXT,
  ttr_mitra TEXT,
  ttr_nasional TEXT,
  ttr_pending TEXT,
  ttr_region TEXT,
  ttr_witel TEXT,
  ttr_end_to_end TEXT,
  owner_group TEXT,
  owner TEXT,
  witel TEXT,
  workzone TEXT,
  region TEXT,
  subsidiary TEXT,
  territory_near_end TEXT,
  territory_far_end TEXT,
  customer_segment TEXT,
  customer_type TEXT,
  customer_category TEXT,
  service_type TEXT,
  slg TEXT,
  technology TEXT,
  lapul TEXT,
  gaul TEXT,
  onu_rx TEXT,
  pending_reason TEXT,
  incident_domain TEXT,
  symptom TEXT,
  hierarchy_path TEXT,
  solution TEXT,
  description_actual_solution TEXT,
  kode_produk TEXT,
  perangkat TEXT,
  technician TEXT,
  device_name TEXT,
  sn_ont TEXT,
  tipe_ont TEXT,
  manufacture_ont TEXT,
  impacted_site TEXT,
  cause TEXT,
  resolution TEXT,
  worklog_summary TEXT,
  classification_flag TEXT,
  realm TEXT,
  related_to_gamas TEXT,
  tsc_result TEXT,
  scc_result TEXT,
  note TEXT,
  notes_eskalasi TEXT,
  rk_information TEXT,
  external_ticket_tier_3 TEXT,
  classification_path TEXT,
  urgency TEXT,
  alamat TEXT,
  korlap TEXT,
  sektor TEXT
);

-- 3. Tabel Reports
DROP TABLE IF EXISTS reports;
CREATE TABLE reports AS SELECT * FROM work_orders WHERE 0;

-- 4. Tabel Referensi Workzone
DROP TABLE IF EXISTS workzone_details;
CREATE TABLE workzone_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- PK angka otomatis
  workzone TEXT,
  sektor TEXT,
  korlap_username TEXT
);
-- Kita buat index agar pencarian workzone tetap cepat
CREATE UNIQUE INDEX IF NOT EXISTS idx_workzone ON workzone_details(workzone);

-- 5. Tabel Referensi Data Layanan
DROP TABLE IF EXISTS data_layanan;
CREATE TABLE data_layanan (
  service_no TEXT PRIMARY KEY,
  alamat TEXT
);