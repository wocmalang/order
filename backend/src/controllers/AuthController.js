import { UserDAO } from '../dao/UserDAO.js';
import { json } from 'itty-router';

export class AuthController {
  
  async login(req, env) {
    try {
      const { username, password } = await req.json();
      const dao = new UserDAO(env.DB);
      const user = await dao.findByUsername(username);

      if (!user || user.password !== password) {
        return json({ success: false, message: 'Username atau Password salah.' }, { status: 401 });
      }

      const { password: _, ...userData } = user;
      return json({ success: true, user: userData });
    } catch (err) {
      return json({ success: false, error: err.message }, { status: 500 });
    }
  }

  async listUsers(req, env) {
    const dao = new UserDAO(env.DB);
    const users = await dao.getAll();
    return json({ success: true, users: users }); 
  }

  async createUser(req, env) {
    const { username, password, role } = await req.json();
    const dao = new UserDAO(env.DB);

    try {
      const existing = await dao.findByUsername(username);
      if (existing) {
        return json({ success: false, message: 'User sudah ada.' }, { status: 409 });
      }

      await dao.create(username, password, role);
      return json({ success: true, message: 'User dibuat.' }, { status: 200 });
    } catch (err) {
      return json({ success: false, error: err.message }, { status: 500 });
    }
  }

  async deleteUser(req, env) {
    const { username } = req.params;
    const dao = new UserDAO(env.DB);
    await dao.delete(username);
    return json({ success: true, message: 'User dihapus.' });
  }
}