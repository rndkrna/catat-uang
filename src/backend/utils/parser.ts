import { createWorker } from 'tesseract.js';
import { preprocessReceiptImage, preprocessUltraEnhanced } from './imagePreprocessor.js';
import { detectMerchant, extractWithTemplate, type MerchantExtractionResult } from './merchantTemplates.js';
import { validateOCRResult, type ValidationResult } from './ocrValidator.js';

export interface ParsedTransaction {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
}

export interface OCRScanResult {
  transactions: ParsedTransaction[];
  validation: ValidationResult | null;
  rawText: string;
  retryCount: number;
  merchant: string | null;
}

// ─── PSM Modes untuk setiap retry pass ───────────────────────────────────────
const PSM_MODES = ['6', '4', '11'] as const;
const LANG = 'ind+eng';

// ─── Helper: parse nominal teks ──────────────────────────────────────────────
function parseNominal(text: string): number | null {
  const normalized = text.replace(/,/g, '.').toLowerCase();
  const hasSuffix = /[kmjtrbiuam]/.test(normalized);

  const cleanStr = normalized.replace(/[^0-9kmjtrbiuam.]/gi, '');
  let numStr = cleanStr.replace(/[kmjtrbiuam]/g, '');
  if (numStr === '') return null;

  let num: number;
  if (hasSuffix) {
    num = parseFloat(numStr);
  } else {
    num = parseFloat(numStr.replace(/\./g, ''));
  }

  if (cleanStr.includes('k') || cleanStr.includes('rb') || cleanStr.includes('ribu')) num *= 1000;
  if (cleanStr.includes('m') || cleanStr.includes('jt') || cleanStr.includes('juta')) num *= 1_000_000;

  return num;
}

// ─── Helper: parse satu baris teks sebagai transaksi ─────────────────────────
function parseTextLine(text: string): ParsedTransaction | null {
  const lower = text.toLowerCase();

  const incomeKeywords = ['gaji', 'jual', 'dapat', 'pemasukan', 'terima', 'hadiah', 'bonus', 'topup', '+'];
  const expenseKeywords = ['beli', 'makan', 'minum', 'bayar', 'keluar', 'bensin', 'grab', 'gojek',
    'shopee', 'tokopedia', 'belanja', 'jajan', '-'];

  const amountMatch = text.match(/\b(?:\d{1,3}(?:\.\d{3})*|\d+)(?:[.,]\d+)?(?:k|rb|ribu|jt|juta)?\b/i);
  if (!amountMatch) return null;

  const amount = parseNominal(amountMatch[0]);
  if (!amount) return null;

  let categoryStr = text.replace(amountMatch[0], '').trim();
  let type: 'income' | 'expense' = 'expense';

  if (incomeKeywords.some(kw => lower.includes(kw))) {
    type = 'income';
  } else if (expenseKeywords.some(kw => lower.includes(kw))) {
    type = 'expense';
  }

  categoryStr = categoryStr.replace(/^[\+\-]/, '').trim();
  const categoryWords = categoryStr.split(' ').filter(w => w.length > 0);
  let category = categoryWords.slice(0, 2).join(' ') || (type === 'income' ? 'Pemasukan' : 'Pengeluaran');
  category = category.charAt(0).toUpperCase() + category.slice(1);
  const description = categoryWords.length > 2 ? categoryStr : undefined;

  return { type, amount, category, description };
}

// ─── OCR satu pass menggunakan Tesseract ─────────────────────────────────────
async function runOCRPass(imageBuffer: Buffer, psmMode: string): Promise<{ text: string; confidence: number }> {
  const worker = await createWorker(LANG);
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: psmMode as any,
    });

    const { data } = await worker.recognize(imageBuffer);

    // Bersihkan artefak OCR umum
    let text = data.text
      .replace(/@/g, '')         // '@' sering salah baca
      .replace(/\|/g, 'I')       // '|' → 'I'
      .replace(/0(?=[a-zA-Z])/g, 'O') // '0' sebelum huruf → 'O'
      .replace(/[^\x20-\x7E\n\u00C0-\u024F]/g, ' ') // hapus char aneh
      .replace(/ {2,}/g, ' ')    // hapus spasi berulang
      .trim();

    // Confidence dari word-level data (cast ke any karena Tesseract type defs bervariasi)
    const dataAny = data as any;
    const words: any[] = dataAny.words ?? [];
    const avgConfidence = words.length > 0
      ? words.reduce((sum: number, w: any) => sum + (w.confidence ?? 0), 0) / words.length
      : (dataAny.confidence ?? 0);

    console.log(`[OCR Pass PSM=${psmMode}] Confidence: ${avgConfidence.toFixed(1)}%, Panjang teks: ${text.length} char`);

    return { text, confidence: avgConfidence };
  } finally {
    await worker.terminate();
  }
}

// ─── Retry OCR Engine: 3 pass dengan preprocessing berbeda ───────────────────
export async function ocrWithRetry(imageBuffer: Buffer): Promise<{
  text: string;
  confidence: number;
  retryCount: number;
  extraction: MerchantExtractionResult;
  validation: ValidationResult;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey !== '') {
    try {
      console.log('[OCR] Mencoba memindai struk menggunakan Gemini AI...');
      const base64Image = imageBuffer.toString('base64');
      
      const prompt = `Analisis gambar struk belanja ini. Ekstrak data berikut:
1. Nama merchant/toko (merchant).
2. Tanggal transaksi (date) format DD-MM-YYYY.
3. Total nominal pembayaran (amount) sebagai angka murni (tanpa rupiah/titik/koma, contoh: 45000).
4. Kategori pengeluaran (category), pilih salah satu kategori yang paling cocok: Makanan, Transportasi, Belanja, Kesehatan, Hiburan, Pendidikan, atau Lainnya.

Kembalikan jawaban HANYA berupa objek JSON dengan format persis seperti ini:
{
  "merchant": "Nama Toko",
  "date": "DD-MM-YYYY",
  "amount": 45000,
  "category": "Kategori",
  "isValid": true,
  "failReason": null
}
Jika gambar bukan struk belanja yang valid atau nominal total tidak terbaca, set "isValid" menjadi false dan isi "failReason" dengan alasannya (dalam bahasa Indonesia).`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const resJson = (await response.json()) as any;
      const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (rawText) {
        console.log('[OCR] Gemini AI Response:', rawText);
        const parsed = JSON.parse(rawText.trim());
        
        const validation: ValidationResult = {
          isValid: parsed.isValid ?? true,
          confidence: parsed.isValid ? 98 : 0,
          amount: parsed.amount ?? 0,
          category: parsed.category ?? 'Lainnya',
          merchant: parsed.merchant ?? null,
          date: parsed.date ?? null,
          noStruk: null,
          warnings: [],
          needsRetry: false,
          failReason: parsed.failReason ?? undefined
        };

        const extraction: MerchantExtractionResult = {
          merchant: parsed.merchant ?? null,
          template: null,
          total: parsed.amount ?? 0,
          subtotal: parsed.amount ?? 0,
          tax: 0,
          discount: 0,
          date: parsed.date ?? null,
          noStruk: null,
          category: parsed.category ?? 'Lainnya'
        };

        return {
          text: `Gemini AI Scan. Merchant: ${parsed.merchant}, Total: ${parsed.amount}`,
          confidence: 98,
          retryCount: 0,
          extraction,
          validation
        };
      }
    } catch (error: any) {
      console.error('[OCR] Gemini AI gagal, beralih ke Tesseract (Local OCR):', error.message || error);
    }
  }

  let bestText = '';
  let bestConfidence = 0;
  let retryCount = 0;

  // ── Pass 1: Standard preprocessing + PSM 6 ────────────────────────────────
  console.log('[OCR] === Pass 1 (Standard) ===');
  const prep1 = await preprocessReceiptImage(imageBuffer, 'standard');
  const result1 = await runOCRPass(prep1.buffer, PSM_MODES[0]);

  if (result1.confidence > bestConfidence) {
    bestText = result1.text;
    bestConfidence = result1.confidence;
  }

  // Jika confidence cukup tinggi, tidak perlu retry
  if (bestConfidence >= 70 && bestText.length >= 50) {
    console.log('[OCR] Pass 1 berhasil dengan confidence tinggi ✅');
  } else {
    // ── Pass 2: Enhanced preprocessing + PSM 4 ────────────────────────────
    retryCount++;
    console.log(`[OCR] === Pass 2 (Enhanced, retry #${retryCount}) ===`);

    const prep2 = await preprocessReceiptImage(imageBuffer, 'enhanced');
    const result2 = await runOCRPass(prep2.buffer, PSM_MODES[1]);

    if (result2.confidence > bestConfidence) {
      bestText = result2.text;
      bestConfidence = result2.confidence;
    }

    if (bestConfidence < 50 || bestText.length < 30) {
      // ── Pass 3: Ultra-enhanced + PSM 11 ───────────────────────────────
      retryCount++;
      console.log(`[OCR] === Pass 3 (Ultra-Enhanced, retry #${retryCount}) ===`);

      const prep3 = await preprocessUltraEnhanced(imageBuffer);
      const result3 = await runOCRPass(prep3, PSM_MODES[2]);

      if (result3.confidence > bestConfidence) {
        bestText = result3.text;
        bestConfidence = result3.confidence;
      }
    }
  }

  console.log(`[OCR] Final — Confidence: ${bestConfidence.toFixed(1)}%, Retry: ${retryCount}`);

  // ── Deteksi Merchant + Ekstrak Data ───────────────────────────────────────
  const template = detectMerchant(bestText);
  const extraction = extractWithTemplate(bestText, template);

  // ── Validasi Hasil ────────────────────────────────────────────────────────
  const validation = validateOCRResult(extraction, bestText);

  return {
    text: bestText,
    confidence: bestConfidence,
    retryCount,
    extraction,
    validation,
  };
}

// ─── Main Export: parseTransactionMessage ────────────────────────────────────
export async function parseTransactionMessage(
  message: string,
  imageBase64?: string,
  mimeType?: string
): Promise<ParsedTransaction[] | null> {
  const transactions: ParsedTransaction[] = [];

  // 1. Parsing Teks Manual dengan RegEx
  if (message && message.trim() !== '') {
    const lines = message.split('\n');
    for (const line of lines) {
      if (line.trim().length > 0) {
        const parsed = parseTextLine(line);
        if (parsed) transactions.push(parsed);
      }
    }
  }

  // 2. Parsing Gambar dengan OCR + Retry Engine
  if (imageBase64) {
    try {
      console.log('[Parser] Memulai scan struk dengan OCR Engine...');
      const buffer = Buffer.from(imageBase64, 'base64');

      const ocrResult = await ocrWithRetry(buffer);
      const { validation, extraction } = ocrResult;

      if (validation.isValid && validation.amount > 0) {
        transactions.push({
          type: 'expense',
          amount: validation.amount,
          category: validation.category,
          description: buildDescription(ocrResult),
        });
      } else {
        console.warn('[Parser] OCR validation gagal:', validation.failReason);
      }
    } catch (error) {
      console.error('[Parser] Error scanning image:', error);
    }
  }

  return transactions.length > 0 ? transactions : null;
}

// ─── Scan gambar lengkap (untuk route /api/ocr/scan) ─────────────────────────
export async function scanReceiptImage(imageBuffer: Buffer): Promise<OCRScanResult> {
  try {
    const ocrResult = await ocrWithRetry(imageBuffer);
    const { validation, extraction, text, retryCount } = ocrResult;

    const transactions: ParsedTransaction[] = [];

    if (validation.isValid && validation.amount > 0) {
      transactions.push({
        type: 'expense',
        amount: validation.amount,
        category: validation.category,
        description: buildDescription(ocrResult),
      });
    }

    return {
      transactions,
      validation,
      rawText: text,
      retryCount,
      merchant: extraction.merchant,
    };
  } catch (error) {
    console.error('[OCR] scanReceiptImage error:', error);
    return {
      transactions: [],
      validation: null,
      rawText: '',
      retryCount: 0,
      merchant: null,
    };
  }
}

// ─── Helper: bangun deskripsi transaksi dari hasil scan ──────────────────────
function buildDescription(ocrResult: {
  text: string;
  confidence: number;
  retryCount: number;
  extraction: MerchantExtractionResult;
}): string {
  const parts: string[] = ['Hasil scan struk'];

  if (ocrResult.extraction.merchant) {
    parts.push(`(${ocrResult.extraction.merchant})`);
  }

  if (ocrResult.retryCount > 0) {
    parts.push(`[retry:${ocrResult.retryCount}]`);
  }

  if (ocrResult.extraction.date) {
    parts.push(`Tgl: ${ocrResult.extraction.date}`);
  }

  return parts.join(' ');
}
