import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import worker from '../src/index';

const createRequest = (method, path, body = null) => {
  const options = { method };
  if (body) {
    options.body = JSON.stringify(body);
    options.headers = { 'Content-Type': 'application/json' };
  }
  return new Request(`http://localhost${path}`, options);
};

const WORK_ORDER_COLS_DEF = `
  incident TEXT PRIMARY KEY,
  ticket_id_gamas TEXT, external_ticket_id TEXT, customer_id TEXT, customer_name TEXT, service_id TEXT, service_no TEXT,
  summary TEXT, description_assignment TEXT, reported_date TEXT, reported_by TEXT, reported_priority TEXT, source_ticket TEXT, channel TEXT,
  contact_phone TEXT, contact_name TEXT, contact_email TEXT, status TEXT, status_date TEXT, booking_date TEXT, resolve_date TEXT,
  date_modified TEXT, last_update_worklog TEXT, closed_by TEXT, closed_reopen_by TEXT, guarantee_status TEXT, ttr_customer TEXT,
  ttr_agent TEXT, ttr_mitra TEXT, ttr_nasional TEXT, ttr_pending TEXT, ttr_region TEXT, ttr_witel TEXT, ttr_end_to_end TEXT, owner_group TEXT,
  owner TEXT, witel TEXT, workzone TEXT, region TEXT, subsidiary TEXT, territory_near_end TEXT, territory_far_end TEXT, customer_segment TEXT,
  customer_type TEXT, customer_category TEXT, service_type TEXT, slg TEXT, technology TEXT, lapul TEXT, gaul TEXT, onu_rx TEXT, pending_reason TEXT,
  incident_domain TEXT, symptom TEXT, hierarchy_path TEXT, solution TEXT, description_actual_solution TEXT, kode_produk TEXT, perangkat TEXT,
  technician TEXT, device_name TEXT, sn_ont TEXT, tipe_ont TEXT, manufacture_ont TEXT, impacted_site TEXT, cause TEXT, resolution TEXT,
  worklog_summary TEXT, classification_flag TEXT, realm TEXT, related_to_gamas TEXT, tsc_result TEXT, scc_result TEXT, note TEXT,
  notes_eskalasi TEXT, rk_information TEXT, external_ticket_tier_3 TEXT, classification_path TEXT, urgency TEXT, alamat TEXT, korlap TEXT, sektor TEXT
`;

describe('Siklus 2: Auth, User Management & Ticket Lifecycle', () => {

  beforeAll(async () => {
    await env.DB.batch([
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          username TEXT PRIMARY KEY,
          password TEXT,
          role TEXT
        )
      `),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS work_orders (${WORK_ORDER_COLS_DEF})`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS reports (${WORK_ORDER_COLS_DEF})`)
    ]);

    await env.DB.prepare('DELETE FROM users').run();
    await env.DB.prepare("INSERT INTO users (username, password, role) VALUES ('admin', 'rahasia123', 'admin')").run();
  });

  beforeEach(async () => {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM work_orders'),
      env.DB.prepare('DELETE FROM reports'),
    ]);
  });

  // 1. FITUR LOGIN
  it('POST /login - Login Berhasil', async () => {
    const payload = { username: 'admin', password: 'rahasia123' };
    const req = createRequest('POST', '/login', payload);
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.user.username).toBe('admin');
    expect(body.user.role).toBe('admin');
    expect(body.user.password).toBeUndefined(); // Security check
  });

  it('POST /login - Login Gagal (Password Salah)', async () => {
    const payload = { username: 'admin', password: 'salah_password' };
    const req = createRequest('POST', '/login', payload);
    const res = await worker.fetch(req, env);
    const body = await res.json();
    
    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  // 2. FITUR MANAJEMEN USER
  it('POST /users - Membuat User Baru', async () => {
    const payload = { username: 'teknisi1', password: 'tek123', role: 'teknisi' };
    const req = createRequest('POST', '/users', payload);
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    const user = await env.DB.prepare("SELECT * FROM users WHERE username = 'teknisi1'").first();
    expect(user).toBeDefined();
    expect(user.role).toBe('teknisi');
  });

  it('POST /users - Gagal Membuat User Duplikat', async () => {
    const payload = { username: 'admin', password: 'newpassword', role: 'user' };
    const req = createRequest('POST', '/users', payload);
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(409); // Conflict
    expect(body.message).toContain('sudah ada');
  });

  it('DELETE /users/:username - Menghapus User', async () => {
    await env.DB.prepare("INSERT INTO users (username, password, role) VALUES ('user_hapus', 'pw', 'user')").run();

    const req = createRequest('DELETE', '/users/user_hapus');
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    const check = await env.DB.prepare("SELECT * FROM users WHERE username = 'user_hapus'").first();
    expect(check).toBeNull();
  });

  it('GET /users - Melihat Daftar User', async () => {
    const req = createRequest('GET', '/users');
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.users.length).toBeGreaterThan(0); // Minimal ada admin
  });

  // 3. FITUR COMPLETE TICKET (WO -> REPORT)
  it('POST /work-orders/:incident/complete - Menyelesaikan Tiket', async () => {
    await env.DB.prepare("INSERT INTO work_orders (incident, status, summary) VALUES ('INC-CLOSE', 'OPEN', 'Segera Selesai')").run();

    const req = createRequest('POST', '/work-orders/INC-CLOSE/complete');
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // 1. Cek Work Orders: Harus HILANG
    const checkWo = await env.DB.prepare("SELECT * FROM work_orders WHERE incident = 'INC-CLOSE'").first();
    expect(checkWo).toBeNull();

    // 2. Cek Reports: Harus ADA & Status CLOSED
    const checkRep = await env.DB.prepare("SELECT * FROM reports WHERE incident = 'INC-CLOSE'").first();
    expect(checkRep).toBeDefined();
    expect(checkRep.status).toBe('CLOSED');
    expect(checkRep.resolve_date).not.toBeNull();
  });

  // 4. FITUR REOPEN TICKET (REPORT -> WO) & VIEW REPORTS
  it('GET /reports - Melihat Daftar Laporan', async () => {
    // Setup: Masukkan data dummy ke reports
    await env.DB.prepare("INSERT INTO reports (incident, status) VALUES ('REP-01', 'CLOSED'), ('REP-02', 'CLOSED')").run();

    const req = createRequest('GET', '/reports');
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.length).toBe(2);
  });

  it('POST /reports/:incident/reopen - Membuka Kembali Tiket', async () => {
    // Setup: Ada tiket di reports (sudah closed)
    await env.DB.prepare("INSERT INTO reports (incident, status) VALUES ('INC-REOPEN', 'CLOSED')").run();

    const req = createRequest('POST', '/reports/INC-REOPEN/reopen');
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // 1. Cek Reports: Harus HILANG
    const checkRep = await env.DB.prepare("SELECT * FROM reports WHERE incident = 'INC-REOPEN'").first();
    expect(checkRep).toBeNull();

    // 2. Cek Work Orders: Harus ADA & Status OPEN
    const checkWo = await env.DB.prepare("SELECT * FROM work_orders WHERE incident = 'INC-REOPEN'").first();
    expect(checkWo).toBeDefined();
    expect(checkWo.status).toBe('OPEN');
    expect(checkWo.resolve_date).toBeNull();
  });

});