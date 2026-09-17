import { Hono } from 'hono';
import { db } from '../services/database.js';
import { adminMiddleware } from '../middleware/admin.js';
import { sendWhatsAppMessage } from '../services/whatsapp.js';

const paymentRoutes = new Hono();

// POST /api/payments/mayar/create -> Create Mayar.id Payment Checkout Link
paymentRoutes.post('/mayar/create', async (c) => {
  try {
    const { userId, package: pkg, period = 'monthly', amount } = await c.req.json();
    
    if (!userId || !pkg || !amount) {
      return c.json({ success: false, message: 'Parameter userId, package, dan amount wajib diisi.' }, 400);
    }

    const user = await db.getUserById(Number(userId));
    if (!user) {
      return c.json({ success: false, message: 'User tidak ditemukan.' }, 404);
    }

    const mayarApiKey = process.env.MAYAR_API_KEY;
    const mayarBaseUrl = process.env.MAYAR_API_URL || 'https://api.mayar.id/hl/v1';
    const appUrl = process.env.APP_URL || 'https://tulisduit.app';

    const periodLabel = period === 'yearly' ? '1 Tahun' : period === 'quarterly' ? '3 Bulan' : '1 Bulan';
    const description = `Pembayaran Paket ${pkg.toUpperCase()} (${periodLabel}) - Tulis Duit`;

    // Normalisasi nomor HP untuk Mayar (format Indonesia: 08xxx atau 628xxx)
    let mobile = user.phoneNumber || '';
    if (mobile.startsWith('+62')) mobile = '0' + mobile.slice(3);
    else if (mobile.startsWith('62')) mobile = '0' + mobile.slice(2);

    let mayarPaymentId = '';
    let paymentUrl = '';

    // Jika API Key Mayar telah diisi, panggil REST API Mayar.id
    if (mayarApiKey && mayarApiKey.trim() !== '') {
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() + 24); // Expire in 24h

      const response = await fetch(`${mayarBaseUrl}/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mayarApiKey.trim()}`
        },
        body: JSON.stringify({
          name: user.name || `User ${user.phoneNumber}`,
          email: `user_${user.id}@tulisduit.app`,
          mobile: mobile,
          amount: Number(amount),
          description: description,
          redirectUrl: `${appUrl}/dashboard?payment=success`,
          expiredAt: expiredDate.toISOString()
        })
      });

      const resData = await response.json() as any;

      if (response.ok && (resData.data?.link || resData.data?.url || resData.link)) {
        paymentUrl = resData.data?.link || resData.data?.url || resData.link;
        mayarPaymentId = resData.data?.id || resData.id || `MAYAR-${Date.now()}`;
      } else {
        console.error('[Mayar API Error]', resData);
        return c.json({ 
          success: false, 
          message: resData.messages || resData.message || 'Gagal membuat tautan pembayaran di Mayar.id' 
        }, 400);
      }
    } else {
      // Simulation / Fallback mode if MAYAR_API_KEY is not set yet
      mayarPaymentId = `MAYAR-SIM-${Date.now()}`;
      paymentUrl = `${appUrl}/menunggu-konfirmasi?mayarSim=${mayarPaymentId}`;
    }

    // Simpan data pembayaran di database dengan status pending
    const payment = await db.createPayment(
      Number(userId), 
      pkg, 
      Number(amount), 
      period, 
      mayarPaymentId, 
      paymentUrl, 
      'mayar'
    );

    return c.json({ 
      success: true, 
      data: {
        paymentId: payment.id,
        mayarPaymentId,
        paymentUrl,
        isSimulation: !mayarApiKey || mayarApiKey.trim() === ''
      } 
    });

  } catch (error: any) {
    console.error('[Mayar Create Payment Error]', error);
    return c.json({ success: false, message: error.message || 'Terjadi kesalahan sistem' }, 500);
  }
});

// POST /api/payments/webhook/mayar -> Webhook Notifikasi Pembayaran Mayar.id
paymentRoutes.post('/webhook/mayar', async (c) => {
  try {
    const payload = await c.req.json();
    console.log('[Mayar Webhook Received]', JSON.stringify(payload));

    // Validasi token webhook opsional
    const webhookSecret = process.env.MAYAR_WEBHOOK_SECRET;
    if (webhookSecret && webhookSecret.trim() !== '') {
      const authHeader = c.req.header('x-mayar-token') || c.req.header('authorization');
      if (!authHeader || !authHeader.includes(webhookSecret)) {
        return c.json({ success: false, message: 'Unauthorized webhook request' }, 401);
      }
    }

    const event = payload.event || payload.eventType || '';
    const data = payload.data || payload;
    const mayarPaymentId = data.id || data.paymentId || data.invoiceId;
    const status = data.status || '';

    // Cek apakah event/status menandakan pembayaran sukses
    const isSuccess = 
      event === 'payment.received' || 
      event === 'payment.success' || 
      status === 'paid' || 
      status === 'SUCCESS' || 
      status === true;

    if (mayarPaymentId && isSuccess) {
      try {
        const approvedPayment = await db.approvePaymentByMayarId(String(mayarPaymentId));
        console.log(`[Mayar Webhook] Payment ${mayarPaymentId} approved for user ${approvedPayment.userId}`);

        // Kirim WhatsApp pemberitahuan jika nomor user ada
        const user = await db.getUserById(approvedPayment.userId);
        if (user && user.phoneNumber) {
          const message = `🎉 *Pembayaran Berhasil!*\n\nPaket *${approvedPayment.package.toUpperCase()}* Anda telah aktif.\nTerima kasih telah berlangganan Tulis Duit! Silakan akses fitur eksklusif Anda di aplikasi.`;
          await sendWhatsAppMessage(user.phoneNumber, message).catch(err => console.error('[Mayar WA Notify Error]', err));
        }
      } catch (err: any) {
        console.warn(`[Mayar Webhook Warning] ${err.message}`);
      }
    }

    return c.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('[Mayar Webhook Error]', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/payments -> Create a new pending payment (Legacy / Manual QRIS)
paymentRoutes.post('/', async (c) => {
  const { userId, package: pkg, amount, period = 'monthly' } = await c.req.json();
  
  if (!userId || !pkg || !amount) {
    return c.json({ success: false, message: 'Invalid payload' }, 400);
  }

  try {
    const payment = await db.createPayment(userId, pkg, amount, period, undefined, undefined, 'manual_qris');
    return c.json({ success: true, data: payment });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/payments -> Get all pending payments for admin
paymentRoutes.get('/', adminMiddleware, async (c) => {
  try {
    const payments = await db.getPendingPayments();
    return c.json({ success: true, data: payments });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/payments/:id/approve -> Approve a payment
paymentRoutes.post('/:id/approve', adminMiddleware, async (c) => {
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

