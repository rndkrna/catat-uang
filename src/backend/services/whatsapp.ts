import axios from 'axios';

export async function sendWhatsAppMessage(to: string, message: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_KEY;

  if (!phoneNumberId || !accessToken) {
    console.error('WhatsApp credentials missing in .env');
    return;
  }

  try {
    const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
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
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    throw error;
  }
}

export async function downloadWhatsAppMedia(mediaId: string): Promise<{ buffer: Buffer, mimeType: string }> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_KEY;
  
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
  } catch (error: any) {
    console.error('Error downloading WhatsApp media:', error.response?.data || error.message);
    throw error;
  }
}
