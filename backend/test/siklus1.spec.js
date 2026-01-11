import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import worker from '../src/index';

// Helper untuk membuat request HTTP simulasi
const createRequest = (method, path, body = null) => {
  const options = { method };
  if (body) {
    options.body = JSON.stringify(body);
    options.headers = { 'Content-Type': 'application/json' };
  }
  return new Request(`http://localhost${path}`, options);
};

describe('Siklus 1: Basic Ticket Management & Synchronization', () => {
  
  // 1. SETUP DATABASE
  // Menyiapkan tabel-tabel yang dibutuhkan untuk siklus 1
  beforeAll(async (ctx) => {
    await ctx.env.DB.exec(`
      -- Tabel Utama Work Orders
      CREATE TABLE IF NOT EXISTS work_orders (
        incident TEXT PRIMARY KEY,
        summary TEXT,
        status TEXT,
        workzone TEXT,
        sektor TEXT,
        korlap TEXT,
        alamat TEXT,
        service_no TEXT,
        resolve_date TEXT,
        date_modified TEXT
      );

      -- Tabel Referensi Workzone (untuk fitur GetWorkzone & Auto-Mapping)
      CREATE TABLE IF NOT EXISTS workzone_details (
        workzone TEXT PRIMARY KEY,
        sektor TEXT,
        korlap_username TEXT
      );

      -- Tabel Data Layanan (untuk fitur SyncWorkOrder / Sync Alamat)
      CREATE TABLE IF NOT EXISTS data_layanan (
        service_no TEXT,
        alamat TEXT
      );
    `);

    // Seed Data Dummy untuk Referensi Workzone
    await ctx.env.DB.prepare(`
      INSERT INTO workzone_details (workzone, sektor, korlap_username) 
      VALUES ('WZ_S1', 'Sektor Utara', 'korlap_s1')
    `).run();

    // Seed Data Dummy untuk Data Layanan (Master Alamat)
    await ctx.env.DB.prepare(`
      INSERT INTO data_layanan (service_no, alamat) 
      VALUES ('111222', 'Jl. Ijen No. 5 Malang')
    `).run();
  });

  // Reset data work_orders setiap sebelum test dimulai agar bersih
  beforeEach(async (ctx) => {
    await ctx.env.DB.prepare('DELETE FROM work_orders').run();
  });

  // --- TEST CASE 1: INPUT TICKET & SYNC WORK ORDER ---
  // Menguji endpoint POST /mypost
  // Mencakup: Input Data, Mapping Workzone, dan Sync Alamat
  it('POST /mypost - Harus berhasil input, mapping workzone, dan sync alamat otomatis', async ({ env }) => {
    const payload = [
      {
        incident: 'INC-001',
        summary: 'Gangguan Internet',
        workzone: 'WZ_S1',       // Harus otomatis mapping ke 'Sektor Utara' & 'korlap_s1'
        service_no: '111222',    // Ada di master data_layanan -> harus sync alamat
        alamat: ''               // Alamat kosong, ekspektasi terisi otomatis
      },
      {
        incident: 'INC-002',
        summary: 'Gangguan TV',
        workzone: 'WZ_UNKNOWN',  // Workzone tidak dikenal
        service_no: '999999',    // Tidak ada di master
        alamat: 'Jl. Manual'     // Alamat manual
      }
    ];

    const req = createRequest('POST', '/mypost', payload);
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);

    // Verifikasi Data INC-001 (Fitur Input + Sync + Mapping)
    const wo1 = await env.DB.prepare("SELECT * FROM work_orders WHERE incident = 'INC-001'").first();
    expect(wo1).toBeDefined();
    expect(wo1.sektor).toBe('Sektor Utara'); // Mapping berhasil
    expect(wo1.korlap).toBe('korlap_s1');    // Mapping berhasil
    expect(wo1.alamat).toBe('Jl. Ijen No. 5 Malang'); // Sync Alamat berhasil

    // Verifikasi Data INC-002 (Fitur Input Standar)
    const wo2 = await env.DB.prepare("SELECT * FROM work_orders WHERE incident = 'INC-002'").first();
    expect(wo2).toBeDefined();
    expect(wo2.alamat).toBe('Jl. Manual');
  });

  // --- TEST CASE 2: GET ALL TICKET ---
  // Menguji endpoint GET /view-d1
  it('GET /view-d1 - Harus menampilkan semua tiket', async ({ env }) => {
    // Siapkan data
    await env.DB.prepare(`
      INSERT INTO work_orders (incident, status, summary) 
      VALUES ('INC-VIEW-1', 'OPEN', 'Tes 1'), ('INC-VIEW-2', 'PENDING', 'Tes 2')
    `).run();

    const req = createRequest('GET', '/view-d1');
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.length).toBe(2);
    expect(body.data[0].incident).toBeDefined();
  });

  // --- TEST CASE 3: GET WORKZONE (REFERENSI) ---
  // Menguji endpoint GET /workzone-map
  it('GET /workzone-map - Harus menampilkan referensi workzone', async ({ env }) => {
    const req = createRequest('GET', '/workzone-map');
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(200);
    // Kita insert 1 data di beforeAll ('WZ_S1')
    expect(Array.isArray(body)).toBe(true);
    const wz = body.find(item => item.workzone === 'WZ_S1');
    expect(wz).toBeDefined();
    expect(wz.sektor).toBe('Sektor Utara');
  });

  // --- TEST CASE 4: UPDATE TICKET ---
  // Menguji endpoint PUT /work-orders/:incident
  it('PUT /work-orders/:incident - Harus berhasil update status tiket', async ({ env }) => {
    // Insert data awal
    await env.DB.prepare("INSERT INTO work_orders (incident, status) VALUES ('INC-UPD', 'OPEN')").run();

    const updateData = { status: 'ON_PROGRESS', summary: 'Sedang dikerjakan' };
    const req = createRequest('PUT', '/work-orders/INC-UPD', updateData);
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // Cek perubahan di DB
    const updatedWo = await env.DB.prepare("SELECT status, summary FROM work_orders WHERE incident = 'INC-UPD'").first();
    expect(updatedWo.status).toBe('ON_PROGRESS');
    expect(updatedWo.summary).toBe('Sedang dikerjakan');
  });

  // --- TEST CASE 5: DELETE TICKET ---
  // Menguji endpoint DELETE /work-orders/:incident
  it('DELETE /work-orders/:incident - Harus berhasil menghapus tiket', async ({ env }) => {
    // Insert data awal
    await env.DB.prepare("INSERT INTO work_orders (incident) VALUES ('INC-DEL')").run();

    const req = createRequest('DELETE', '/work-orders/INC-DEL');
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // Pastikan data hilang dari DB
    const check = await env.DB.prepare("SELECT * FROM work_orders WHERE incident = 'INC-DEL'").first();
    expect(check).toBeNull();
  });

});