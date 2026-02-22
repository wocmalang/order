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
    // Kita gunakan filterData dari WorkOrder karena strukturnya sama
    const cleanData = WorkOrder.filterData(data);
    const keys = Object.keys(cleanData);
    const values = Object.values(cleanData);
    
    const query = `INSERT OR REPLACE INTO reports (${keys.join(', ')}) VALUES (${'?'.repeat(keys.length).split('').join(',')})`;
    return this.db.prepare(query).bind(...values);
  }

  stmtDelete(incident) {
    return this.db.prepare('DELETE FROM reports WHERE incident = ?').bind(incident);
  }
}