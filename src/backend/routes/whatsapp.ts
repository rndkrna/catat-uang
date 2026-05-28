import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { db } from '../services/database.js';
import { generatePassword, formatPhoneNumber } from '../utils/password.js';
import { parseTransactionMessage, scanReceiptImage } from '../utils/parser.js';
import { sendWhatsAppMessage, downloadWhatsAppMedia } from '../services/whatsapp.js';
import { buildOCRReplyMessage } from '../utils/ocrValidator.js';

const whatsappRouter = new Hono();

// ─── Helper: format Rupiah ─────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

// ─── Helper: ringkasan periode ────────────────────────────────────────────
function summarize(txs: any[], label: string): string {
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = income - expense;
  const lines = txs.slice(0, 5).map(t =>
    `${t.type === 'income' ? '📈' : '📉'} ${t.description || t.category} — ${fmt(t.amount)}`
  ).join('\n');
  return `📊 *Rekap ${label}*

📈 Pemasukan : ${fmt(income)}
📉 Pengeluaran: ${fmt(expense)}
💰 Saldo Bersih: *${fmt(net)}*
${txs.length > 0 ? `\n*5 Transaksi Terakhir:*\n${lines}${txs.length > 5 ? `\n... dan ${txs.length - 5} transaksi lainnya` : ''}` : '\nBelum ada transaksi.'}`;
}

// ─── Webhook POST (terima pesan dari Meta) ────────────────────────────────
whatsappRouter.post('/webhook', async (c) => {
  const body = await c.req.json();

  // Validasi: harus dari WhatsApp Business Account
  if (body.object !== 'whatsapp_business_account') {
    return c.json({ error: 'Invalid object' }, 400);
  }

  const entry    = body.entry?.[0];
  const changes  = entry?.changes?.[0];
  const value    = changes?.value;
  const msgObj   = value?.messages?.[0];

  // Abaikan jika bukan pesan (misal: status update)
  if (!msgObj) {
    return c.json({ status: 'no_message' });
  }

  const from      = msgObj.from;                          // e.g. "6283844570735"
  const bodyText  = (msgObj.text?.body || '').trim();
  const msgType   = msgObj.type;                          // "text" | "image" | dll
  const phoneNumber = formatPhoneNumber(from);

  console.log(`[WhatsApp] ${phoneNumber}: ${bodyText || `[${msgType}]`}`);

  // ── 1. AUTO REGISTRASI ─────────────────────────────────────────────────
  let user = await db.getUserByPhoneNumber(phoneNumber);

  if (!user) {
    const password = generatePassword(8);
    const hashedPassword = await bcrypt.hash(password, 10);
    user = await db.createUser(phoneNumber, hashedPassword);

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const welcome = `🎉 *Selamat Datang di Tulis Duit!*

Akun kamu berhasil dibuat ✅

🔐 *Informasi Login Dashboard*
📱 Username: ${phoneNumber}
🔑 Password: \`${password}\`

🌐 Login di: ${appUrl}/login

_Simpan password ini baik-baik ya!_

Ketik *bantuan* untuk panduan cara mencatat.`;

    await sendWhatsAppMessage(from, welcome);
    return c.json({ status: 'user_created' });
  }

  // ── 2. Cek kuota untuk user Free ──────────────────────────────────────
  const allTx = await db.getTransactions(user.id);
  const now = new Date();
  const thisMonth = allTx.filter(t => {
    const d = new Date(t.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const LIMITS: Record<string, number> = {
    free: 10, lite: 200, starter: 450, premium: 1200, pro: Infinity
  };
  const quota = LIMITS[user.package] ?? 10;
  const used  = thisMonth.length;

  // ── 3. Proses pesan ─────────────────────────────────────────────────────
  const msg = bodyText.toLowerCase().trim();

  // BANTUAN / HALO
  if (['halo', 'hi', 'hello', 'help', 'bantuan', 'start'].includes(msg)) {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const help = `📖 *Panduan Tulis Duit*

━━━━━━━━━━━━━━━
💰 *Set Saldo Awal*
Ketik: \`saldo awal 1000000\`

━━━━━━━━━━━━━━━
📝 *Format Pencatatan*

📉 Pengeluaran:
• \`10k jajan kopi\`
• \`-20k makan siang\`
• \`15rb bensin\`

📈 Pemasukan:
• \`+5jt gaji\`
• \`+750rb bonus\`

📷 Kirim *foto struk* untuk catat otomatis

━━━━━━━━━━━━━━━
📊 *Perintah*

• \`saldo\` — cek saldo
• \`harian\` / \`rekap\` — hari ini
• \`mingguan\` — 7 hari terakhir
• \`bulanan\` — bulan ini
• \`limit\` — sisa kuota
• \`upgrade\` — lihat paket
• \`bantuan\` — panduan ini

━━━━━━━━━━━━━━━
🌐 Dashboard: ${appUrl}`;

    await sendWhatsAppMessage(from, help);
    return c.json({ status: 'help_sent' });
  }

  // SALDO
  if (msg === 'saldo') {
    const balance = await db.getBalance(user.id);
    await sendWhatsAppMessage(from, `💰 *Saldo Anda*\n\nSaldo saat ini: *${fmt(balance)}*\nTotal transaksi: ${allTx.length}`);
    return c.json({ status: 'saldo_sent' });
  }

  // LIMIT / KUOTA
  if (msg === 'limit' || msg === 'kuota') {
    const paket = user.package || 'free';
    const sisa  = quota === Infinity ? '∞' : String(Math.max(0, quota - used));
    await sendWhatsAppMessage(from,
      `📦 *Kuota Bulan Ini*\n\nPaket: *${paket.toUpperCase()}*\nTerpakai: ${used} / ${quota === Infinity ? 'Unlimited' : quota}\nSisa: *${sisa}*`
    );
    return c.json({ status: 'limit_sent' });
  }

  // UPGRADE
  if (msg === 'upgrade' || msg === 'paket') {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    await sendWhatsAppMessage(from,
      `⭐ *Upgrade Paket Tulis Duit*\n\n🆓 Free — Gratis (10 catatan/bln)\n⚡ Lite — Rp15.000/bln (200 catatan)\n✨ Starter — Rp29.000/bln (450 catatan)\n🛡️ Premium — Rp49.000/bln (1200 catatan)\n🚀 Pro — Rp99.000/bln (Unlimited)\n\n🔗 Pilih paket di:\n${appUrl}/pilih-paket`
    );
    return c.json({ status: 'upgrade_sent' });
  }

  // REKAP HARIAN
  if (['rekap', 'harian', 'hari ini', 'laporan'].includes(msg)) {
    const today = allTx.filter(t => new Date(t.createdAt).toDateString() === now.toDateString());
    await sendWhatsAppMessage(from, summarize(today, 'Hari Ini'));
    return c.json({ status: 'rekap_harian_sent' });
  }

  // REKAP MINGGUAN
  if (['mingguan', 'minggu', 'minggu ini'].includes(msg)) {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const weekly = allTx.filter(t => new Date(t.createdAt) >= weekAgo);
    await sendWhatsAppMessage(from, summarize(weekly, '7 Hari Terakhir'));
    return c.json({ status: 'rekap_mingguan_sent' });
  }

  // REKAP BULANAN
  if (['bulanan', 'bulan', 'bulan ini'].includes(msg)) {
    await sendWhatsAppMessage(from, summarize(thisMonth, 'Bulan Ini'));
    return c.json({ status: 'rekap_bulanan_sent' });
  }

  // SALDO AWAL
  if (msg.startsWith('saldo awal')) {
    const rawAmount = bodyText.replace(/saldo awal/i, '').trim();
    const parsedArray = await parseTransactionMessage(rawAmount);
    const parsed = parsedArray ? parsedArray[0] : null;
    const amount = parsed ? parsed.amount : parseInt(rawAmount.replace(/\D/g, ''), 10);

    if (!amount || isNaN(amount) || amount <= 0) {
      await sendWhatsAppMessage(from, '⚠️ Format salah. Contoh: *saldo awal 1000000* atau *saldo awal 1jt*');
      return c.json({ status: 'invalid_amount' });
    }

    await db.createTransaction({ userId: user.id, type: 'income', amount, category: 'Saldo Awal', description: 'Inisialisasi saldo awal' });
    await sendWhatsAppMessage(from, `✅ Saldo awal berhasil diatur: *${fmt(amount)}*`);
    return c.json({ status: 'initial_balance_set' });
  }

  // RESET SALDO (soft — catat pengeluaran sebesar saldo saat ini)
  if (msg === 'reset saldo') {
    const balance = await db.getBalance(user.id);
    if (balance > 0) {
      await db.createTransaction({ userId: user.id, type: 'expense', amount: balance, category: 'Reset', description: 'Reset saldo ke 0' });
    }
    await sendWhatsAppMessage(from, `♻️ Saldo berhasil direset ke Rp 0.`);
    return c.json({ status: 'reset_done' });
  }

  // ── 4. Parse sebagai transaksi dengan AI ──────────────────────────────────
  // Cek kuota terlebih dulu
  if (used >= quota) {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    await sendWhatsAppMessage(from,
      `🚫 *Kuota Habis!*\n\nKamu telah menggunakan ${used}/${quota} catatan bulan ini.\n\n⭐ Upgrade untuk kuota lebih banyak:\n${appUrl}/pilih-paket`
    );
    return c.json({ status: 'quota_exceeded' });
  }

  // ── Proses gambar struk dengan OCR Pipeline baru ─────────────────────────
  if (msgType === 'image' && msgObj.image?.id) {
    await sendWhatsAppMessage(from, `🖼️ _Sedang memindai struk... Mohon tunggu sebentar_ 🔍`);

    // Unduh gambar
    let mediaBuffer: Buffer;
    try {
      const media = await downloadWhatsAppMedia(msgObj.image.id);
      mediaBuffer = media.buffer;
    } catch (e) {
      await sendWhatsAppMessage(from, `❌ Gagal mengunduh gambar struk. Coba lagi nanti.`);
      return c.json({ status: 'media_download_failed' });
    }

    // Jalankan OCR pipeline lengkap: Preprocess → Retry OCR → Merchant → Validate
    const ocrResult = await scanReceiptImage(mediaBuffer);
    const { validation, transactions: ocrTxs, merchant, retryCount } = ocrResult;

    // Jika OCR gagal total (confidence < 40 atau amount tidak ditemukan)
    if (!validation || !validation.isValid) {
      const failMsg = validation?.failReason ?? 'Tidak ditemukan nominal transaksi';
      let hint = `📷 *Struk tidak terbaca*\n\n`;
      hint += `❌ ${failMsg}\n\n`;
      hint += `💡 *Tips agar struk terbaca:*\n`;
      hint += `• Foto lebih dekat & tegak lurus\n`;
      hint += `• Pastikan pencahayaan cukup\n`;
      hint += `• Hindari bayangan di atas struk\n`;
      if (retryCount > 0) hint += `\n_(Sudah dicoba ${retryCount}x retry OCR)_`;
      await sendWhatsAppMessage(from, hint);
      return c.json({ status: 'ocr_failed', reason: failMsg });
    }

    // Cek kuota sebelum simpan
    if (used >= quota) {
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      await sendWhatsAppMessage(from,
        `🚫 *Kuota Habis!*\n\nKamu telah menggunakan ${used}/${quota} catatan bulan ini.\n\n⭐ Upgrade untuk kuota lebih banyak:\n${appUrl}/pilih-paket`
      );
      return c.json({ status: 'quota_exceeded' });
    }

    // Simpan transaksi
    if (ocrTxs.length > 0) {
      for (const trx of ocrTxs) {
        await db.createTransaction({
          userId: user.id,
          type: trx.type,
          amount: trx.amount,
          category: trx.category,
          description: trx.description,
        });
      }

      const balance = await db.getBalance(user.id);
      const sisaKuota = quota === Infinity ? '∞' : String(quota - used - ocrTxs.length);
      const replyMsg = buildOCRReplyMessage(validation, balance, sisaKuota);
      await sendWhatsAppMessage(from, replyMsg);
      return c.json({ status: 'ocr_saved', merchant, confidence: validation.confidence, retryCount });
    }
  }

  // ── Proses pesan teks biasa ───────────────────────────────────────────────
  const transactions = await parseTransactionMessage(bodyText);

  if (transactions && transactions.length > 0) {
    // Cek apakah sisa kuota cukup untuk menyimpan semua transaksi
    if (quota !== Infinity && used + transactions.length > quota) {
      await sendWhatsAppMessage(from, `🚫 *Gagal mencatat!*\nKamu mencoba mencatat ${transactions.length} transaksi sekaligus, tapi sisa kuota kamu bulan ini hanya tinggal ${quota - used} catatan.`);
      return c.json({ status: 'quota_exceeded_multi' });
    }

    let replyLines = [`🤖 *Berhasil dicatat otomatis* ✅\n`];

    for (const trx of transactions) {
      await db.createTransaction({
        userId: user.id,
        type: trx.type,
        amount: trx.amount,
        category: trx.category,
        description: trx.description,
      });

      const icon = trx.type === 'income' ? '📈 Pemasukan' : '📉 Pengeluaran';
      replyLines.push(`• ${icon}: *${fmt(trx.amount)}* (${trx.category})`);
    }

    const balance  = await db.getBalance(user.id);
    const sisaKuota = quota === Infinity ? '∞' : String(quota - used - transactions.length);

    replyLines.push(`\n💰 Saldo sekarang: *${fmt(balance)}*`);
    replyLines.push(`📦 Sisa kuota: ${sisaKuota}`);

    await sendWhatsAppMessage(from, replyLines.join('\n'));
    return c.json({ status: 'transaction_saved_ai' });
  }

  // Default: pesan tidak dikenali
  await sendWhatsAppMessage(from, `Maaf, saya tidak menemukan catatan keuangan di pesan itu. 🤔\n\nKetik *bantuan* untuk melihat panduan.`);
  return c.json({ status: 'default_sent' });
});

// ─── Webhook GET (verifikasi dari Meta Dashboard) ─────────────────────────
whatsappRouter.get('/webhook', (c) => {
  const mode      = c.req.query('hub.mode');
  const token     = c.req.query('hub.verify_token');
  const challenge = c.req.query('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!VERIFY_TOKEN) {
    console.error('[WhatsApp] WHATSAPP_VERIFY_TOKEN tidak diset di .env!');
    return c.text('Server Error: verify token not configured', 500);
  }

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp] Webhook verified ✅.');
    return c.text(challenge || '');
  }

  console.warn(`[WhatsApp] Webhook verification failed ❌ — token tidak cocok`);
  console.warn(`Yang diterima: "${token}"`);
  console.warn(`Yang ada di .env: "${VERIFY_TOKEN}"`);
  return c.text('Forbidden', 403);
});

export default whatsappRouter;
