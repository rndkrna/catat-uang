/**
 * OCR Validation Engine
 * Memvalidasi dan memberi skor kepercayaan pada hasil OCR
 */

import type { MerchantExtractionResult } from './merchantTemplates.js';

export interface ValidationResult {
  isValid: boolean;
  confidence: number;        // 0–100
  amount: number;
  category: string;
  merchant: string | null;
  date: string | null;
  noStruk: string | null;
  warnings: string[];
  needsRetry: boolean;
  failReason?: string;
}

// Batas wajar transaksi (IDR)
const MIN_AMOUNT = 500;
const MAX_AMOUNT = 100_000_000; // 100 juta

/**
 * Hitung skor kepercayaan berdasarkan beberapa faktor
 */
function computeConfidence(params: {
  hasTotal: boolean;
  hasFallbackAmount: boolean;
  hasMerchant: boolean;
  hasDate: boolean;
  hasSubtotal: boolean;
  hasTax: boolean;
  totalMatchesSubtotalPlusTax: boolean;
  ocrTextLength: number;
  amountInRange: boolean;
}): number {
  let score = 0;

  // Total ditemukan → +40 poin (faktor terpenting)
  if (params.hasTotal) {
    score += 40;
  } else if (params.hasFallbackAmount) {
    // Fallback amount ditemukan → +25 poin
    score += 25;
  }

  // Amount dalam rentang wajar → +15 poin
  if (params.amountInRange) score += 15;

  // Merchant teridentifikasi → +15 poin
  if (params.hasMerchant) score += 15;

  // Subtotal ditemukan → +10 poin
  if (params.hasSubtotal) score += 10;

  // Tax ditemukan → +5 poin
  if (params.hasTax) score += 5;

  // Tanggal ditemukan → +5 poin
  if (params.hasDate) score += 5;

  // Total ≈ subtotal + tax (cross-validation) → +10 poin
  if (params.totalMatchesSubtotalPlusTax) score += 10;

  // Teks OCR cukup panjang (> 50 char = struk nyata) → kurangi risiko
  if (params.ocrTextLength < 30) score -= 15;
  else if (params.ocrTextLength < 60) score -= 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Validasi utama: periksa hasil ekstraksi OCR
 */
export function validateOCRResult(
  extraction: MerchantExtractionResult,
  ocrText: string
): ValidationResult {
  const warnings: string[] = [];
  let needsRetry = false;
  let failReason: string | undefined;

  // ── 1. Cek apakah ada total ────────────────────────────────────────────────
  let amount = extraction.total;

  if (!amount || amount <= 0) {
    // Fallback: coba ambil subtotal
    if (extraction.subtotal && extraction.subtotal > 0) {
      amount = extraction.subtotal;
      warnings.push('Total utama tidak ditemukan, menggunakan subtotal');
    } else {
      // Fallback terakhir: cari angka terbesar dalam teks yang masuk akal
      amount = extractLargestReasonableNumber(ocrText);
      if (!amount) {
        return {
          isValid: false,
          confidence: 0,
          amount: 0,
          category: extraction.category,
          merchant: extraction.merchant,
          date: extraction.date,
          noStruk: extraction.noStruk,
          warnings,
          needsRetry: true,
          failReason: 'Tidak ditemukan nominal transaksi',
        };
      }
      warnings.push('Nominal diambil dari perkiraan, mohon verifikasi');
    }
  }

  // ── 2. Cek rentang amount ──────────────────────────────────────────────────
  const amountInRange = amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;
  if (!amountInRange) {
    if (amount < MIN_AMOUNT) {
      warnings.push(`Nominal terlalu kecil (${amount.toLocaleString('id-ID')}), mungkin tidak akurat`);
      needsRetry = true;
    } else {
      warnings.push(`Nominal sangat besar (${formatRupiah(amount)}), mohon verifikasi`);
    }
  }

  // ── 3. Cross-validasi total vs subtotal + tax ──────────────────────────────
  let totalMatchesSubtotalPlusTax = false;
  if (extraction.subtotal && extraction.tax && extraction.total) {
    const expected = extraction.subtotal + extraction.tax - (extraction.discount ?? 0);
    const diff = Math.abs(extraction.total - expected);
    const tolerance = extraction.total * 0.05; // toleransi 5%
    totalMatchesSubtotalPlusTax = diff <= tolerance;
    if (!totalMatchesSubtotalPlusTax) {
      warnings.push('Total tidak cocok dengan subtotal+pajak, mungkin ada item yang tidak terbaca');
    }
  }

  // ── 4. Kategori fallback ───────────────────────────────────────────────────
  let category = extraction.category || 'Struk Belanja';
  if (category.length > 25) category = category.substring(0, 25);

  // ── 5. Hitung confidence ───────────────────────────────────────────────────
  const confidence = computeConfidence({
    hasTotal: !!extraction.total && extraction.total > 0,
    hasFallbackAmount: (!extraction.total || extraction.total <= 0) && amount > 0,
    hasMerchant: !!extraction.merchant,
    hasDate: !!extraction.date,
    hasSubtotal: !!extraction.subtotal,
    hasTax: !!extraction.tax,
    totalMatchesSubtotalPlusTax,
    ocrTextLength: ocrText.length,
    amountInRange,
  });

  // ── 6. Tentukan needsRetry berdasarkan confidence ──────────────────────────
  if (confidence < 40) {
    needsRetry = true;
    failReason = 'Kualitas OCR rendah';
  }

  // ── 7. isValid: minimal confidence ≥ 40 dan amount > 0 ────────────────────
  const isValid = confidence >= 40 && amount > 0 && amountInRange;

  if (!isValid && !failReason) {
    failReason = 'Hasil OCR tidak memenuhi syarat minimum';
  }

  // Tambah warning berdasarkan confidence band
  if (confidence >= 40 && confidence < 70) {
    warnings.push('Akurasi OCR sedang (⚠️ disarankan verifikasi manual)');
  }

  return {
    isValid,
    confidence,
    amount,
    category,
    merchant: extraction.merchant,
    date: extraction.date,
    noStruk: extraction.noStruk,
    warnings,
    needsRetry,
    failReason,
  };
}

/**
 * Fallback: cari angka terbesar yang masuk akal dalam teks OCR
 * Abaikan: tahun (2024–2026), nomor hp, kode pos, dll
 */
function extractLargestReasonableNumber(text: string): number | null {
  const currentYear = new Date().getFullYear();
  const regex = /(?:\d{1,3}(?:[.,]\d{3})+|\d{4,})/g;
  const matches = text.match(regex);
  if (!matches) return null;

  const candidates = matches
    .map(m => {
      const cleaned = m.replace(/[.,]/g, '');
      return parseInt(cleaned, 10);
    })
    .filter(n =>
      !isNaN(n) &&
      n >= MIN_AMOUNT &&
      n <= MAX_AMOUNT &&
      n !== currentYear &&
      n !== currentYear - 1 &&
      // Bukan nomor hp (10-13 digit semua angka berurutan)
      !(n > 800_000_000_000 && n < 900_000_000_000)
    );

  if (candidates.length === 0) return null;
  return Math.max(...candidates);
}

// ─── Helper: Format Rupiah ───────────────────────────────────────────────────
function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n);
}

/**
 * Buat pesan WhatsApp dari hasil validasi OCR
 */
export function buildOCRReplyMessage(result: ValidationResult, balance: number, quotaLeft: number | string): string {
  const fmt = (n: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(n);

  const lines: string[] = [];

  if (result.confidence >= 70) {
    lines.push('🤖 *Struk berhasil discan!* ✅');
  } else {
    lines.push('🤖 *Struk discan dengan akurasi sedang* ⚠️');
  }

  lines.push('');

  if (result.merchant) {
    lines.push(`🏪 Merchant: *${result.merchant}*`);
  }

  lines.push(`📉 Pengeluaran: *${fmt(result.amount)}*`);
  lines.push(`🏷️ Kategori: ${result.category}`);

  if (result.date) {
    lines.push(`📅 Tanggal: ${result.date}`);
  }

  if (result.noStruk) {
    lines.push(`🧾 No. Struk: ${result.noStruk}`);
  }

  lines.push('');
  lines.push(`💰 Saldo sekarang: *${fmt(balance)}*`);
  lines.push(`📦 Sisa kuota: ${quotaLeft}`);

  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('⚠️ *Catatan:*');
    for (const w of result.warnings) {
      lines.push(`• ${w}`);
    }
  }

  return lines.join('\n');
}
