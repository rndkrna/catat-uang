/**
 * Merchant Template Engine
 * Mengenali merchant dari teks OCR dan mengekstrak data dengan pattern spesifik
 */

export interface MerchantTemplate {
  name: string;
  displayName: string;
  keywords: string[];
  category: string;
  patterns: {
    total?: RegExp;
    subtotal?: RegExp;
    tax?: RegExp;
    discount?: RegExp;
    date?: RegExp;
    cashier?: RegExp;
    noStruk?: RegExp;
  };
  skipLinePatterns?: RegExp[];
}

export interface MerchantExtractionResult {
  merchant: string | null;
  template: MerchantTemplate | null;
  total: number | null;
  subtotal: number | null;
  tax: number | null;
  discount: number | null;
  date: string | null;
  noStruk: string | null;
  category: string;
}

// ─── Daftar Template Merchant ────────────────────────────────────────────────

export const MERCHANT_TEMPLATES: MerchantTemplate[] = [
  // ── Minimarket ──────────────────────────────────────────────────────────────
  {
    name: 'indomaret',
    displayName: 'Indomaret',
    keywords: ['indomaret', 'indo maret', 'indomaret point'],
    category: 'Indomaret',
    patterns: {
      total:    /(?:total|jumlah)\s*(?:bayar)?\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      subtotal: /(?:subtotal|sub total|sub-total)\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      tax:      /(?:ppn|pajak|tax|vat)\s*\d*%?\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      discount: /(?:diskon|discount|hemat|disc)\s*[:\-]?\s*-?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      date:     /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*\d{2}:\d{2}/i,
      noStruk:  /(?:no\.?\s*(?:struk|nota|trans|trx)|id\s*trans)\s*[:\-]?\s*([A-Z0-9\-]+)/i,
    },
    skipLinePatterns: [
      /kasir\s*:/i, /^selamat/i, /^terima kasih/i, /^www\./i,
      /jl\.|jalan|alamat/i, /telp|hp|phone/i,
    ],
  },

  {
    name: 'alfamart',
    displayName: 'Alfamart',
    keywords: ['alfamart', 'alfa mart', 'alfamidi', 'alfa midi'],
    category: 'Alfamart',
    patterns: {
      total:    /(?:total|jumlah)\s*(?:bayar)?\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      subtotal: /(?:subtotal|sub total)\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      tax:      /(?:ppn|pajak|tax)\s*\d*%?\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      discount: /(?:diskon|disc|hemat)\s*[:\-]?\s*-?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      date:     /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      noStruk:  /(?:no\.?\s*(?:struk|nota)|receipt\s*no)\s*[:\-]?\s*([A-Z0-9\-]+)/i,
    },
    skipLinePatterns: [
      /^selamat/i, /^terima kasih/i, /kasir\s*:/i, /^www\./i, /jl\.|jalan/i,
    ],
  },

  // ── Fast Food ────────────────────────────────────────────────────────────────
  {
    name: 'mcdonalds',
    displayName: "McDonald's",
    keywords: ['mcdonald', 'mcdonalds', 'mcd', 'mc donald', 'mc donalds'],
    category: "McDonald's",
    patterns: {
      total:    /(?:total|grand total|amount due|jumlah)\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      tax:      /(?:ppn|tax|vat|gst)\s*\d*%?\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      discount: /(?:disc|discount|promo)\s*[:\-]?\s*-?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      date:     /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      noStruk:  /(?:order|receipt|no\.?)\s*#?\s*([A-Z0-9\-]+)/i,
    },
  },

  {
    name: 'kfc',
    displayName: 'KFC',
    keywords: ['kfc', 'kentucky', 'kentucky fried', 'kentucky fried chicken'],
    category: 'KFC',
    patterns: {
      total:    /(?:total|grand total|jumlah)\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      tax:      /(?:ppn|tax|service charge)\s*\d*%?\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      discount: /(?:promo|disc|discount)\s*[:\-]?\s*-?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      date:     /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    },
  },

  {
    name: 'starbucks',
    displayName: 'Starbucks',
    keywords: ['starbucks', 'starbuck', 'starbucks coffee'],
    category: 'Starbucks',
    patterns: {
      total:    /(?:total|amount)\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      tax:      /(?:tax|ppn)\s*\d*%?\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      discount: /(?:discount|disc)\s*[:\-]?\s*-?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      date:     /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      noStruk:  /(?:receipt|order)\s*#?\s*([A-Z0-9]+)/i,
    },
  },

  // ── SPBU ─────────────────────────────────────────────────────────────────────
  {
    name: 'pertamina',
    displayName: 'SPBU Pertamina',
    keywords: ['pertamina', 'spbu', 'pom bensin', 'stasiun bbm'],
    category: 'Bensin',
    patterns: {
      total:    /(?:total|jumlah|harga)\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      date:     /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      noStruk:  /(?:no\.?\s*trans|id\s*trans|no\.?\s*nota)\s*[:\-]?\s*([A-Z0-9\-]+)/i,
    },
  },

  // ── Apotek ───────────────────────────────────────────────────────────────────
  {
    name: 'kimiafarma',
    displayName: 'Kimia Farma',
    keywords: ['kimia farma', 'kimia-farma', 'kf apotek', 'kimia farma apotek'],
    category: 'Kesehatan',
    patterns: {
      total:    /(?:total|jumlah bayar|grand total)\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      tax:      /(?:ppn|pajak)\s*\d*%?\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      discount: /(?:diskon|disc)\s*[:\-]?\s*-?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      date:     /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      noStruk:  /(?:no\.?\s*(?:struk|nota|resep))\s*[:\-]?\s*([A-Z0-9\-]+)/i,
    },
  },

  {
    name: 'apotek',
    displayName: 'Apotek',
    keywords: ['apotek', 'apotik', 'farmasi', 'pharmacy', 'drug store'],
    category: 'Kesehatan',
    patterns: {
      total:    /(?:total|jumlah bayar|grand total)\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      date:     /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    },
  },

  // ── Food Delivery ────────────────────────────────────────────────────────────
  {
    name: 'grabfood',
    displayName: 'GrabFood',
    keywords: ['grabfood', 'grab food', 'grab', 'gojek', 'go-food', 'gofood', 'shopee food', 'shopeefood'],
    category: 'Food Delivery',
    patterns: {
      total:    /(?:total|jumlah|grand total|pembayaran)\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      discount: /(?:promo|voucher|diskon|cashback)\s*[:\-]?\s*-?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      date:     /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      noStruk:  /(?:id\s*pesanan|order\s*id|no\.?\s*pesanan)\s*[:\-]?\s*([A-Z0-9\-]+)/i,
    },
  },

  // ── E-commerce ───────────────────────────────────────────────────────────────
  {
    name: 'tokopedia',
    displayName: 'Tokopedia',
    keywords: ['tokopedia', 'toped', 'tokped'],
    category: 'Belanja Online',
    patterns: {
      total:    /(?:total|jumlah|grand total)\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      discount: /(?:diskon|voucher|promo)\s*[:\-]?\s*-?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      date:     /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      noStruk:  /(?:id\s*(?:pesanan|transaksi)|invoice)\s*[:\-]?\s*([A-Z0-9\-\/]+)/i,
    },
  },

  {
    name: 'shopee',
    displayName: 'Shopee',
    keywords: ['shopee', 'shop ee'],
    category: 'Belanja Online',
    patterns: {
      total:    /(?:total\s*pembayaran|total|grand total)\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      discount: /(?:voucher|diskon|cashback)\s*[:\-]?\s*-?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      date:     /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      noStruk:  /(?:no\.?\s*pesanan|order\s*no|id\s*pesanan)\s*[:\-]?\s*([A-Z0-9\-]+)/i,
    },
  },

  // ── Restoran / Cafe ──────────────────────────────────────────────────────────
  {
    name: 'restoran',
    displayName: 'Restoran',
    keywords: ['restoran', 'restaurant', 'rumah makan', 'warung', 'cafe', 'kafe', 'coffee', 'bakery', 'bakeri'],
    category: 'Makan & Minum',
    patterns: {
      total:    /(?:total|grand total|jumlah|amount due|bill)\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      tax:      /(?:ppn|pajak|service charge|tax)\s*\d*%?\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      discount: /(?:disc|discount|diskon)\s*[:\-]?\s*-?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      date:     /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    },
  },

  // ── Supermarket ──────────────────────────────────────────────────────────────
  {
    name: 'supermarket',
    displayName: 'Supermarket',
    keywords: ['supermarket', 'hypermarket', 'carrefour', 'giant', 'hero', 'yogya', 'lotte mart', 'lottemart', 'transmart', 'hypermart'],
    category: 'Supermarket',
    patterns: {
      total:    /(?:total|jumlah|grand total)\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      subtotal: /(?:subtotal|sub total)\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      tax:      /(?:ppn|pajak|tax)\s*\d*%?\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      discount: /(?:diskon|discount|hemat|promo)\s*[:\-]?\s*-?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      date:     /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    },
  },

  // ── Generic Fallback ─────────────────────────────────────────────────────────
  {
    name: 'generic',
    displayName: 'Toko',
    keywords: [],
    category: 'Struk Belanja',
    patterns: {
      total:    /(?:total|grand total|jumlah|bayar|amount|bill|tagihan)\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      subtotal: /(?:subtotal|sub total|sub-total)\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      tax:      /(?:ppn|pajak|tax|vat|gst)\s*\d*%?\s*[:\-]?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      discount: /(?:diskon|discount|disc|hemat)\s*[:\-]?\s*-?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i,
      date:     /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    },
  },
];

// ─── Helper: Parse angka dari string struk ───────────────────────────────────
function parseAmount(raw: string): number | null {
  if (!raw) return null;
  // Hapus karakter non-numerik kecuali titik dan koma
  const cleaned = raw.replace(/[^\d.,]/g, '');
  if (!cleaned) return null;

  // Format Indonesia: 1.234.567 atau 1.234,56
  // Format Internasional: 1,234,567 atau 1,234.56
  let normalized: string;
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Ambil yang terakhir sebagai desimal
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      // Koma adalah desimal: 1.234,56 → 1234.56
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Titik adalah desimal: 1,234.56 → 1234.56
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    // Mungkin ribuan: 1,234,567
    const parts = cleaned.split(',');
    if (parts[parts.length - 1].length === 3) {
      // Semua bagian 3 digit → ribuan
      normalized = cleaned.replace(/,/g, '');
    } else {
      // Desimal: 1234,56
      normalized = cleaned.replace(',', '.');
    }
  } else if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts[parts.length - 1].length === 3 && parts.length > 1) {
      // Ribuan Indonesia: 1.234.567
      normalized = cleaned.replace(/\./g, '');
    } else {
      normalized = cleaned;
    }
  } else {
    normalized = cleaned;
  }

  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

// ─── Deteksi Merchant dari teks OCR ─────────────────────────────────────────
export function detectMerchant(ocrText: string): MerchantTemplate | null {
  const lower = ocrText.toLowerCase();

  for (const template of MERCHANT_TEMPLATES) {
    if (template.name === 'generic') continue; // skip fallback
    for (const kw of template.keywords) {
      if (lower.includes(kw)) {
        console.log(`[Merchant] Terdeteksi: ${template.displayName}`);
        return template;
      }
    }
  }

  return null; // tidak terdeteksi → pakai generic
}

// ─── Ekstrak data dari teks OCR menggunakan template ────────────────────────
export function extractWithTemplate(
  ocrText: string,
  template: MerchantTemplate | null
): MerchantExtractionResult {
  const activeTemplate = template ?? MERCHANT_TEMPLATES.find(t => t.name === 'generic')!;
  const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Filter baris yang harus dilewati
  const filteredLines = activeTemplate.skipLinePatterns
    ? lines.filter(line => !activeTemplate.skipLinePatterns!.some(p => p.test(line)))
    : lines;

  const fullText = filteredLines.join('\n');

  // Ekstrak setiap field menggunakan pattern
  const extractField = (pattern?: RegExp): number | null => {
    if (!pattern) return null;
    const match = fullText.match(pattern);
    if (!match?.[1]) return null;
    return parseAmount(match[1]);
  };

  const extractString = (pattern?: RegExp): string | null => {
    if (!pattern) return null;
    const match = fullText.match(pattern);
    return match?.[1] ?? null;
  };

  // Untuk total: ambil semua kandidat, pilih yang paling besar atau paling cocok
  let total: number | null = null;
  if (activeTemplate.patterns.total) {
    const allMatches = [...fullText.matchAll(new RegExp(activeTemplate.patterns.total, 'gi'))];
    const candidates = allMatches
      .map(m => parseAmount(m[1]))
      .filter((n): n is number => n !== null && n > 100);

    if (candidates.length > 0) {
      // Ambil nilai terbesar yang masuk akal (< 50 juta)
      total = Math.max(...candidates.filter(n => n < 50_000_000));
    }
  }

  const subtotal = extractField(activeTemplate.patterns.subtotal);
  const tax = extractField(activeTemplate.patterns.tax);
  const discount = extractField(activeTemplate.patterns.discount);
  const date = extractString(activeTemplate.patterns.date);
  const noStruk = extractString(activeTemplate.patterns.noStruk);

  return {
    merchant: template?.displayName ?? null,
    template: activeTemplate,
    total,
    subtotal,
    tax,
    discount,
    date,
    noStruk,
    category: activeTemplate.category,
  };
}
