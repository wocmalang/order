import { Router, json } from 'itty-router';

// =================================================================================
// 헬 HELPER FUNCTIONS (FUNGSI BANTUAN)
// =================================================================================

// Helper untuk membuat respons JSON yang konsisten
const jsonResponse = (data, options = {}) => {
    const defaultOptions = { status: 200 };
    return json(data, { ...defaultOptions, ...options });
};

// Helper untuk menambahkan header CORS ke semua respons
const withCORS = (response) => {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
};

// "Middleware" untuk memeriksa koneksi database di awal
const withDB = (request, env) => {
    if (!env.DB) {
        console.error("Database binding 'DB' tidak ditemukan.");
        return jsonResponse(
            {
                success: false,
                error: 'Database connection not configured.',
            },
            { status: 500 }
        );
    }
};

// =================================================================================
// 🗄️ ROUTER INITIALIZATION
// =================================================================================

const router = Router();

// Menangani pre-flight request untuk CORS
router.options(
    '*',
    () =>
        new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        })
);

// Middleware untuk memeriksa DB di semua rute (kecuali rute dasar)
router.all('*', withDB);

// =================================================================================
// 🏁 API ENDPOINTS
// =================================================================================

// Rute dasar untuk cek status API
router.get('/', () => {
    return jsonResponse({
        status: 'ok',
        message: 'Backend API is running.',
        version: '1.4.0',
    });
});

// =================================================================================
// ✨ FUNGSI BARU SESUAI ALUR KERJA (DITAMBAHKAN DI SINI)
// =================================================================================

/**
 * ENDPOINT BARU: [GET] /api/lihat-wo
 * Deskripsi: Mengambil semua WO dengan logika penandaan duplikat yang baru.
 * Aturan Duplikat: Tiket lama dianggap duplikat jika ada tiket yang LEBIH BARU
 * untuk customer & service yang sama, dan tiket yang lebih baru itu statusnya BUKAN 'CLOSED'.
 */
router.get('/api/lihat-wo', async (request, env) => {
    try {
        // 1. Ambil semua data, diurutkan dari yang terbaru (berdasarkan reported_date)
        const { results: allTickets } = await env.DB.prepare('SELECT * FROM work_orders ORDER BY reported_date DESC').all();

        // 2. Proses data di backend untuk menandai duplikat
        const processedTickets = allTickets.map((ticket, index, self) => {
            // Cari tiket yang lebih baru untuk customer dan service yang sama
            const newerTicket = self.slice(0, index).find((t) => t.customer_id === ticket.customer_id && t.service_id === ticket.service_id);

            // Tandai sebagai duplikat jika ada tiket baru dan statusnya BUKAN 'CLOSED'
            const isDuplicate = newerTicket && newerTicket.status !== 'CLOSED';

            return {
                ...ticket,
                is_duplicate: isDuplicate, // Flag ini akan digunakan oleh frontend
            };
        });

        return jsonResponse({
            success: true,
            count: processedTickets.length,
            data: processedTickets,
        });
    } catch (err) {
        console.error('Gagal mengambil data dengan logika baru:', err);
        return jsonResponse({ success: false, error: 'Gagal mengambil data.', details: err.message }, { status: 500 });
    }
});

/**
 * ENDPOINT BARU: [DELETE] /api/hapus-duplikat/:customerId/:serviceId
 * Deskripsi: Menghapus semua tiket LAMA untuk pelanggan tertentu,
 * hanya menyisakan tiket TERBARU yang sudah 'CLOSED'.
 */
router.delete('/api/hapus-duplikat/:customerId/:serviceId', async (request, env) => {
    const { customerId, serviceId } = request.params;

    if (!customerId || !serviceId) {
        return jsonResponse({ success: false, error: 'customer_id dan service_id diperlukan.' }, { status: 400 });
    }

    try {
        // 1. Temukan tiket terbaru untuk customer & service ini
        const { results: latestTickets } = await env.DB.prepare(
            'SELECT incident, status FROM work_orders WHERE customer_id = ? AND service_id = ? ORDER BY reported_date DESC LIMIT 1'
        )
            .bind(customerId, serviceId)
            .all();

        if (latestTickets.length === 0) {
            return jsonResponse({ success: false, message: 'Tidak ada tiket ditemukan untuk pelanggan ini.' }, { status: 404 });
        }

        const latestTicket = latestTickets[0];

        // 2. Syarat: Tiket terbaru HARUS sudah berstatus 'CLOSED'
        if (latestTicket.status !== 'CLOSED') {
            return jsonResponse(
                {
                    success: false,
                    message: "Hapus duplikat hanya bisa dilakukan jika tiket terbaru sudah berstatus 'CLOSED'.",
                },
                { status: 403 }
            ); // 403 Forbidden
        }

        // 3. Hapus semua tiket lain (yang lebih lama) untuk customer & service ini
        const deleteStmt = env.DB.prepare('DELETE FROM work_orders WHERE customer_id = ? AND service_id = ? AND incident != ?').bind(
            customerId,
            serviceId,
            latestTicket.incident
        );

        const { meta } = await deleteStmt.run();

        return jsonResponse({
            success: true,
            message: `Proses selesai. ${meta.changes} tiket duplikat telah dihapus.`,
        });
    } catch (err) {
        console.error('Gagal menghapus duplikat:', err);
        return jsonResponse({ success: false, error: 'Terjadi kesalahan pada server.', details: err.message }, { status: 500 });
    }
});

// =================================================================================
// 🔚 AKHIR DARI FUNGSI BARU
// =================================================================================

/**
 * ENDPOINT: Menerima data alamat dan menyimpan ke tabel 'data_layanan' di D1.
 * Metode: POST
 * URL: /addresses
 */
router.post('/save-addresses', async (request, env) => {
    if (!env.DB) {
        return json({ error: 'Database not configured' }, { status: 500 });
    }

    try {
        const data = await request.json();

        if (!Array.isArray(data) || data.length === 0) {
            return json({ success: false, message: 'Data harus berupa array dan tidak boleh kosong.' }, { status: 400 });
        }

        // Menggunakan 'REPLACE INTO' sebagai pengganti 'ON DUPLICATE KEY UPDATE' di D1
        // Pastikan 'service_no' adalah PRIMARY KEY di tabel 'data_layanan'
        const query = 'REPLACE INTO data_layanan (service_no, alamat) VALUES (?, ?);';

        // Siapkan batch statements untuk efisiensi
        const stmts = data
            .filter((row) => row.service_no) // Hanya proses baris yang memiliki service_no
            .map((row) => env.DB.prepare(query).bind(row.service_no, row.alamat || null));

        if (stmts.length === 0) {
            return json({ success: true, message: 'Tidak ada data valid untuk diproses.' });
        }

        await env.DB.batch(stmts);

        return json(
            {
                success: true,
                message: `${stmts.length} baris data alamat berhasil disimpan.`,
            },
            { status: 201 }
        );
    } catch (err) {
        console.error('Gagal menyimpan ke data_layanan D1:', err);
        return json({ success: false, error: err.message }, { status: 500 });
    }
});

/**
 * ENDPOINT: Menyinkronkan semua alamat dari 'data_layanan' ke 'work_orders' di D1
 * Metode: POST
 * URL: /sync-all-addresses
 */
router.post('/sync-all', async (request, env) => {
    if (!env.DB) {
        return json({ error: 'Database not configured' }, { status: 500 });
    }

    try {
        // LANGKAH 1: Ambil semua data alamat yang relevan dari 'data_layanan'
        const { results: addressesToSync } = await env.DB.prepare(
            'SELECT service_no, alamat FROM data_layanan WHERE service_no IS NOT NULL AND alamat IS NOT NULL'
        ).all();

        if (!addressesToSync || addressesToSync.length === 0) {
            return json({ success: true, message: 'Tidak ada alamat baru untuk disinkronkan.' });
        }

        // LANGKAH 2: Buat batch UPDATE statement untuk 'work_orders'
        // D1 tidak mendukung 'UPDATE JOIN', jadi kita lakukan secara manual
        const stmts = addressesToSync.map((addr) =>
            env.DB.prepare('UPDATE work_orders SET alamat = ? WHERE service_no = ?').bind(addr.alamat, addr.service_no)
        );

        const batchResult = await env.DB.batch(stmts);

        // Hitung jumlah update yang berhasil
        const successfulUpdates = batchResult.filter((r) => r.success && r.meta.changes > 0).length;

        return json({
            success: true,
            message: `Sinkronisasi selesai. ${successfulUpdates} alamat di work_orders berhasil diperbarui.`,
        });
    } catch (err) {
        console.error('Gagal sinkronisasi alamat di D1:', err);
        return json({ success: false, error: 'Terjadi kesalahan pada server saat sinkronisasi.' }, { status: 500 });
    }
});

/**
 * ENDPOINT: Menerima data Work Order, mengisi Sektor dan Korlap secara otomatis, dan menyinkronkan alamat.
 * Metode: POST
 * URL: /mypost
 */
router.post('/mypost', async (request, env) => {
    if (!env.DB) {
        return json({ success: false, error: 'Database connection not configured.' }, { status: 500 });
    }

    const data = await request.json();
    if (!Array.isArray(data) || data.length === 0) {
        return json({ success: false, message: 'Data harus berupa array dan tidak boleh kosong.' }, { status: 400 });
    }

    const columns = [
        'incident',
        'ticket_id_gamas',
        'external_ticket_id',
        'customer_id',
        'customer_name',
        'service_id',
        'service_no',
        'summary',
        'description_assignment',
        'reported_date',
        'reported_by',
        'reported_priority',
        'source_ticket',
        'channel',
        'contact_phone',
        'contact_name',
        'contact_email',
        'status',
        'status_date',
        'booking_date',
        'resolve_date',
        'date_modified',
        'last_update_worklog',
        'closed_by',
        'closed_reopen_by',
        'guarantee_status',
        'ttr_customer',
        'ttr_agent',
        'ttr_mitra',
        'ttr_nasional',
        'ttr_pending',
        'ttr_region',
        'ttr_witel',
        'ttr_end_to_end',
        'owner_group',
        'owner',
        'witel',
        'workzone',
        'region',
        'subsidiary',
        'territory_near_end',
        'territory_far_end',
        'customer_segment',
        'customer_type',
        'customer_category',
        'service_type',
        'slg',
        'technology',
        'lapul',
        'gaul',
        'onu_rx',
        'pending_reason',
        'incident_domain',
        'symptom',
        'hierarchy_path',
        'solution',
        'description_actual_solution',
        'kode_produk',
        'perangkat',
        'technician',
        'device_name',
        'sn_ont',
        'tipe_ont',
        'manufacture_ont',
        'impacted_site',
        'cause',
        'resolution',
        'worklog_summary',
        'classification_flag',
        'realm',
        'related_to_gamas',
        'tsc_result',
        'scc_result',
        'note',
        'notes_eskalasi',
        'rk_information',
        'external_ticket_tier_3',
        'classification_path',
        'urgency',
        'alamat',
        'korlap',
        'sektor',
    ];

    let totalAddressUpdates = 0;
    let workOrderProcessed = 0;

    try {
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

            if (row.workzone) {
                if (workzoneToSektorMap[row.workzone]) {
                    row.sektor = workzoneToSektorMap[row.workzone];
                }
                if (workzoneToKorlapMap[row.workzone]) {
                    row.korlap = workzoneToKorlapMap[row.workzone];
                }
            }

            const validKeys = Object.keys(row).filter((key) => columns.includes(key));
            const values = validKeys.map((key) => row[key]);

            const query = `REPLACE INTO work_orders (${validKeys.join(', ')}) VALUES (${validKeys.map(() => '?').join(', ')});`;
            workOrderStmts.push(env.DB.prepare(query).bind(...values));
            workOrderProcessed++;
        }

        if (workOrderStmts.length > 0) {
            await env.DB.batch(workOrderStmts);
        }

        const { results: addressesToSync } = await env.DB.prepare(
            "SELECT service_no, alamat FROM data_layanan WHERE service_no IN (SELECT service_no FROM work_orders WHERE alamat IS NULL OR alamat = '') AND alamat IS NOT NULL"
        ).all();

        if (addressesToSync && addressesToSync.length > 0) {
            const syncStmts = addressesToSync.map((addr) =>
                env.DB.prepare('UPDATE work_orders SET alamat = ? WHERE service_no = ?').bind(addr.alamat, addr.service_no)
            );

            const batchResult = await env.DB.batch(syncStmts);
            totalAddressUpdates = batchResult.reduce((sum, r) => sum + (r.success ? r.meta.changes : 0), 0);
        }

        return json(
            {
                success: true,
                message: `Proses selesai. ${workOrderProcessed} work order diproses. ${totalAddressUpdates} alamat berhasil diperbarui.`,
            },
            { status: 201 }
        );
    } catch (err) {
        console.error('Gagal memproses data dan sinkronisasi:', err);
        return json({ success: false, error: 'Gagal memproses data.', details: err.message }, { status: 500 });
    }
});

/**
 * ENDPOINT: Menerima data Work Order dan menyinkronkan alamat.
 * Metode: POST
 * URL: /sync-work-orders (sebelumnya /mypost)
 */
router.post('/sync-work-orders', async (request, env) => {
    if (!env.DB) {
        return json({ success: false, error: 'Database connection not configured.' }, { status: 500 });
    }

    const data = await request.json();
    if (!Array.isArray(data) || data.length === 0) {
        return json({ success: false, message: 'Data harus berupa array dan tidak boleh kosong.' }, { status: 400 });
    }

    const columns = [
        'incident',
        'ticket_id_gamas',
        'external_ticket_id',
        'customer_id',
        'customer_name',
        'service_id',
        'service_no',
        'summary',
        'description_assignment',
        'reported_date',
        'reported_by',
        'reported_priority',
        'source_ticket',
        'channel',
        'contact_phone',
        'contact_name',
        'contact_email',
        'status',
        'status_date',
        'booking_date',
        'resolve_date',
        'date_modified',
        'last_update_worklog',
        'closed_by',
        'closed_reopen_by',
        'guarantee_status',
        'ttr_customer',
        'ttr_agent',
        'ttr_mitra',
        'ttr_nasional',
        'ttr_pending',
        'ttr_region',
        'ttr_witel',
        'ttr_end_to_end',
        'owner_group',
        'owner',
        'witel',
        'workzone',
        'region',
        'subsidiary',
        'territory_near_end',
        'territory_far_end',
        'customer_segment',
        'customer_type',
  _category',
        'service_type',
        'slg',
        'technology',
        'lapul',
        'gaul',
        'onu_rx',
        'pending_reason',
        'incident_domain',
        'symptom',
        'hierarchy_path',
        'solution',
        'description_actual_solution',
        'kode_produk',
        'perangkat',
        'technician',
        'device_name',
        'sn_ont',
        'tipe_ont',
        'manufacture_ont',
        'impacted_site',
        'cause',
        'resolution',
        'worklog_summary',
        'classification_flag',
        'realm',
        'related_to_gamas',
        'tsc_result',
        'scc_result',
        'note',
        'notes_eskalasi',
        'rk_information',
        'external_ticket_tier_3',
        'classification_path',
        'urgency',
        'alamat',
        'korlap',
    ];

    let totalUpdates = 0;
    let workOrderProcessed = 0;

    // [PENAMBAHAN] Daftar untuk melacak data yang dilewati/ditolak
    const skippedIncidents = [];
    const invalidIncidentValues = ['BOOKING DATE', 'CLOSED / REOPEN by'];

    try {
        const workOrderStmts = [];
        for (const row of data) {
            const incidentValue = row.incident ? String(row.incident).trim() : null;

            // [PENAMBAHAN] Logika validasi untuk kolom 'incident'
            if (!incidentValue || invalidIncidentValues.includes(incidentValue)) {
                skippedIncidents.push({
                    incident: row.incident || 'N/A',
                    reason: 'Nilai incident tidak valid atau kosong.',
                });
                continue; // Lewati baris data ini dan lanjut ke berikutnya
            }

            const validKeys = Object.keys(row).filter((key) => columns.includes(key));
            const values = validKeys.map((key) => row[key]);

            const query = `REPLACE INTO work_orders (${validKeys.join(', ')}) VALUES (${validKeys.map(() => '?').join(', ')});`;
            workOrderStmts.push(env.DB.prepare(query).bind(...values));
            workOrderProcessed++;
        }

        if (workOrderStmts.length > 0) {
            await env.DB.batch(workOrderStmts);
        }

        // LANGKAH 2: Sinkronisasi alamat (tetap sama)
        const { results: addressesToSync } = await env.DB.prepare(
            'SELECT service_no, alamat FROM data_layanan WHERE service_no IN (SELECT service_no FROM work_orders WHERE alamat IS NULL) AND alamat IS NOT NULL'
        ).all();

        if (addressesToSync && addressesToSync.length > 0) {
            const syncStmts = addressesToSync.map((addr) =>
                env.DB.prepare('UPDATE work_orders SET alamat = ? WHERE service_no = ?').bind(addr.alamat, addr.service_no)
            );

            const batchResult = await env.DB.batch(syncStmts);
            totalUpdates = batchResult.reduce((count, r) => count + (r.success ? r.meta.changes : 0), 0);
        }

        // [PENAMBAHAN] Memberikan respons yang jauh lebih informatif
        return json(
            {
                success: true,
                message: `Proses selesai. ${workOrderProcessed} work order berhasil diproses. ${skippedIncidents.length} data dilewati. ${totalUpdates} alamat diperbarui.`,
                processed_count: workOrderProcessed,
                skipped_count: skippedIncidents.length,
                address_synced_count: totalUpdates,
                skipped_data: skippedIncidents, // Melampirkan detail data yang dilewati
            },
            { status: 200 }
        ); // Status 200 OK lebih cocok untuk hasil campuran
    } catch (err) {
        console.error('Gagal memproses data dan sinkronisasi:', err);
        return json({ success: false, error: 'Gagal memproses data.', details: err.message }, { status: 500 });
    }
});

/**
 * ENDPOINT: Melihat semua data Work Order dan menandai duplikat.
 * Duplikat diidentifikasi berdasarkan kombinasi 'service_id' dan tanggal 'reported_date'.
 * Data yang dianggap "asli" adalah yang paling baru diubah (date_modified).
 * Metode: GET
 * URL: /work-orders atau /view-mysql
 */
router.get('/view-mysql', async (request, env) => {
    try {
        const query = `
      SELECT
        *,
        (CASE
          WHEN ROW_NUMBER() OVER(
            PARTITION BY service_id, DATE(reported_date)
            ORDER BY date_modified DESC
          ) > 1 THEN 1
          ELSE 0
        END) AS is_duplicate
      FROM
        work_orders
      WHERE
        service_id IS NOT NULL AND service_id != ''
      ORDER BY
        incident DESC;
    `;

        const stmt = env.DB.prepare(query);

        const { results } = await stmt.all();

        return json({
            success: true,
            count: results.length,
            data: results,
        });
    } catch (err) {
        console.error('Gagal mengambil data dari D1:', err);
        return json(
            {
                success: false,
                error: 'Gagal mengambil data dari database.',
                details: err.message,
            },
            { status: 500 }
        );
    }
});

/**
 * ENDPOINT 3 (MODIFIKASI D1): Menerima data Work Order dan menyimpan ke D1 (UPSERT).
 * Metode: POST
 * URL: /work-orders
 */
router.post('/work-orders', async (request, env) => {
    try {
        const data = await request.json();
        if (!Array.isArray(data) || data.length === 0) {
            return jsonResponse({ success: false, message: 'Input data harus berupa array dan tidak boleh kosong.' }, { status: 400 });
        }

        const columns = [
            'incident',
            'ticket_id_gamas',
            'external_ticket_id',
            'customer_id',
            'customer_name',
            'service_id',
            'service_no',
            'summary',
            'description_assignment',
            'reported_date',
            'reported_by',
            'reported_priority',
            'source_ticket',
            'channel',
            'contact_phone',
            'contact_name',
            'contact_email',
            'status',
            'status_date',
            'booking_date',
            'resolve_date',
            'date_modified',
            'last_update_worklog',
            'closed_by',
            'closed_reopen_by',
            'guarantee_status',
            'ttr_customer',
            'ttr_agent',
            'ttr_mitra',
            'ttr_nasional',
            'ttr_pending',
            'ttr_region',
            'ttr_witel',
            'ttr_end_to_end',
            'owner_group',
            'owner',
            'witel',
            'workzone',
            'region',
            'subsidiary',
            'territory_near_end',
            'territory_far_end',
            'customer_segment',
            'customer_type',
          	'customer_category',
          	'service_type',
          	'slg',
          	'technology',
          	'lapul',
          	'gaul',
          	'onu_rx',
          	'pending_reason',
          	'incident_domain',
          	'symptom',
          	'hierarchy_path',
          	'solution',
          	'description_actual_solution',
          	'kode_produk',
          	'perangkat',
          	'technician',
          	'device_name',
          	'sn_ont',
          	'tipe_ont',
          	'manufacture_ont',
          	'impacted_site',
          	'cause',
          	'resolution',
          	'worklog_summary',
          	'classification_flag',
          	'realm',
          	'related_to_gamas',
          	'tsc_result',
          	'scc_result',
          	'note',
          	'notes_eskalasi',
          	'rk_information',
          	'external_ticket_tier_3',
          	'classification_path',
          	'urgency',
          	'alamat',
          	'korlap',
        ];

        const stmts = data
            .filter((row) => row.incident) // Wajib ada primary key
            .map((row) => {
                // ✅ LOGIKA BACKEND: Jika reported_date tidak ada, buat baru.
                if (!row.reported_date) {
                    row.reported_date = new Date().toISOString();
                }
                // Pastikan status awal adalah 'open' atau sejenisnya jika belum ada
                if (!row.status) {
                    row.status = 'open';
                }

                const validKeys = Object.keys(row).filter((key) => columns.includes(key));
                const values = validKeys.map((key) => row[key]);
                const query = `REPLACE INTO work_orders (${validKeys.join(', ')}) VALUES (${'?'.repeat(validKeys.length).split('').join(',')});`;
                return env.DB.prepare(query).bind(...values);
            });

        if (stmts.length > 0) {
            await env.DB.batch(stmts);
        }

        return jsonResponse({ success: true, message: `${stmts.length} work order berhasil diproses.` }, { status: 201 });
    } catch (err) {
        console.error('Gagal menyimpan work orders:', err);
        return jsonResponse({ success: false, error: 'Gagal memproses data.', details: err.message }, { status: 500 });
    }
});

/**
 * ENDPOINT: Menghapus Work Order dari D1
 * Metode: DELETE
 * URL: /work-orders/:incident
 */
router.delete('/work-orders/:incident', async (request, env) => {
    // 1. Validasi Koneksi Database (Sudah bagus)
    if (!env.DB) {
        console.error('Koneksi D1 Database tidak terkonfigurasi di env.');
        return json({ success: false, error: 'Konfigurasi server bermasalah.' }, { status: 500 });
    }

    const { incident } = request.params;

    // 2. [PENYEMPURNAAN] Validasi Input dari Client
    // Pastikan parameter 'incident' tidak kosong atau tidak valid.
    if (!incident || incident.trim() === '') {
        return json({ success: false, error: "Parameter 'incident' tidak boleh kosong." }, { status: 400 }); // 400 Bad Request
    }

    try {
        // 3. Eksekusi Query dengan Prepared Statement (Sudah bagus)
        const stmt = env.DB.prepare('DELETE FROM work_orders WHERE incident = ?').bind(incident);
        const { meta } = await stmt.run();

        // 4. [PENYEMPURNAAN] Cek Hasil Operasi
        // D1 `.run()` akan melempar error jika query gagal, jadi kita hanya perlu cek
        // jumlah baris yang berubah (meta.changes). Jika 0, berarti data tidak ditemukan.
        if (meta.changes === 0) {
            return json(
                { success: false, message: `Work order dengan incident '${incident}' tidak ditemukan.` },
                { status: 404 } // 404 Not Found
            );
        }

        // Jika berhasil (meta.changes > 0)
        return json({
            success: true,
            message: `Work order dengan incident '${incident}' berhasil dihapus.`,
            changes: meta.changes,
        });
    } catch (err) {
        // 5. Penanganan Error Internal (Sudah bagus)
        console.error(`Gagal menghapus work order '${incident}':`, err);
        return json(
            { success: false, error: 'Terjadi kesalahan internal pada server.' },
            { status: 500 } // 500 Internal Server Error
        );
    }
});

/**
 * ENDPOINT: Mengambil daftar workzone unik dari D1
 * Metode: GET
 * URL: /workzones
 */
router.get('/workzones', async (request, env) => {
    if (!env.DB) {
        return json({ error: 'Database not configured' }, { status: 500 });
    }
    try {
        const stmt = env.DB.prepare('SELECT DISTINCT workzone FROM workzone_details ORDER BY workzone ASC');
        const { results } = await stmt.all();
        // Kirim sebagai array ["BLB", "BTU", "GDG", ...]
        return json(results.map((w) => w.workzone));
    } catch (err) {
        console.error('Gagal mengambil daftar workzone:', err);
        return json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
    }
});

/**
 * ENDPOINT: Mengambil peta workzone beserta korlap dan sektor.
 * URL: /workzone-map
 */
router.get('/workzone-map', async (request, env) => {
    try {
        // --- PERBAIKAN DI SINI ---
        // Query disederhanakan karena data korlap sudah berada dalam satu kolom.
        // Kita hanya perlu mengambil kolomnya langsung dan mengganti namanya (alias) menjadi 'korlaps'.
        const stmt = env.DB.prepare(`
      SELECT
        workzone,
        sektor,
        korlap_username AS korlaps
      FROM workzone_details
      ORDER BY workzone
    `);

        const { results } = await stmt.all();
        return jsonResponse(results);
    } catch (err) {
        console.error('Gagal mengambil peta workzone:', err);
        return jsonResponse({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
    }
});

/**
 * ENDPOINT: Mengedit Work Order.
 * Metode: PUT
 * URL: /work-orders/:incident
 */
// --- PERBAIKAN: Semua kolom sekarang diizinkan untuk di-update ---
const ALLOWED_UPDATE_KEYS = [
    'incident',
    'korlap',
    'sektor',
    'workzone',
    'status',
    'summary',
    'reported_date',
    'ticket_id_gamas',
    'external_ticket_id',
    'customer_id',
    'customer_name',
    'service_id',
    'service_no',
    'description_assignment',
    'reported_by',
    'reported_priority',
    'source_ticket',
    'channel',
    'contact_phone',
    'contact_name',
    'contact_email',
    'status_date',
    'booking_date',
    'resolve_date',
    'date_modified',
    'last_update_worklog',
    'closed_by',
    'closed_reopen_by',
    'guarantee_status',
    'ttr_customer',
    'ttr_agent',
    'ttr_mitra',
    'ttr_nasional',
    'th_pending',
    'th_region',
    'th_witel',
    'ttr_end_to_end',
  	'owner_group',
  	'owner',
  	'witel',
  	'region',
  	'subsidiary',
  	'territory_near_end',
  	'territory_far_end',
  	'customer_segment',
  	'customer_type',
  	'customer_category',
  	'service_type',
  	'slg',
  	'technology',
  	'lapul',
  	'gaul',
  	'onu_rx',
  	'pending_reason',
  	'incident_domain',
  	'symptom',
  	'hierarchy_path',
  	'solution',
  	'description_actual_solution',
  	'kode_produk',
  	'perangkat',
  	'technician',
  	'device_name',
  	'sn_ont',
  	'tipe_ont',
  	'manufacture_ont',
  	'impacted_site',
  	'cause',
  	'resolution',
  	'worklog_summary',
  	'classification_flag',
  	'realm',
  	'related_to_gamas',
  	'toc_result',
  	'scc_result',
  	'note',
  	'notes_eskalasi',
  	'rk_information',
  	'external_ticket_tier_3',
  	'classification_path',
  	'urgency',
  	'alamat',
];

router.put('/work-orders/:incident', async (request, env) => {
    const { incident } = request.params;
    const data = await request.json();

    try {
        const keysToUpdate = Object.keys(data).filter(
            (key) => ALLOWED_UPDATE_KEYS.includes(key) && key !== 'incident' // Pastikan incident tidak di-update
        );

        if (keysToUpdate.length === 0) {
            return jsonResponse({ success: false, message: 'Tidak ada data valid untuk diperbarui.' }, { status: 400 });
        }

        const setClauses = keysToUpdate.map((k) => `${k} = ?`).join(', ');
        const values = keysToUpdate.map((key) => data[key]);

        const updateStmt = env.DB.prepare(`UPDATE work_orders SET ${setClauses} WHERE incident = ?`).bind(...values, incident);
        await updateStmt.run();

        if (data.service_no) {
            const { results: layanan } = await env.DB.prepare('SELECT alamat FROM data_layanan WHERE service_no = ?').bind(data.service_no).all();
            if (layanan && layanan.length > 0 && layanan[0].alamat) {
                await env.DB.prepare('UPDATE work_orders SET alamat = ? WHERE incident = ?').bind(layanan[0].alamat, incident).run();
            }
        }

        const { results: updatedRows } = await env.DB.prepare('SELECT * FROM work_orders WHERE incident = ?').bind(incident).all();
        if (updatedRows.length === 0) {
            return jsonResponse({ success: false, message: 'Work order tidak ditemukan setelah update.' }, { status: 404 });
        }

        return jsonResponse({ success: true, message: `Work order berhasil diperbarui.`, data: updatedRows[0] });
    } catch (err) {
        console.error('Gagal mengedit work order:', err);
        if (err.cause) console.error('Penyebab Error:', err.cause);
        return jsonResponse({ success: false, error: 'Terjadi kesalahan pada server.', message: err.message }, { status: 500 });
    }
});

/**
 * ENDPOINT: Memindahkan WO ke Laporan di D1
 * Metode: POST
 * URL: /work-orders/:incident/complete
 */
router.post('/work-orders/:incident/complete', async (request, env) => {
    const { incident } = request.params;
    try {
        const { results } = await env.DB.prepare('SELECT * FROM work_orders WHERE incident = ?').bind(incident).all();
        if (results.length === 0) {
            return jsonResponse({ success: false, message: 'Work order tidak ditemukan.' }, { status: 404 });
        }

        const workOrder = results[0];

        // ✅ LOGIKA BACKEND: Atur status dan waktu selesai saat tiket ditutup.
        workOrder.status = 'CLOSED'; // Atau 'resolved', sesuaikan dengan sistem Anda
        workOrder.resolve_date = new Date().toISOString();
        workOrder.date_modified = new Date().toISOString();

        const columns = Object.keys(workOrder);
        const values = Object.values(workOrder);

        const stmts = [
            env.DB.prepare(`REPLACE INTO reports (${columns.join(', ')}) VALUES (${'?'.repeat(columns.length).split('').join(',')})`).bind(
                ...values
            ),
            env.DB.prepare('DELETE FROM work_orders WHERE incident = ?').bind(incident),
        ];
        await env.DB.batch(stmts);

        return jsonResponse({ success: true, message: 'Work order telah dipindahkan ke laporan.' });
    } catch (err) {
        console.error('Gagal menyelesaikan work order:', err);
        return jsonResponse({ success: false, error: err.message }, { status: 500 });
    }
});

/**
 * ENDPOINT: Mengambil data dari tabel Laporan di D1
 * Metode: GET
 * URL: /reports
 */
router.get('/reports', async (request, env) => {
    if (!env.DB) {
        return json({ error: 'Database not configured' }, { status: 500 });
    }
    try {
        const stmt = env.DB.prepare('SELECT * FROM reports ORDER BY reported_date DESC');
        const { results } = await stmt.all();
        return json({ success: true, data: results });
    } catch (err) {
        console.error('Gagal mengambil data laporan:', err);
        return json({ success: false, error: err.message }, { status: 500 });
    }
});

/**
 * ENDPOINT: Mengembalikan laporan ke work_orders di D1
 * Metode: POST
 * URL: /reports/:incident/reopen
 */
router.post('/reports/:incident/reopen', async (request, env) => {
    const { incident } = request.params;
    try {
        const { results } = await env.DB.prepare('SELECT * FROM reports WHERE incident = ?').bind(incident).all();
        if (results.length === 0) {
            return jsonResponse({ success: false, message: 'Laporan tidak ditemukan.' }, { status: 404 });
        }
        const reportData = results[0];

        // ✅ LOGIKA BACKEND: Buka kembali tiket, ubah status & hapus waktu selesai.
        reportData.status = 'OPEN'; // Atau 'open'
        reportData.resolve_date = null; // TTR akan berjalan lagi di frontend
        reportData.date_modified = new Date().toISOString();

        const columns = Object.keys(reportData);
        const values = Object.values(reportData);

        const stmts = [
            env.DB.prepare(`REPLACE INTO work_orders (${columns.join(', ')}) VALUES (${'?'.repeat(columns.length).split('').join(',')})`).bind(
                ...values
            ),
            env.DB.prepare('DELETE FROM reports WHERE incident = ?').bind(incident),
        ];
        await env.DB.batch(stmts);

        return jsonResponse({ success: true, message: 'Work order telah dibuka kembali.' });
    } catch (err) {
        console.error('Gagal membuka kembali work order:', err);
        return jsonResponse({ success: false, error: err.message }, { status: 500 });
    }
});

/**
 * Fallback untuk menangani semua rute lain yang tidak cocok.
 * Mengembalikan response 404 Not Found.
 */
router.all('*', () => new Response('404, Not Found.', { status: 404 }));

/**
 * Export router untuk ditangani oleh Cloudflare Workers.
 */
export default {
    async fetch(request, env, ctx) {
        const response = await router.handle(request, env, ctx);
        return withCORS(response); // <-- Tambahkan header CORS ke semua response
    },
};