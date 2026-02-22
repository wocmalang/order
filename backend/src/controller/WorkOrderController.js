import { WorkOrderDAO } from '../dao/WorkOrderDAO.js';
import { WorkzoneDAO } from '../dao/WorkzoneDAO.js';
import { DataLayananDAO } from '../dao/DataLayananDAO.js';
import { ReportDAO } from '../dao/ReportDAO.js';
import { WorkOrder } from '../entities/WorkOrder.js';
import { Report } from '../entities/Report.js'; // Pastikan import entity Report
import { json } from 'itty-router';

export class WorkOrderController {
  
  // GET /view-d1
  async viewAll(req, env) {
    const dao = new WorkOrderDAO(env.DB);
    const data = await dao.getAll();
    return json({ success: true, count: data.length, data });
  }

  // POST /mypost
  async create(req, env) {
    const rawData = await req.json();
    if (!Array.isArray(rawData)) return json({ success: false, message: 'Harus array' }, { status: 400 });

    const woDao = new WorkOrderDAO(env.DB);
    const wzDao = new WorkzoneDAO(env.DB);
    const dlDao = new DataLayananDAO(env.DB);

    // 1. Ambil Data Referensi
    const serviceNo = rawData.map(r => r.service_no).filter(Boolean);
    const [workzones, addresses] = await Promise.all([
      wzDao.getAll(),
      dlDao.getAddressesByserviceNo(serviceNo)
    ]);

    // 2. Buat Map Referensi
    const wzMap = {}; 
    const klMap = {};
    workzones.forEach(w => { 
      wzMap[w.workzone] = w.sektor; 
      // Penting: Ambil dari properti 'korlaps' (alias dari DAO)
      klMap[w.workzone] = w.korlaps; 
    });

    const addrMap = {};
    addresses.forEach(a => { addrMap[a.service_no] = a.alamat; });

    // 3. Proses Data (Sync Logic)
    const processedData = rawData.map(row => {
      // A. Logic Alamat: Master Data SELALU MENIMPA input manual (Sync Priority)
      if (row.service_no && addrMap[row.service_no]) {
        row.alamat = addrMap[row.service_no];
      }

      // row.status = 'OPEN';

      // B. Logic Workzone
      if (row.workzone) {
        if (wzMap[row.workzone]) row.sektor = wzMap[row.workzone];
        if (klMap[row.workzone]) row.korlap = klMap[row.workzone];
      }

      return new WorkOrder(row);
    });

    // 4. Simpan ke DB
    await woDao.insert(processedData);
    return json({ success: true }, { status: 201 });
  }

  // PUT /work-orders/:incident
  async update(req, env) {
    const { incident } = req.params;
    const data = await req.json();
    const dao = new WorkOrderDAO(env.DB);
    
    const result = await dao.update(incident, data);
    return json({ success: true, data: result });
  }

  // DELETE /work-orders/:incident
  async delete(req, env) {
    const { incident } = req.params;
    const dao = new WorkOrderDAO(env.DB);
    await dao.delete(incident);
    return json({ success: true });
  }

  // GET /workzone-map
  async getWorkzoneMap(req, env) {
    const dao = new WorkzoneDAO(env.DB);
    const data = await dao.getAll();
    return json(data);
  }

  // POST /work-orders/:incident/complete
  async complete(req, env) {
    const { incident } = req.params;
    const woDao = new WorkOrderDAO(env.DB);
    const reportDao = new ReportDAO(env.DB);

    try {
      // 1. Ambil data WO terakhir
      const woData = await woDao.findById(incident);
      if (!woData) return json({ success: false, message: 'WO tidak ditemukan.' }, { status: 404 });

      // 2. Convert ke Entity Report (Otomatis status CLOSED & resolve_date terisi)
      const reportEntity = new Report(woData);

      // 3. TRANSAKSI ATOMIK (Pindah Data)
      await env.DB.batch([
        reportDao.stmtInsert(reportEntity), // Masuk Reports
        woDao.stmtDelete(incident)          // Hapus WO
      ]);

      return json({ success: true, message: 'Ticket Closed' });
    } catch (err) {
      return json({ success: false, error: err.message }, { status: 500 });
    }
  }
}