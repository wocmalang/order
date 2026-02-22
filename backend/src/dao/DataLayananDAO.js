export class DataLayananDAO {
  constructor(db) { this.db = db; }

  async getAddressesByserviceNo(serviceNo) {
    if (!serviceNo || serviceNo.length === 0) return [];
    
    const placeholders = serviceNo.map(() => '?').join(',');
    const query = `SELECT service_no, alamat FROM data_layanan WHERE service_no IN (${placeholders})`;
    
    const { results } = await this.db.prepare(query).bind(...serviceNo).all();
    return results;
  }
}