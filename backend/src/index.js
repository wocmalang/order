import { Router, json } from 'itty-router';
import { WorkOrderController } from './controllers/WorkOrderController.js';
import { ReportController } from './controllers/ReportController.js';
import { AuthController } from './controllers/AuthController.js';
import { DataLayananController } from './controllers/DataLayananController.js';

// 1. Definisikan Header CORS secara global
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Mengizinkan semua domain (termasuk https://flow.wocmalang.fun)
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const router = Router();
const ctrl = (Class, method) => (req, env, ctx) => new Class()[method](req, env, ctx);

// --- ROUTES ---

// 2. Preflight Handler: LANGSUNG kembalikan response 204 beserta header CORS
router.options('*', () => new Response(null, { status: 204, headers: corsHeaders }));

// Auth & User Management
router.post('/login', ctrl(AuthController, 'login'));
router.get('/users', ctrl(AuthController, 'listUsers'));
router.post('/users', ctrl(AuthController, 'createUser'));
router.delete('/users/:username', ctrl(AuthController, 'deleteUser'));

// Work Order Core
router.post('/mypost', ctrl(WorkOrderController, 'create'));
router.get('/view-d1', ctrl(WorkOrderController, 'viewAll'));
router.put('/work-orders/:incident', ctrl(WorkOrderController, 'update'));
router.delete('/work-orders/:incident', ctrl(WorkOrderController, 'delete'));
router.get('/workzone-map', ctrl(WorkOrderController, 'getWorkzoneMap'));

// Close Ticket & Reports
router.post('/work-orders/:incident/complete', ctrl(WorkOrderController, 'complete'));
router.get('/reports', ctrl(ReportController, 'viewAll'));
router.post('/reports/:incident/reopen', ctrl(ReportController, 'reopen'));

// Integrasi Data Layanan (Alamat)
router.post('/save-addresses', ctrl(DataLayananController, 'saveAddresses'));

// 404 Handler
router.all('*', () => json({ error: 'Not Found' }, { status: 404, headers: corsHeaders }));

export default {
  async fetch(request, env, ctx) {
    try {
      // Eksekusi router
      const response = await router.handle(request, env, ctx);

      // 3. Gandakan (clone) response untuk menghindari error "immutable headers"
      const newResponse = new Response(response.body, response);
      for (const [key, value] of Object.entries(corsHeaders)) {
        newResponse.headers.set(key, value);
      }
      return newResponse;

    } catch (err) {
      // 4. Jika aplikasi/database error (500), tangkap errornya dan TETAP berikan header CORS
      console.error("Worker Error:", err);
      return json({ 
        success: false, 
        error: err.message || 'Internal Server Error' 
      }, { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  },
};