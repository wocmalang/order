export class DataLayananDAO {
  constructor(db) { this.db = db; }

  async getAddressesByserviceNo(serviceNoArray) {
    if (!serviceNoArray || serviceNoArray.length === 0) return [];
    
    // Jika data terlalu banyak, kita pecah per 50 item agar tidak error
    const chunkSize = 50;
    let allResults = [];
    
    for (let i = 0; i < serviceNoArray.length; i += chunkSize) {
      const chunk = serviceNoArray.slice(i, i + chunkSize);
      const placeholders = chunk.map(() => '?').join(',');
      const query = `SELECT * FROM data_layanan WHERE service_no IN (${placeholders})`;
      
      const { results } = await this.db.prepare(query).bind(...chunk).all();
      allResults = [...allResults, ...results];
    }
    
    return allResults;
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