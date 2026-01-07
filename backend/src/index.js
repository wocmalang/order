import { Router, json } from 'itty-router';

// --- KONSTANTA KOLOM (Sesuai kebutuhan FE) ---
const WORK_ORDER_COLUMNS = [
  'incident', 'ticket_id_gamas', 'external_ticket_id', 'customer_id', 'customer_name', 'service_id', 'service_no',
  'summary', 'description_assignment', 'reported_date', 'reported_by', 'reported_priority', 'source_ticket', 'channel',
  'contact_phone', 'contact_name', 'contact_email', 'status', 'status_date', 'booking_date', 'resolve_date',
  'date_modified', 'last_update_worklog', 'closed_by', 'closed_reopen_by', 'guarantee_status', 'ttr_customer',
  'ttr_agent', 'ttr_mitra', 'ttr_nasional', 'ttr_pending', 'ttr_region', 'ttr_witel', 'ttr_end_to_end', 'owner_group',
  'owner', 'witel', 'workzone', 'region', 'subsidiary', 'territory_near_end', 'territory_far_end', 'customer_segment',
  'customer_type', 'customer_category', 'service_type', 'slg', 'technology', 'lapul', 'gaul', 'onu_rx', 'pending_reason',
  'incident_domain', 'symptom', 'hierarchy_path', 'solution', 'description_actual_solution', 'kode_produk', 'perangkat',
  'technician', 'device_name', 'sn_ont', 'tipe_ont', 'manufacture_ont', 'impacted_site', 'cause', 'resolution',
  'worklog_summary', 'classification_flag', 'realm', 'related_to_gamas', 'tsc_result', 'scc_result', 'note',
  'notes_eskalasi', 'rk_information', 'external_ticket_tier_3', 'classification_path', 'urgency', 'alamat', 'korlap', 'sektor',
];

const jsonResponse = (data, options = {}) => json(data, { status: 200, ...options });

const withCORS = (response) => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
};

const withDB = (request, env) => {
  if (!env.DB) return jsonResponse({ success: false, error: 'Database connection not configured.' }, { status: 500 });
};

const router = Router();

// CORS Pre-flight
router.options('*', () => new Response(null, {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  },
}));

router.all('*', withDB);

// Health Check
router.get('/', () => jsonResponse({ status: 'ok', message: 'Backend API is running.', version: '1.6.4' }));

/**
 * 1. INPUT DATA (Digunakan InputWO.jsx)
 * Mengisi otomatis Sektor & Korlap + Sync Alamat
 */
router.post('/mypost', async (request, env) => {
  const data = await request.json();
  if (!Array.isArray(data) || data.length === 0) {
    return json({ success: false, message: 'Data harus berupa array.' }, { status: 400 });
  }

  let workOrderProcessed = 0;
  let totalAddressUpdates = 0;

  try {
    // Ambil Mapping Workzone
    const { results: mapResults } = await env.DB.prepare(
      'SELECT workzone, sektor, korlap_username FROM workzone_details WHERE workzone IS NOT NULL'
    ).all();

    const workzoneToSektorMap = mapResults.reduce((acc, { workzone, sektor }) => {
      if (sektor) acc[workzone] = sektor;
      return acc;
    }, {});
    
    const workzoneToKorlapMap = mapResults.reduce((acc, { workzone, korlap_username }) => {
        if (korlap_username) acc[workzone] = korlap_username;
        return acc;
    }, {});

    const workOrderStmts = [];
    for (const row of data) {
      if (!row.incident) continue;

      // Auto-fill Sektor & Korlap
      if (row.workzone) {
        if (workzoneToSektorMap[row.workzone]) row.sektor = workzoneToSektorMap[row.workzone];
        if (workzoneToKorlapMap[row.workzone]) row.korlap = workzoneToKorlapMap[row.workzone];
      }

      const validKeys = Object.keys(row).filter((key) => WORK_ORDER_COLUMNS.includes(key));
      const values = validKeys.map((key) => row[key]);
      const query = `INSERT INTO work_orders (${validKeys.join(', ')}) VALUES (${'?'.repeat(validKeys.length).split('').join(',')});`;
      
      workOrderStmts.push(env.DB.prepare(query).bind(...values));
      workOrderProcessed++;
    }

    if (workOrderStmts.length > 0) await env.DB.batch(workOrderStmts);

    // Auto-sync Alamat jika kosong di WO tapi ada di data_layanan
    const { results: addressesToSync } = await env.DB.prepare(
      "SELECT service_no, alamat FROM data_layanan WHERE service_no IN (SELECT service_no FROM work_orders WHERE alamat IS NULL OR alamat = '') AND alamat IS NOT NULL"
    ).all();

    if (addressesToSync?.length > 0) {
      const syncStmts = addressesToSync.map((addr) =>
        env.DB.prepare('UPDATE work_orders SET alamat = ? WHERE service_no = ?').bind(addr.alamat, addr.service_no)
      );
      const batchResult = await env.DB.batch(syncStmts);
      totalAddressUpdates = batchResult.reduce((sum, r) => sum + (r.success ? r.meta.changes : 0), 0);
    }

    return json({ success: true, message: `Sukses. ${workOrderProcessed} WO diproses. ${totalAddressUpdates} alamat disinkronkan.` }, { status: 201 });
  } catch (err) {
    console.error('Error /mypost:', err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
});

/**
 * 2. READ DATA (Digunakan LihatWO.jsx & InputWO.jsx)
 * Menampilkan data WO + Flag Duplikat
 */
router.get('/view-d1', async (request, env) => {
  try {
    const query = `
      WITH BaseWO AS (
        SELECT *,
            CASE WHEN INSTR(incident, '-') > 0 THEN SUBSTR(incident, 1, INSTR(incident, '-') - 1) ELSE incident END as base_incident_id
        FROM work_orders
      ),
      RankedWO AS (
        SELECT *, COUNT(*) OVER(PARTITION BY base_incident_id) as group_count FROM BaseWO
      )
      SELECT *,
          (CASE WHEN group_count > 1 AND INSTR(incident, '-') > 0 AND status != 'CLOSED' THEN 1 ELSE 0 END) AS is_duplicate,
          (CASE WHEN group_count > 1 AND INSTR(incident, '-') > 0 AND status != 'CLOSED' THEN -2 ELSE NULL END) AS ttr_end_to_end
      FROM RankedWO ORDER BY incident DESC;
    `;
    const { results } = await env.DB.prepare(query).all();
    return json({ success: true, count: results.length, data: results });
  } catch (err) {
    return json({ success: false, error: err.message }, { status: 500 });
  }
});

/**
 * 3. UPDATE DATA (Digunakan LihatWO.jsx - Edit Modal)
 */
router.put('/work-orders/:incident', async (request, env) => {
  const { incident } = request.params;
  const data = await request.json();

  try {
    const keysToUpdate = Object.keys(data).filter((key) => WORK_ORDER_COLUMNS.includes(key) && key !== 'incident');
    if (keysToUpdate.length === 0) return jsonResponse({ success: false, message: 'Tidak ada data valid.' }, { status: 400 });

    const setClauses = keysToUpdate.map((k) => `${k} = ?`).join(', ');
    const values = keysToUpdate.map((key) => data[key]);

    await env.DB.prepare(`UPDATE work_orders SET ${setClauses} WHERE incident = ?`).bind(...values, incident).run();
    
    // Return data terbaru
    const { results } = await env.DB.prepare('SELECT * FROM work_orders WHERE incident = ?').bind(incident).all();
    return jsonResponse({ success: true, message: 'Update berhasil.', data: results[0] });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, { status: 500 });
  }
});

/**
 * 4. DELETE DATA (Digunakan LihatWO.jsx - Hapus)
 */
router.delete('/work-orders/:incident', async (request, env) => {
  const { incident } = request.params;
  try {
    const { meta } = await env.DB.prepare('DELETE FROM work_orders WHERE incident = ?').bind(incident).run();
    if (meta.changes === 0) return json({ success: false, message: 'Data tidak ditemukan.' }, { status: 404 });
    return json({ success: true, message: 'Data dihapus.', changes: meta.changes });
  } catch (err) {
    return json({ success: false, error: err.message }, { status: 500 });
  }
});

/**
 * 5. COMPLETE TICKET / CLOSE (Digunakan LihatWO.jsx)
 * Pindah ke tabel reports
 */
router.post('/work-orders/:incident/complete', async (request, env) => {
  const { incident } = request.params;
  try {
    const { results } = await env.DB.prepare('SELECT * FROM work_orders WHERE incident = ?').bind(incident).all();
    if (results.length === 0) return jsonResponse({ success: false, message: 'WO tidak ditemukan.' }, { status: 404 });

    const wo = results[0];
    wo.status = 'CLOSED';
    wo.resolve_date = new Date().toISOString();
    wo.date_modified = new Date().toISOString();

    const cols = Object.keys(wo);
    const vals = Object.values(wo);

    await env.DB.batch([
      env.DB.prepare(`REPLACE INTO reports (${cols.join(', ')}) VALUES (${'?'.repeat(cols.length).split('').join(',')})`).bind(...vals),
      env.DB.prepare('DELETE FROM work_orders WHERE incident = ?').bind(incident),
    ]);

    return jsonResponse({ success: true, message: 'WO selesai dan dipindah ke laporan.' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, { status: 500 });
  }
});

/**
 * 6. VIEW REPORTS (Digunakan Report.jsx)
 */
router.get('/reports', async (request, env) => {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM reports ORDER BY reported_date DESC').all();
    return json({ success: true, data: results });
  } catch (err) {
    return json({ success: false, error: err.message }, { status: 500 });
  }
});

/**
 * 7. REOPEN TICKET (Digunakan Report.jsx)
 * Kembalikan ke work_orders
 */
router.post('/reports/:incident/reopen', async (request, env) => {
  const { incident } = request.params;
  try {
    const { results } = await env.DB.prepare('SELECT * FROM reports WHERE incident = ?').bind(incident).all();
    if (results.length === 0) return jsonResponse({ success: false, message: 'Laporan tidak ditemukan.' }, { status: 404 });

    const report = results[0];
    report.status = 'OPEN';
    report.resolve_date = null;
    report.date_modified = new Date().toISOString();

    const cols = Object.keys(report);
    const vals = Object.values(report);

    await env.DB.batch([
      env.DB.prepare(`REPLACE INTO work_orders (${cols.join(', ')}) VALUES (${'?'.repeat(cols.length).split('').join(',')})`).bind(...vals),
      env.DB.prepare('DELETE FROM reports WHERE incident = ?').bind(incident),
    ]);

    return jsonResponse({ success: true, message: 'WO dibuka kembali.' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, { status: 500 });
  }
});

/**
 * 8. MAP REFERENCE (Digunakan InputWO.jsx & LihatWO.jsx)
 * Mengambil referensi Workzone -> Sektor/Korlap
 */
router.get('/workzone-map', async (request, env) => {
  try {
    const { results } = await env.DB.prepare(`SELECT workzone, sektor, korlap_username AS korlaps FROM workzone_details ORDER BY workzone`).all();
    return jsonResponse(results);
  } catch (err) {
    return jsonResponse({ error: err.message }, { status: 500 });
  }
});

/**
 * 9. AUTH LOGIN (Digunakan AuthPage.jsx)
 */
router.post('/login', async (request, env) => {
  try {
    const { username, password } = await request.json();
    if (!username || !password) return json({ success: false, message: 'Input tidak lengkap.' }, { status: 400 });

    const { results } = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).all();
    if (!results.length || results[0].password !== password) {
      return json({ success: false, message: 'Username atau Password salah.' }, { status: 401 });
    }

    const { password: _, ...user } = results[0];
    return json({ success: true, user });
  } catch (err) {
    return json({ success: false, error: err.message }, { status: 500 });
  }
});

/**
 * 10. USER MANAGEMENT (Digunakan UserManagementPage.jsx)
 * GET, POST, DELETE User
 */
router.get('/users', async (request, env) => {
  try {
    const { results } = await env.DB.prepare('SELECT username, role FROM users').all();
    return json({ success: true, users: results });
  } catch (err) {
    return json({ success: false, error: err.message }, { status: 500 });
  }
});

router.post('/users', async (request, env) => {
  try {
    const { username, password, role } = await request.json();
    if (!username || !password || !role) return json({ success: false, message: 'Data kurang.' }, { status: 400 });
    
    // Cek Duplikat
    const { results } = await env.DB.prepare('SELECT username FROM users WHERE username = ?').bind(username).all();
    if (results.length > 0) return json({ success: false, message: 'User sudah ada.' }, { status: 409 });

    await env.DB.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').bind(username, password, role).run();
    return json({ success: true, message: 'User dibuat.' });
  } catch (err) {
    return json({ success: false, error: err.message }, { status: 500 });
  }
});

router.delete('/users/:username', async (request, env) => {
  const { username } = request.params;
  try {
    await env.DB.prepare('DELETE FROM users WHERE username = ?').bind(username).run();
    return json({ success: true, message: 'User dihapus.' });
  } catch (err) {
    return json({ success: false, error: err.message }, { status: 500 });
  }
});

router.all('*', () => new Response('404, Not Found.', { status: 404 }));

export default {
  async fetch(request, env, ctx) {
    const response = await router.handle(request, env, ctx);
    return withCORS(response);
  },
};