import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../services/database.js';

const transactionRouter = new Hono();

// Helper: ambil userId dari header Authorization (token base64)
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

// Schema untuk membuat transaksi
const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  category: z.string().min(1),
  description: z.string().optional(),
});

// GET /api/transactions — ambil semua transaksi user yang login
transactionRouter.get('/', async (c) => {
  const userId = getUserIdFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }

  try {
    const transactions = await db.getTransactions(userId);
    const balance = await db.getBalance(userId);

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Transaksi hari ini
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(t => t.createdAt.startsWith(today));
    
    const todayIncome = todayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const todayExpense = todayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const todayCount = todayTransactions.length;

    return c.json({
      success: true,
      data: {
        transactions,
        balance,
        totalIncome,
        totalExpense,
        todayIncome,
        todayExpense,
        todayCount,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/transactions/export — export transaksi ke CSV (Khusus Premium)
transactionRouter.get('/export', async (c) => {
  const userId = getUserIdFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }

  try {
    const user = await db.getUserById(userId);
    if (!user) return c.json({ success: false, message: 'User not found' }, 404);

    // Proteksi: Hanya paket berbayar (minimal Starter) yang boleh export
    if (user.package === 'free' || user.package === 'lite') {
      return c.json({ 
        success: false, 
        message: 'Fitur Export CSV hanya tersedia untuk pengguna Paket Starter, Premium, atau Pro.' 
      }, 403);
    }

    const transactions = await db.getTransactions(userId);
    
    // Menambahkan BOM (Byte Order Mark) agar Excel mengenali file sebagai UTF-8
    let csvContent = '\uFEFF';
    
    // Menggunakan Titik Koma (;) sebagai pemisah karena Excel Indonesia sering gagal membaca koma (,)
    csvContent += 'Tanggal;Tipe;Kategori;Jumlah;Keterangan\n';
    
    transactions.forEach(t => {
      // Membersihkan teks agar aman: mengganti enter (\n) dengan spasi/garis agar tidak merusak baris Excel
      const cleanCategory = t.category.replace(/"/g, '""').replace(/\r?\n/g, ' ');
      const cleanDesc = t.description ? t.description.replace(/"/g, '""').replace(/\r?\n/g, ' | ') : '';
      
      const cat = `"${cleanCategory}"`;
      const desc = `"${cleanDesc}"`;
      const typeStr = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
      
      // Format tanggal yang lebih rapi tanpa koma
      const dateObj = new Date(t.createdAt);
      const dateStr = `${dateObj.toLocaleDateString('id-ID')} ${dateObj.toLocaleTimeString('id-ID')}`;
      
      csvContent += `"${dateStr}";"${typeStr}";${cat};"${t.amount}";${desc}\n`;
    });

    // Menambahkan header agar browser langsung mendownloadnya sebagai file .csv
    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', 'attachment; filename="laporan_tulisduit.csv"');
    
    return c.body(csvContent);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/transactions — buat transaksi baru
transactionRouter.post('/', zValidator('json', transactionSchema), async (c) => {
  const userId = getUserIdFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }

  try {
    const body = c.req.valid('json');
    const transaction = await db.createTransaction({
      userId,
      type: body.type,
      amount: body.amount,
      category: body.category,
      description: body.description,
    });

    return c.json({
      success: true,
      message: 'Transaksi berhasil disimpan',
      data: transaction,
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/transactions/deleted - ambil riwayat sampah
transactionRouter.get('/deleted', async (c) => {
  const userId = getUserIdFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }

  try {
    const deletedTransactions = await db.getDeletedTransactions(userId);
    return c.json({
      success: true,
      data: deletedTransactions,
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/transactions/:id — hapus transaksi (soft delete)
transactionRouter.delete('/:id', async (c) => {
  const userId = getUserIdFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }

  const user = await db.getUserById(userId);
  if (!user || !['starter', 'premium', 'pro'].includes(user.package)) {
    return c.json({ success: false, message: 'Fitur Hapus Transaksi khusus Paket Starter ke atas.' }, 403);
  }

  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) {
    return c.json({ success: false, message: 'ID tidak valid' }, 400);
  }

  try {
    await db.softDeleteTransaction(id, userId);
    return c.json({ success: true, message: 'Transaksi berhasil dihapus (dipindahkan ke sampah)' });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/transactions/:id/restore — restore transaksi
transactionRouter.post('/:id/restore', async (c) => {
  const userId = getUserIdFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }

  const user = await db.getUserById(userId);
  if (!user || !['starter', 'premium', 'pro'].includes(user.package)) {
    return c.json({ success: false, message: 'Fitur Restore khusus Paket Starter ke atas.' }, 403);
  }

  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) {
    return c.json({ success: false, message: 'ID tidak valid' }, 400);
  }

  try {
    await db.restoreTransaction(id, userId);
    return c.json({ success: true, message: 'Transaksi berhasil dipulihkan' });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/transactions/:id — edit transaksi
transactionRouter.put('/:id', zValidator('json', transactionSchema), async (c) => {
  const userId = getUserIdFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }

  const user = await db.getUserById(userId);
  if (!user || !['starter', 'premium', 'pro'].includes(user.package)) {
    return c.json({ success: false, message: 'Fitur Edit Transaksi khusus Paket Starter ke atas.' }, 403);
  }

  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) {
    return c.json({ success: false, message: 'ID tidak valid' }, 400);
  }

  try {
    const body = c.req.valid('json');
    await db.updateTransaction(id, userId, body.amount, body.category, body.description || '');
    return c.json({ success: true, message: 'Transaksi berhasil diedit' });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default transactionRouter;
