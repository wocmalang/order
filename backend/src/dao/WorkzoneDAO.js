export class WorkzoneDAO {
  constructor(db) { this.db = db; }

  async getAll() {
    const query = 'SELECT workzone, sektor, korlap_username AS korlaps FROM workzone_details';
    const { results } = await this.db.prepare(query).all();
    return results;
  }
}