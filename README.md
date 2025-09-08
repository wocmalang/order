Work Order Management System
1. Ikhtisar Proyek
Aplikasi ini adalah sistem manajemen Work Order (WO) atau insiden berbasis web. Aplikasi ini memungkinkan pengguna untuk melakukan input data insiden secara massal, mengelola tiket yang aktif, dan melihat laporan dari tiket yang sudah selesai.

Fokus utama dari sistem ini adalah otomatisasi proses bisnis, seperti perhitungan Time to Resolution (TTR) dan pengarsipan tiket secara sistematis. Berdasarkan kode yang ada, sistem ini primernya menggunakan backend Express.js dengan database MySQL.

2. Struktur Proyek
Repositori ini terdiri dari beberapa bagian utama:

/frontend: Aplikasi antarmuka pengguna (UI) yang dibangun menggunakan React dan Vite. Semua komponen visual dan interaksi pengguna berada di sini.

/express: Backend utama aplikasi yang dibangun menggunakan Express.js. Direktori ini berisi semua logika sisi server, koneksi ke database MySQL, dan API endpoint.

/backend: Backend alternatif yang dirancang untuk platform serverless Cloudflare Workers dengan database D1. Saat ini, backend yang aktif digunakan adalah yang ada di direktori /express.

3. Tumpukan Teknologi (Tech Stack)
Frontend
Framework: React 19

Build Tool: Vite

Routing: React Router DOM

Charting: Chart.js

Ekspor Data: xlsx untuk Excel, jspdf & jspdf-autotable untuk PDF

Backend (Express)
Framework: Express.js

Database: MySQL

Driver MySQL: mysql2/promise

Date/Time Handling: moment-timezone

4. Konfigurasi dan Instalasi
Prasyarat
Node.js (versi 18 atau lebih tinggi)

Server Database MySQL yang sedang berjalan

Pengaturan Backend (Express)
Masuk ke direktori express:

Bash

cd express
Instal dependensi:

Bash

npm install
Buat file .env di dalam direktori express dan isi variabel berikut sesuai dengan konfigurasi database Anda:

Cuplikan kode

MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_DB=nama_database_anda
MYSQL_PASSWORD=password_anda
PORT=3001
Jalankan server backend:

Bash

npm start
Server akan berjalan di http://localhost:3001.

Pengaturan Frontend
Masuk ke direktori frontend:

Bash

cd frontend
Instal dependensi:

Bash

npm install
Buat file .env di dalam direktori frontend untuk menghubungkan ke backend:

Cuplikan kode

VITE_API_BASE_URL=http://localhost:3001
Jalankan aplikasi frontend:

Bash

npm run dev
Aplikasi akan tersedia di http://localhost:5173 (atau port lain yang tersedia).

5. Skema Database (MySQL)
Berdasarkan analisis kode, berikut adalah tabel utama yang dibutuhkan oleh aplikasi:

incidents: Menyimpan semua data work order yang aktif.

incident (PRIMARY KEY)

status (e.g., 'OPEN', 'BACKEND', 'RESOLVED', 'CLOSED')

reported_date (DATETIME)

resolve_date (DATETIME, nullable)

workzone (VARCHAR)

sektor (VARCHAR, nullable)

ttr_customer, ttr_agent, ttr_mitra, dst. (VARCHAR, nullable)

...dan kolom lainnya sesuai allowedFields di InputWO.jsx.

reports: Berfungsi sebagai arsip untuk incidents yang sudah selesai. Strukturnya identik dengan tabel incidents.

workzone_map: Tabel pemetaan untuk mengisi data sektor secara otomatis.

workzone

sektor

6. API Endpoints (Express)
Berikut adalah endpoint utama yang diekspos oleh backend Express (/express/routes/apiRoutes.js).

GET /view-mysql

Fungsi: Mengambil semua data dari tabel incidents.

Respons: 200 OK dengan array data insiden.

GET /workzone-map

Fungsi: Mengambil data pemetaan dari tabel workzone_map.

Respons: 200 OK dengan array data pemetaan.

PUT /work-orders/:incident

Fungsi: Memperbarui data insiden berdasarkan incident.

Logika Bisnis:

Jika status diubah menjadi RESOLVED atau CLOSED, endpoint ini akan otomatis mengisi resolve_date dan menghitung durasi TTR (Time to Resolution) dari reported_date.

Jika status diubah kembali dari RESOLVED/CLOSED, endpoint akan menghapus nilai resolve_date dan ttr_*.

Body: Objek JSON dengan field yang akan diperbarui.

DELETE /work-orders/:incident

Fungsi: Menghapus satu insiden dari tabel incidents.

POST /work-orders/:incident/complete

Fungsi: Memindahkan data insiden dari tabel incidents ke tabel reports. Proses ini dijalankan dalam sebuah transaksi database untuk memastikan integritas data.

POST /reports/:incident/reopen (Terdapat di Frontend, diasumsikan ada di Backend)

Fungsi: Mengembalikan tiket dari reports (arsip) ke incidents (aktif).

7. Logika Kunci di Frontend
Input Data (InputWO.jsx):

Komponen ini mampu mem-parsing data dari berbagai format (TSV, JSON, Excel).

Sebelum mengirim ke backend, data diperkaya secara otomatis: kolom sektor diisi berdasarkan nilai workzone menggunakan data dari GET /workzone-map.

Laporan (Report.jsx):

Menampilkan data dari tabel reports dengan fitur filter berdasarkan rentang waktu.

Menyajikan visualisasi data menggunakan Chart.js untuk menampilkan tren tiket yang selesai.

Menyediakan fungsionalitas ekspor ke format Excel, CSV, dan PDF.
