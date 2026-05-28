import sharp from 'sharp';

export interface PreprocessResult {
  buffer: Buffer;
  wasRotated: boolean;
  rotationAngle: number;
  wasCropped: boolean;
}

/**
 * Konversi buffer gambar ke grayscale + normalize kontras menggunakan sharp
 */
async function toGrayscaleNormalized(inputBuffer: Buffer): Promise<Buffer> {
  return sharp(inputBuffer)
    .grayscale()
    .normalize() // auto stretch kontras 0-255
    .toBuffer();
}

/**
 * Sharpening untuk mempertajam teks pada struk
 */
async function sharpenForOCR(inputBuffer: Buffer): Promise<Buffer> {
  return sharp(inputBuffer)
    .sharpen({ sigma: 1.5, m1: 1.0, m2: 2.0 })
    .toBuffer();
}

/**
 * Auto crop: Hapus border gelap di sekitar struk.
 * Strategi: resize ke ukuran kecil, deteksi baris/kolom yang mengandung konten terang.
 */
async function autoCrop(inputBuffer: Buffer): Promise<{ buffer: Buffer; wasCropped: boolean }> {
  try {
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();
    const { width = 0, height = 0 } = metadata;

    if (width === 0 || height === 0) {
      return { buffer: inputBuffer, wasCropped: false };
    }

    // Ambil raw pixel data (grayscale 8-bit)
    const rawData = await sharp(inputBuffer)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = rawData.data;
    const w = rawData.info.width;
    const h = rawData.info.height;

    // Threshold: piksel > 30 dianggap "konten" (bukan background hitam)
    const THRESHOLD = 30;

    let top = 0;
    let bottom = h - 1;
    let left = 0;
    let right = w - 1;

    // Cari baris atas pertama yang mengandung konten
    outer_top: for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (pixels[y * w + x] > THRESHOLD) {
          top = Math.max(0, y - 5);
          break outer_top;
        }
      }
    }

    // Cari baris bawah terakhir
    outer_bottom: for (let y = h - 1; y >= 0; y--) {
      for (let x = 0; x < w; x++) {
        if (pixels[y * w + x] > THRESHOLD) {
          bottom = Math.min(h - 1, y + 5);
          break outer_bottom;
        }
      }
    }

    // Cari kolom kiri pertama
    outer_left: for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        if (pixels[y * w + x] > THRESHOLD) {
          left = Math.max(0, x - 5);
          break outer_left;
        }
      }
    }

    // Cari kolom kanan terakhir
    outer_right: for (let x = w - 1; x >= 0; x--) {
      for (let y = 0; y < h; y++) {
        if (pixels[y * w + x] > THRESHOLD) {
          right = Math.min(w - 1, x + 5);
          break outer_right;
        }
      }
    }

    const cropWidth = right - left;
    const cropHeight = bottom - top;

    // Hanya crop jika ada perubahan signifikan (> 5% dari dimensi asli)
    const significantChange =
      (left > w * 0.05 || top > h * 0.05 || right < w * 0.95 || bottom < h * 0.95);

    if (!significantChange || cropWidth < 50 || cropHeight < 50) {
      return { buffer: inputBuffer, wasCropped: false };
    }

    const cropped = await sharp(inputBuffer)
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .toBuffer();

    console.log(`[OCR Preprocessor] Auto crop: ${w}x${h} → ${cropWidth}x${cropHeight} (left:${left}, top:${top})`);
    return { buffer: cropped, wasCropped: true };

  } catch (err) {
    console.warn('[OCR Preprocessor] Auto crop gagal, menggunakan gambar original:', err);
    return { buffer: inputBuffer, wasCropped: false };
  }
}

/**
 * Skew detection & correction menggunakan proyeksi horizontal.
 * Deteksi sudut kemiringan teks dan rotasi balik.
 */
async function correctSkew(inputBuffer: Buffer): Promise<{ buffer: Buffer; angle: number }> {
  try {
    const rawData = await sharp(inputBuffer)
      .grayscale()
      .resize({ width: 800, withoutEnlargement: true }) // resize kecil untuk proses cepat
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = rawData.data;
    const w = rawData.info.width;
    const h = rawData.info.height;

    // Binarize: piksel < 128 = teks hitam (foreground)
    const binary: number[] = new Array(w * h).fill(0);
    for (let i = 0; i < pixels.length; i++) {
      binary[i] = pixels[i] < 128 ? 1 : 0;
    }

    // Coba sudut dari -10 sampai +10 derajat dengan step 0.5
    let bestAngle = 0;
    let bestScore = -1;

    for (let angleTenths = -100; angleTenths <= 100; angleTenths += 5) {
      const angle = angleTenths / 10; // -10.0 sampai +10.0 derajat
      const rad = (angle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const cx = w / 2;
      const cy = h / 2;

      // Proyeksi horizontal: untuk setiap baris, hitung jumlah foreground pixel setelah rotasi
      const rowSums: number[] = new Array(h).fill(0);

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          // Rotasi balik untuk menemukan pixel asli
          const nx = Math.round(cos * (x - cx) + sin * (y - cy) + cx);
          const ny = Math.round(-sin * (x - cx) + cos * (y - cy) + cy);
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            rowSums[y] += binary[ny * w + nx];
          }
        }
      }

      // Skor: variance dari baris (lebih tinggi = teks lebih lurus → baris padat & spasi kosong jelas)
      const mean = rowSums.reduce((a, b) => a + b, 0) / h;
      const variance = rowSums.reduce((a, b) => a + (b - mean) ** 2, 0) / h;

      if (variance > bestScore) {
        bestScore = variance;
        bestAngle = angle;
      }
    }

    // Jika sudut sangat kecil, tidak perlu rotasi
    if (Math.abs(bestAngle) < 0.5) {
      return { buffer: inputBuffer, angle: 0 };
    }

    console.log(`[OCR Preprocessor] Skew detected: ${bestAngle}°, rotating...`);

    const rotated = await sharp(inputBuffer)
      .rotate(-bestAngle, { background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toBuffer();

    return { buffer: rotated, angle: bestAngle };

  } catch (err) {
    console.warn('[OCR Preprocessor] Skew correction gagal:', err);
    return { buffer: inputBuffer, angle: 0 };
  }
}

/**
 * Pipeline lengkap: Grayscale → Normalize → Sharpen → Auto Crop → Skew Correction
 */
export async function preprocessReceiptImage(
  inputBuffer: Buffer,
  mode: 'standard' | 'enhanced' = 'standard'
): Promise<PreprocessResult> {
  try {
    console.log('[OCR Preprocessor] Memulai preprocessing...');

    // Step 1: Grayscale + Normalize kontras
    let processed = await toGrayscaleNormalized(inputBuffer);

    // Step 2: Sharpen
    processed = await sharpenForOCR(processed);

    // Step 3: Auto Crop
    const cropResult = await autoCrop(processed);
    processed = cropResult.buffer;

    // Step 4: Skew Correction
    const skewResult = await correctSkew(processed);
    processed = skewResult.buffer;

    // Mode enhanced: tambahan contrast boost
    if (mode === 'enhanced') {
      processed = await sharp(processed)
        .linear(1.3, -30) // gain=1.3, bias=-30 → tingkatkan kontras
        .toBuffer();
    }

    // Pastikan output dalam format JPEG/PNG yang bisa dibaca Tesseract
    processed = await sharp(processed)
      .png()
      .toBuffer();

    console.log('[OCR Preprocessor] Preprocessing selesai ✅');

    return {
      buffer: processed,
      wasRotated: Math.abs(skewResult.angle) >= 0.5,
      rotationAngle: skewResult.angle,
      wasCropped: cropResult.wasCropped,
    };

  } catch (err) {
    console.error('[OCR Preprocessor] Pipeline error, menggunakan buffer original:', err);
    return {
      buffer: inputBuffer,
      wasRotated: false,
      rotationAngle: 0,
      wasCropped: false,
    };
  }
}

/**
 * Mode ultra-enhanced: untuk retry pass ke-3 (kontras agresif + threshold)
 */
export async function preprocessUltraEnhanced(inputBuffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(inputBuffer)
      .grayscale()
      .normalize()
      .linear(1.5, -50) // kontras agresif
      .threshold(128)   // binarize keras
      .sharpen({ sigma: 2.0 })
      .png()
      .toBuffer();
  } catch {
    return inputBuffer;
  }
}
