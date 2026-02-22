export class WorkOrder {
  constructor(data) {
    this.incident = data.incident;
    this.summary = data.summary;
    Object.assign(this, data);
    this.status = 'OPEN';
  }

  static filterData(data) {
    const VALID_COLS = [
      'incident', 'ticket_id_gamas', 'external_ticket_id', 'customer_id', 'customer_name', 'service_id', 'service_no',
      'summary', 'description_assignment', 'reported_date', 'reported_by', 'reported_priority', 'source_ticket', 'channel',
      'contact_phone', 'contact_name', 'contact_email', 'status', 'status_date', 'booking_date', 'resolve_date',
      'date_modified', 'last_update_worklog', 'closed_by', 'closed_reopen_by', 'guarantee_status', 'ttr_customer',
      'ttr_agent', 'ttr_mitra', 'ttr_nasional', 'ttr_pending', 'ttr_region', 'ttr_witel', 'ttr_end_to_end', 'owner_group',
      'owner', 'witel', 'workzone', 'region', 'subsidiary', 'territory_near_end', 'territory_far_end', 'customer_segment',
      'customer_type', 'customer_category', 'service_type', 'slg', 'technology', 'lapul', 'gaul', 'onu_rx', 'pending_reason',
      'incident_domain', 'symptom', 'hierarchy_path', 'solution', 'description_actual_solution', 'kode_produk', 'perangkat',
      'technician', 'device_name', 'sn_ont', 'tipe_ont', 'manufacture_ont', 'impacted_site', 'cause', 'resolution',
      'worklog_summary', 'classification_flag', 'realm', 'related_to_gamas', 'tsc_result', 'scc_result', 'note',
      'notes_eskalasi', 'rk_information', 'external_ticket_tier_3', 'classification_path', 'urgency', 'alamat', 'korlap', 'sektor'
    ];
    
    const filtered = {};
    Object.keys(data).forEach(key => {
      if (VALID_COLS.includes(key)) filtered[key] = data[key];
    });
    return filtered;
  }
}