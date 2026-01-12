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

describe('Siklus 1: Full CRUD & Sync Logic Tests (Sync Priority)', () => {

  beforeAll(async () => {
    await env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS work_orders (${WORK_ORDER_COLS_DEF})`),
      
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS workzone_details (
          id INTEGER PRIMARY KEY, 
          workzone TEXT, 
          sektor TEXT, 
          korlap_username TEXT
        )
      `),

      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS data_layanan (
          service_no TEXT,
          alamat TEXT
        )
      `)
    ]);

    await env.DB.batch([
      env.DB.prepare('DELETE FROM workzone_details'),
      env.DB.prepare('DELETE FROM data_layanan'),
      
      env.DB.prepare(`
        INSERT INTO workzone_details (workzone, sektor, korlap_username) 
        VALUES ('WZ_MALANG', 'Sektor Pusat', 'pak_budi')
      `),
      
      env.DB.prepare(`
        INSERT INTO data_layanan (service_no, alamat) 
        VALUES ('1001', 'Jl. Master Database No. 1')
      `)
    ]);
  });

  beforeEach(async () => {
    await env.DB.prepare('DELETE FROM work_orders').run();
  });

  // TEST CASES
  it('POST /mypost - Create WO: Memastikan Alamat Master Selalu Menimpa Manual', async () => {
    const payload = [
      // KASUS A: Full Otomatis (Alamat Sync)
      {
        incident: 'INC-AUTO',
        summary: 'Tiket Otomatis',
        workzone: 'WZ_MALANG',
        service_no: '1001',    
        alamat: '',            
        status: 'OPEN'
      },
      // KASUS B: Override Manual 
      {
        incident: 'INC-MANUAL',
        summary: 'Tiket Manual',
        workzone: 'WZ_MALANG',      
        service_no: '1001',         
        alamat: 'Jl. Manual Input', 
        status: 'OPEN'
      }
    ];

    const req = createRequest('POST', '/mypost', payload);
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);

    // Verifikasi KASUS A
    const woAuto = await env.DB.prepare("SELECT * FROM work_orders WHERE incident = 'INC-AUTO'").first();
    expect(woAuto.korlap).toBe('pak_budi');                  
    expect(woAuto.alamat).toBe('Jl. Master Database No. 1'); 
    // Verifikasi KASUS B
    const woManual = await env.DB.prepare("SELECT * FROM work_orders WHERE incident = 'INC-MANUAL'").first();
    expect(woManual).toBeDefined();
    expect(woManual.alamat).toBe('Jl. Master Database No. 1');  
  });

  it('GET /view-d1 - Menampilkan semua tiket (Descending Order)', async () => {
    await env.DB.prepare("INSERT INTO work_orders (incident, status, summary) VALUES ('A1', 'OPEN', 'Tes 1'), ('A2', 'CLOSED', 'Tes 2')").run();

    const req = createRequest('GET', '/view-d1');
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.length).toBe(2);
    expect(body.data[0].incident).toBe('A2'); 
    expect(body.data[1].incident).toBe('A1'); 
  });

  it('PUT /work-orders/:incident - Update status dan data tiket', async () => {
    await env.DB.prepare("INSERT INTO work_orders (incident, status, summary) VALUES ('INC-EDIT', 'OPEN', 'Lama')").run();

    const updateData = { status: 'ON_PROGRESS', summary: 'Baru', technician: 'Teknisi A' };
    const req = createRequest('PUT', '/work-orders/INC-EDIT', updateData);
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(200);
    const updated = await env.DB.prepare("SELECT * FROM work_orders WHERE incident = 'INC-EDIT'").first();
    expect(updated.status).toBe('ON_PROGRESS');
    expect(updated.technician).toBe('Teknisi A'); 
  });

  it('DELETE /work-orders/:incident - Menghapus tiket', async () => {
    await env.DB.prepare("INSERT INTO work_orders (incident) VALUES ('INC-HAPUS')").run();
    const req = createRequest('DELETE', '/work-orders/INC-HAPUS');
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const check = await env.DB.prepare("SELECT * FROM work_orders WHERE incident = 'INC-HAPUS'").first();
    expect(check).toBeNull();
  });

  it('GET /workzone-map - Mengambil data referensi workzone', async () => {
    const req = createRequest('GET', '/workzone-map');
    const res = await worker.fetch(req, env);
    const body = await res.json();
    const item = body.find(r => r.workzone === 'WZ_MALANG');
    expect(item).toBeDefined();
    expect(item.korlaps).toBe('pak_budi'); 
  });

});