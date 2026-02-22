import { DataLayananDAO } from '../dao/DataLayananDAO.js';
import { json } from 'itty-router';

export class DataLayananController {
  
  // POST /save-addresses
  async saveAddresses(req, env) {
    try {
      const data = await req.json();

      // Validasi
      if (!Array.isArray(data) || data.length === 0) {
        return json({ success: false, message: 'Data harus berupa array dan tidak boleh kosong.' }, { status: 400 });
      }

      // Inisialisasi DAO dan panggil fungsi saveBatch
      const dao = new DataLayananDAO(env.DB);
      const processedCount = await dao.saveBatch(data);

      return json({ 
        success: true, 
        message: `${processedCount} data alamat berhasil disimpan.` 
      }, { status: 201 });

    } catch (err) {
      console.error('Error saveAddresses:', err);
      return json({ success: false, error: err.message }, { status: 500 });
    }
  }
}