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
    const stmts = [];
    for (const wo of workOrders) {
      stmts.push(this.stmtInsert(wo));
    }
    if (stmts.length > 0) await this.db.batch(stmts);
  }

  async update(incident, data) {
    const cleanData = WorkOrder.filterData(data);
    delete cleanData.incident;

    const keys = Object.keys(cleanData);
    if (keys.length === 0) return null;

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    await this.db.prepare(`UPDATE work_orders SET ${setClause} WHERE incident = ?`)
      .bind(...Object.values(cleanData), incident)
      .run();
      
    return this.findById(incident);
  }

  async delete(incident) {
    await this.stmtDelete(incident).run();
  }
  
  stmtInsert(data) {
    const cleanData = WorkOrder.filterData(data);
    const keys = Object.keys(cleanData);
    const values = Object.values(cleanData);
    // Gunakan OR REPLACE agar aman saat restore data
    const query = `INSERT OR REPLACE INTO work_orders (${keys.join(', ')}) VALUES (${'?'.repeat(keys.length).split('').join(',')})`;
    return this.db.prepare(query).bind(...values);
  }

  stmtDelete(incident) {
    return this.db.prepare('DELETE FROM work_orders WHERE incident = ?').bind(incident);
  }
}