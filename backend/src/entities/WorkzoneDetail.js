export class WorkzoneDetail {
  constructor(data) {
    this.id = data.id;
    this.workzone = data.workzone;
    this.sektor = data.sektor;
    this.korlap_username = data.korlap_username; // Alias 'korlap'
  }
}