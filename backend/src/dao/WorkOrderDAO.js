import { WorkOrder } from '../entities/WorkOrder.js';

export class WorkOrderDAO {
  constructor(db) { this.db = db; }

  async getAll() {
    const { results } = await this.db.prepare('SELECT * FROM work_orders ORDER BY incident DESC').all();
    return results;
  }

  async findById(incident) {
    const { results } = await this.db.prepare('SELECT * FROM work_orders WHERE incident = ?').bind(incident).all();
    return results[0];
  }

  async insert(workOrders) {
    
    for (let i = 0; i < workOrders.length; i++) {
      const wo = workOrders[i];
      const cleanData = WorkOrder.filterData(wo);
      const keys = Object.keys(cleanData);
      const values = Object.values(cleanData).map(v => v === undefined ? null : v);

      if (keys.length === 0) continue;

      const placeholders = new Array(keys.length).fill('?').join(',');
      const query = `INSERT OR REPLACE INTO work_orders (${keys.join(', ')}) VALUES (${placeholders})`;

      try {
        await this.db.prepare(query).bind(...values).run();
        
        
      } catch (err) {
        console.error(`[DAO] ERROR di baris ${i + 1} (${wo.incident}):`, err.message);
        throw err; // Lempar error agar controller bisa menangkap
      }
    }
    console.log(`[DAO] Selesai! Berhasil memasukkan ${workOrders.length} data.`);
  }

  async update(incident, data) {
    const cleanData = WorkOrder.filterData(data);
    delete cleanData.incident;
    const keys = Object.keys(cleanData);
    if (keys.length === 0) return null;

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = Object.values(cleanData).map(v => v === undefined ? null : v);
    
    await this.db.prepare(`UPDATE work_orders SET ${setClause} WHERE incident = ?`)
      .bind(...values, incident)
      .run();
      
    return this.findById(incident);
  }

  async delete(incident) {
    await this.db.prepare('DELETE FROM work_orders WHERE incident = ?').bind(incident).run();
  }

  stmtInsert(data) {
    const cleanData = WorkOrder.filterData(data);
    const keys = Object.keys(cleanData);
    
    // PERBAIKAN: Ubah undefined menjadi null agar tidak error 500
    const values = Object.values(cleanData).map(v => v === undefined ? null : v);

    const placeholders = new Array(keys.length).fill('?').join(',');
    const query = `INSERT OR REPLACE INTO work_orders (${keys.join(', ')}) VALUES (${placeholders})`;
    
    return this.db.prepare(query).bind(...values);
  }

  // Helper untuk batching yang benar-benar kecil jika dibutuhkan di tempat lain
  stmtDelete(incident) {
    return this.db.prepare('DELETE FROM work_orders WHERE incident = ?').bind(incident);
  }
}