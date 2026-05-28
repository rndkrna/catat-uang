import { Hono } from 'hono';
import { db } from '../services/database.js';

const paymentRoutes = new Hono();

// POST /api/payments -> Create a new pending payment
paymentRoutes.post('/', async (c) => {
  const { userId, package: pkg, amount } = await c.req.json();
  
  if (!userId || !pkg || !amount) {
    return c.json({ success: false, message: 'Invalid payload' }, 400);
  }

  try {
    const payment = await db.createPayment(userId, pkg, amount);
    return c.json({ success: true, data: payment });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/payments -> Get all pending payments for admin
paymentRoutes.get('/', async (c) => {
  try {
    const payments = await db.getPendingPayments();
    return c.json({ success: true, data: payments });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/payments/:id/approve -> Approve a payment
paymentRoutes.post('/:id/approve', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  
  if (isNaN(id)) {
    return c.json({ success: false, message: 'Invalid ID' }, 400);
  }

  try {
    await db.approvePayment(id);
    return c.json({ success: true, message: 'Payment approved successfully' });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default paymentRoutes;
