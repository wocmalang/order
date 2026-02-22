export class UserDAO {
  constructor(db) { this.db = db; }

  async findByUsername(username) {
    const { results } = await this.db.prepare('SELECT * FROM users WHERE username = ?').bind(username).all();
    return results[0];
  }

  async getAll() {
    // Ambil semua user kecuali password
    const { results } = await this.db.prepare('SELECT id, username, role FROM users').all();
    return results;
  }

  async create(username, password, role) {
    // Insert tidak perlu id (auto increment), jadi ini sudah benar
    await this.db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
      .bind(username, password, role)
      .run();
  }

  async delete(username) {
    await this.db.prepare('DELETE FROM users WHERE username = ?').bind(username).run();
  }
}