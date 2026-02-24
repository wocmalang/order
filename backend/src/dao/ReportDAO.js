import { WorkOrder } from '../entities/WorkOrder.js';

export class ReportDAO {
  constructor(db) { this.db = db; }

  async getAll() {
    const { results } = await this.db.prepare('SELECT * FROM reports ORDER BY resolve_date DESC').all();
    return results;
  }

  async findById(incident) {
    const { results } = await this.db.prepare('SELECT * FROM reports WHERE incident = ?').bind(incident).all();
    return results[0];
  }

  // --- HELPER UNTUK BATCH TRANSACTION ---

  stmtInsert(data) {
    const cleanData = WorkOrder.filterData(data);
    const keys = Object.keys(cleanData);
    
    // PERBAIKAN: Ubah undefined menjadi null
    const values = Object.values(cleanData).map(v => v === undefined ? null : v);
    
    const placeholders = new Array(keys.length).fill('?').join(',');
    const query = `INSERT OR REPLACE INTO reports (${keys.join(', ')}) VALUES (${placeholders})`;
    
    return this.db.prepare(query).bind(...values);
  }

  stmtDelete(incident) {
    return this.db.prepare('DELETE FROM reports WHERE incident = ?').bind(incident);
  }
}