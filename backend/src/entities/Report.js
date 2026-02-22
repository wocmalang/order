import { WorkOrder } from './WorkOrder.js';

export class Report extends WorkOrder {
  constructor(data) {
    super(data);
    this.status = 'CLOSED'; // Paksa status
    
    // Jika belum ada resolve_date, isi dengan waktu sekarang
    if (!this.resolve_date) {
      this.resolve_date = new Date().toISOString();
    }
    
    // Update date_modified
    this.date_modified = new Date().toISOString();
  }
}