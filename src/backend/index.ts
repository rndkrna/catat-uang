import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import whatsappRoutes from './routes/whatsapp.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import ocrRoutes from './routes/ocr.js';
import { db } from './services/database.js';

const app = new Hono();

// Connect to database
await db.connect();

// Middleware
app.use('*', cors({
  origin: '*',
  credentials: true,
}));

// Health check
app.get('/', (c) => c.json({ status: 'ok', message: 'Tulis Duit API' }));

// API Routes
app.route('/api/auth', authRoutes);
app.route('/api/transactions', transactionRoutes);
app.route('/api/whatsapp', whatsappRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/ocr', ocrRoutes);

// Start server
const port = 4000;
console.log(`Server is running on http://localhost:${port}`);



serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
});

export default app;

