export class User {
  constructor(username, role, password = null) {
    this.username = username;
    this.role = role;
    this.password = password;
  }
}