import { Hono } from 'hono';
import { scanReceiptImage } from '../utils/parser.js';
import { MERCHANT_TEMPLATES } from '../utils/merchantTemplates.js';
import { buildOCRReplyMessage } from '../utils/ocrValidator.js';

const ocrRouter = new Hono();

/**
 * POST /api/ocr/scan
 * Upload gambar struk (base64) dan dapatkan hasil OCR lengkap
 * Body: { imageBase64: string, mimeType?: string }
 */
ocrRouter.post('/scan', async (c) => {
  try {
    const body = await c.req.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return c.json({ error: 'imageBase64 diperlukan' }, 400);
    }

    const buffer = Buffer.from(imageBase64, 'base64');

    console.log(`[OCR Route] Scan dimulai, ukuran: ${buffer.length} bytes, tipe: ${mimeType ?? 'unknown'}`);

    const result = await scanReceiptImage(buffer);

    return c.json({
      success: true,
      merchant: result.merchant,
      retryCount: result.retryCount,
      rawText: result.rawText,
      validation: result.validation
        ? {
            isValid: result.validation.isValid,
            confidence: result.validation.confidence,
            amount: result.validation.amount,
            category: result.validation.category,
            merchant: result.validation.merchant,
            date: result.validation.date,
            noStruk: result.validation.noStruk,
            warnings: result.validation.warnings,
            needsRetry: result.validation.needsRetry,
            failReason: result.validation.failReason,
          }
        : null,
      transactions: result.transactions.map(t => ({
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description,
      })),
    });

  } catch (err: any) {
    console.error('[OCR Route] Error:', err);
    return c.json({ error: 'Gagal memproses gambar', detail: err?.message }, 500);
  }
});

/**
 * GET /api/ocr/templates
 * Lihat semua merchant template yang tersedia
 */
ocrRouter.get('/templates', (c) => {
  const templates = MERCHANT_TEMPLATES.map(t => ({
    name: t.name,
    displayName: t.displayName,
    keywords: t.keywords,
    category: t.category,
    patterns: Object.fromEntries(
      Object.entries(t.patterns).map(([k, v]) => [k, v?.toString() ?? null])
    ),
  }));

  return c.json({ success: true, count: templates.length, templates });
});

/**
 * POST /api/ocr/validate-message
 * Test endpoint: validasi pesan teks biasa (tanpa gambar)
 */
ocrRouter.post('/validate-message', async (c) => {
  try {
    const body = await c.req.json();
    const { message } = body;

    if (!message) {
      return c.json({ error: 'message diperlukan' }, 400);
    }

    const { parseTransactionMessage } = await import('../utils/parser.js');
    const result = await parseTransactionMessage(message);

    return c.json({
      success: true,
      found: result ? result.length : 0,
      transactions: result ?? [],
    });

  } catch (err: any) {
    return c.json({ error: 'Gagal memproses pesan', detail: err?.message }, 500);
  }
});

export default ocrRouter;
