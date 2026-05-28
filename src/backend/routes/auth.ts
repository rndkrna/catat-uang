import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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
  
  if (!user) {
    return c.json({
      success: false,
      message: 'Nomor WhatsApp atau password salah',
    }, 401);
  }

  // Verifikasi password (dengan fallback ke plain text jika db belum dimigrasi sepenuhnya)
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid && user.password !== password) {
    return c.json({
      success: false,
      message: 'Nomor WhatsApp atau password salah',
    }, 401);
  }
  
  // Generate JWT token
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';
  const token = jwt.sign({ id: user.id, phoneNumber: user.phoneNumber }, JWT_SECRET, { expiresIn: '7d' });
  
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

// Admin login endpoint
authRouter.post('/admin-login', async (c) => {
  const { password } = await c.req.json();
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@tulisduit2025';
  
  if (password !== ADMIN_PASSWORD) {
    return c.json({ success: false, message: 'Password salah' }, 401);
  }
  
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
  
  return c.json({ success: true, token });
});

// Register endpoint (via web/frontend)
authRouter.post('/register', async (c) => {
  const { phoneNumber } = await c.req.json();
  
  const existingUser = await db.getUserByPhoneNumber(phoneNumber);
  if (existingUser) {
    return c.json({ success: false, message: 'Nomor sudah terdaftar' }, 400);
  }
  
  // - Generate random password
  const { generatePassword } = await import('../utils/password.js');
  const password = generatePassword(8);
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // - Save to database
  await db.createUser(phoneNumber, hashedPassword);
  
  return c.json({
    success: true,
    message: 'Registration successful',
    data: {
      phoneNumber,
      password: password, // Send plain text back to client ONCE
    },
  });
});

// Helper: ambil userId dari token base64
function getUserIdFromToken(authHeader: string | undefined): number | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.replace('Bearer ', '');
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';
    const decoded = jwt.verify(token, JWT_SECRET) as any;
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
  if (!user) {
    return c.json({ success: false, message: 'User not found.' }, 404);
  }

  const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isOldPasswordValid && user.password !== oldPassword) {
    return c.json({ success: false, message: 'Password lama tidak sesuai.' }, 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.updatePassword(userId, hashedPassword);
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
