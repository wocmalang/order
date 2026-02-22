import { Router, json } from 'itty-router';
import { WorkOrderController } from './controllers/WorkOrderController.js';
import { ReportController } from './controllers/ReportController.js';
import { AuthController } from './controllers/AuthController.js';
import { DataLayananController } from './controller/DataLayananController.js';

// Middleware CORS
const withCORS = (response) => {
  if (!response) return response;
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
};

const router = Router();
const ctrl = (Class, method) => (req, env, ctx) => new Class()[method](req, env, ctx);

// --- ROUTES ---

// 1. Preflight CORS Handler
router.options('*', () => new Response(null, { status: 'ok',  message: 'Backend API is running.', version: '2.0.0'  }));

// 2. Auth & User Management
router.post('/login', ctrl(AuthController, 'login'));
router.get('/users', ctrl(AuthController, 'listUsers'));
router.post('/users', ctrl(AuthController, 'createUser'));
router.delete('/users/:username', ctrl(AuthController, 'deleteUser'));

// 3. Work Order Core
router.post('/mypost', ctrl(WorkOrderController, 'create'));
router.get('/view-d1', ctrl(WorkOrderController, 'viewAll'));
router.put('/work-orders/:incident', ctrl(WorkOrderController, 'update'));
router.delete('/work-orders/:incident', ctrl(WorkOrderController, 'delete'));
router.get('/workzone-map', ctrl(WorkOrderController, 'getWorkzoneMap'));

// 4. Close Ticket & Reports
router.post('/work-orders/:incident/complete', ctrl(WorkOrderController, 'complete'));
router.get('/reports', ctrl(ReportController, 'viewAll'));
router.post('/reports/:incident/reopen', ctrl(ReportController, 'reopen'));

// 4. Data Layanan Add
router.post('/save-addresses', ctrl(DataLayananController, 'saveAddresses'));

// 404 Handler
router.all('*', () => json({ error: 'Not Found' }, { status: 404 }));

export default {
  async fetch(request, env, ctx) {
    // 1. Jalankan router
    const response = await router.handle(request, env, ctx);
    
    // 2. Tempelkan header CORS ke response apapun (termasuk 204 dari OPTIONS atau 404 error)
    return withCORS(response);
  },
};