import { Hono } from 'hono';
import { db } from '../services/database.js';
import { adminMiddleware } from '../middleware/admin.js';

const adminRouter = new Hono();

// Terapkan middleware admin untuk seluruh rute admin
adminRouter.use('/*', adminMiddleware);

// GET /api/admin/users
adminRouter.get('/users', async (c) => {
  try {
    const users = await db.getAllUsers();
    
    // Hilangkan field sensitif (seperti password) jika perlu
    // Tapi karena ini internal admin panel, kita biarkan atau bersihkan sedikit
    const safeUsers = users.map(u => ({
      id: u.id,
      phoneNumber: u.phoneNumber,
      name: u.name,
      package: u.package || 'free',
      packageExpiresAt: u.packageExpiresAt
    }));
    
    return c.json({ success: true, data: safeUsers });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return c.json({ success: false, message: 'Internal Server Error' }, 500);
  }
});

// POST /api/admin/users/:id/package
adminRouter.post('/users/:id/package', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const { package: pkg } = await c.req.json();
    
    if (isNaN(id) || !pkg) {
      return c.json({ success: false, message: 'Invalid payload' }, 400);
    }
    
    await db.adminUpdateUserPackage(id, pkg);
    
    return c.json({ success: true, message: 'Paket user berhasil diubah' });
  } catch (error) {
    console.error('Failed to update user package:', error);
    return c.json({ success: false, message: 'Internal Server Error' }, 500);
  }
});

export default adminRouter;
