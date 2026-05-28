import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { db } from '../services/database.js';

const authRouter = new Hono();

// Schema for login
const loginSchema = z.object({
  phoneNumber: z.string().min(10),
  password: z.string().min(6),
});

// Login endpoint
authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const { phoneNumber, password } = c.req.valid('json');
  
  // Verify user in database
  const user = await db.getUserByPhoneNumber(phoneNumber);
  
  if (!user || user.password !== password) {
    return c.json({
      success: false,
      message: 'Nomor WhatsApp atau password salah',
    }, 401);
  }
  
  // Generate JWT token (simple placeholder for now, or just return success)
  const token = btoa(JSON.stringify({ id: user.id, phoneNumber: user.phoneNumber }));
  
  return c.json({
    success: true,
    message: 'Login berhasil',
    data: {
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name || 'User',
        package: user.package || 'free',
        packageExpiresAt: user.packageExpiresAt || null,
        partnerPhone: user.partnerPhone || null,
      },
    },
  });
});

// Register endpoint (via WhatsApp webhook)
authRouter.post('/register', async (c) => {
  const { phoneNumber } = await c.req.json();
  
  // TODO: Implement registration logic
  // - Generate random password
  // - Save to database
  // - Send password via WhatsApp
  
  return c.json({
    success: true,
    message: 'Registration successful',
    data: {
      phoneNumber,
      password: 'generated-password',
    },
  });
});

// Helper: ambil userId dari token base64
function getUserIdFromToken(authHeader: string | undefined): number | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = JSON.parse(atob(token));
    return decoded.id ?? null;
  } catch {
    return null;
  }
}

// Change password endpoint
authRouter.post('/change-password', async (c) => {
  const userId = getUserIdFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }

  const { oldPassword, newPassword } = await c.req.json();

  if (!oldPassword || !newPassword || newPassword.length < 6) {
    return c.json({ success: false, message: 'Data tidak lengkap atau password baru terlalu pendek.' }, 400);
  }

  const user = await db.getUserById(userId);
  if (!user || user.password !== oldPassword) {
    return c.json({ success: false, message: 'Password lama tidak sesuai.' }, 401);
  }

  await db.updatePassword(userId, newPassword);
  return c.json({ success: true, message: 'Password berhasil diubah.' });
});

// Partner endpoint
authRouter.post('/partner', async (c) => {
  const userId = getUserIdFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }

  const { partnerPhone } = await c.req.json();
  const user = await db.getUserById(userId);
  
  if (!user) {
    return c.json({ success: false, message: 'User not found' }, 404);
  }
  
  const allowedPackages = ['starter', 'premium', 'pro'];
  if (!allowedPackages.includes(user.package)) {
    return c.json({ success: false, message: 'Fitur Akun Pasangan hanya tersedia untuk paket Starter, Premium, dan Pro.' }, 403);
  }

  // Set to null if empty string
  const newPhone = partnerPhone && partnerPhone.trim() !== '' ? partnerPhone.trim() : null;
  
  await db.updatePartnerPhone(userId, newPhone);
  return c.json({ success: true, message: 'Nomor pasangan berhasil diperbarui', partnerPhone: newPhone });
});

export default authRouter;
