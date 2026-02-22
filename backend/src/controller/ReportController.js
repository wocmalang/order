import { ReportDAO } from '../dao/ReportDAO.js';
import { WorkOrderDAO } from '../dao/WorkOrderDAO.js';
import { WorkOrder } from '../entities/WorkOrder.js';
import { json } from 'itty-router';

export class ReportController {
  
  // GET /reports
  async viewAll(req, env) {
    try {
      const dao = new ReportDAO(env.DB);
      const data = await dao.getAll();
      return json({ success: true, count: data.length, data });
    } catch (err) {
      return json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // POST /reports/:incident/reopen
  async reopen(req, env) {
    const { incident } = req.params;
    const reportDao = new ReportDAO(env.DB);
    const woDao = new WorkOrderDAO(env.DB);

    try {
      // 1. Cari data di Report
      const reportData = await reportDao.findById(incident);
      if (!reportData) return json({ success: false, message: 'Laporan tidak ditemukan.' }, { status: 404 });

      // 2. Siapkan data untuk balik ke WO (Status OPEN, reset tanggal resolve)
      const woEntity = new WorkOrder({
        ...reportData,
        status: 'OPEN',
        resolve_date: null,
        date_modified: new Date().toISOString()
      });

      // 3. TRANSAKSI ATOMIK (Balikin Data)
      await env.DB.batch([
        woDao.stmtInsert(woEntity),     // Masuk WO
        reportDao.stmtDelete(incident)  // Hapus Reports
      ]);

      return json({ success: true, message: 'Ticket Reopened' });
    } catch (err) {
      return json({ success: false, error: err.message }, { status: 500 });
    }
  }
}