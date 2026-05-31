import axios from 'axios';

function getWhatsAppCredentials() {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = (process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_KEY)?.trim();
  return { id, accessToken };
}

/** Cek apakah token bisa akses Phone Number ID di Meta Graph API */
export async function verifyWhatsAppCredentials(): Promise<{
  ok: boolean;
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  error?: string;
  code?: number;
}> {
  const { id, accessToken } = getWhatsAppCredentials();

  if (!id || !accessToken) {
    return { ok: false, error: 'WHATSAPP_PHONE_NUMBER_ID atau WHATSAPP_ACCESS_TOKEN kosong' };
  }

  try {
    const url = `https://graph.facebook.com/v25.0/${id}`;
    const response = await axios.get(url, {
      params: { fields: 'display_phone_number,verified_name,code_verification_status' },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      ok: true,
      phoneNumberId: id,
      displayPhoneNumber: response.data.display_phone_number,
      verifiedName: response.data.verified_name,
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const meta = (error.response?.data as { error?: { message?: string; code?: number } })?.error;
      return {
        ok: false,
        phoneNumberId: id,
        error: meta?.message ?? error.message,
        code: meta?.code,
      };
    }
    return { ok: false, phoneNumberId: id, error: String(error) };
  }
}

function logMetaApiError(context: string, error: unknown): string {
  if (!axios.isAxiosError(error)) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[WhatsApp] ${context}: ${msg}`);
    return msg;
  }

  const status = error.response?.status;
  const meta = (error.response?.data as { error?: { message?: string; code?: number; error_subcode?: number; type?: string } })?.error;

  console.error(`[WhatsApp] ${context} — HTTP ${status ?? '?'}`);
  if (meta) {
    console.error(`  type   : ${meta.type ?? '-'}`);
    console.error(`  code   : ${meta.code ?? '-'}${meta.error_subcode ? ` / sub ${meta.error_subcode}` : ''}`);
    console.error(`  message: ${meta.message ?? '-'}`);
    return meta.message ?? `Meta API error ${meta.code ?? status}`;
  }

  console.error(`  body:`, error.response?.data ?? error.message);
  return error.message;
}

export async function sendWhatsAppMessage(to: string, message: string, phoneNumberId?: string) {
  const { id: envId, accessToken } = getWhatsAppCredentials();
  const id = phoneNumberId ?? envId;

  if (!id || !accessToken) {
    throw new Error('WhatsApp credentials missing (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN)');
  }

  try {
    const url = `https://graph.facebook.com/v25.0/${id}/messages`;
    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: {
        body: message,
      },
    };

    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error: unknown) {
    const msg = logMetaApiError(`Gagal kirim ke ${to} (phone_number_id=${id})`, error);
    throw new Error(msg);
  }
}

export async function downloadWhatsAppMedia(mediaId: string): Promise<{ buffer: Buffer, mimeType: string }> {
  const { accessToken } = getWhatsAppCredentials();
  
  if (!accessToken) {
    throw new Error('WhatsApp access token missing in .env');
  }

  try {
    // 1. Dapatkan URL media dari Meta API
    const metaUrl = `https://graph.facebook.com/v25.0/${mediaId}`;
    const metaResponse = await axios.get(metaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const mediaUrl = metaResponse.data.url;
    const mimeType = metaResponse.data.mime_type;

    // 2. Unduh file biner dari URL tersebut
    const downloadResponse = await axios.get(mediaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      responseType: 'arraybuffer'
    });

    return {
      buffer: Buffer.from(downloadResponse.data),
      mimeType
    };
  } catch (error: unknown) {
    const msg = logMetaApiError(`Gagal unduh media ${mediaId}`, error);
    throw new Error(msg);
  }
}
