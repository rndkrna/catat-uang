import 'dotenv/config';
import { readFileSync } from 'fs';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import whatsappRoutes from './routes/whatsapp.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import ocrRoutes from './routes/ocr.js';
import { db } from './services/database.js';

const app = new Hono();
const port = Number(process.env.PORT) || 4000;

app.use('*', cors({
  origin: '*',
  credentials: true,
}));

app.get('/api/health', (c) => c.json({
  status: 'ok',
  port,
  uptime: process.uptime(),
}));

app.get('/api', (c) => c.json({ status: 'ok', message: 'Tulis Duit API' }));

app.route('/api/auth', authRoutes);
app.route('/api/transactions', transactionRoutes);
app.route('/api/whatsapp', whatsappRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/ocr', ocrRoutes);

app.use('/assets/*', serveStatic({ root: './dist' }));
app.use('/images/*', serveStatic({ root: './dist' }));
app.use('/vite.svg', serveStatic({ root: './dist' }));

app.get('*', (c) => {
  try {
    const html = readFileSync('./dist/index.html', 'utf-8');
    return c.html(html);
  } catch {
    return c.text('Frontend build not found. Please run build process.', 404);
  }
});

async function start() {
  // Server dulu — Railway healthcheck butuh respons cepat
  serve({
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0',
  }, (info) => {
    console.log(`[Startup] Server listening on ${info.address}:${info.port} (PORT env=${process.env.PORT ?? 'not set'})`);
  });

  try {
    await db.connect();
    console.log('[Startup] Database connected');
  } catch (err) {
    console.error('[Startup] Database connection FAILED:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

process.on('uncaughtException', (err) => {
  console.error('[Fatal] uncaughtException:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('[Fatal] unhandledRejection:', err);
});

start().catch((err) => {
  console.error('[Startup] Fatal error:', err);
  process.exit(1);
});

export default app;
