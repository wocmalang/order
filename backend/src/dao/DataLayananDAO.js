export class DataLayananDAO {
  constructor(db) { this.db = db; }

  async getAddressesByserviceNo(serviceNo) {
    if (!serviceNo || serviceNo.length === 0) return [];
    
    const placeholders = serviceNo.map(() => '?').join(',');
    const query = `SELECT service_no, alamat FROM data_layanan WHERE service_no IN (${placeholders})`;
    
    const { results } = await this.db.prepare(query).bind(...serviceNo).all();
    return results;
  }
  async saveBatch(data) {
    const stmts = [];
    let processedCount = 0;

    for (const row of data) {
      if (!row.service_no || !row.alamat) continue;
      
      const query = `
        INSERT INTO data_layanan (service_no, alamat) 
        VALUES (?, ?) 
        ON CONFLICT(service_no) DO UPDATE SET alamat = excluded.alamat;
      `;
      
      stmts.push(this.db.prepare(query).bind(row.service_no, row.alamat));
      processedCount++;
    }

    if (stmts.length > 0) {
      await this.db.batch(stmts);
    }
    
    return processedCount;
  }
}