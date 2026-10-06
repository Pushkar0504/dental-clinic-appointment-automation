require('dotenv').config();

/**
 * Convert what the clinic types into the WhatsApp format Evolution API expects.
 *   9876543210   -> 919876543210
 *   +91 98765 43210 / 09876543210 / 919876543210 -> 919876543210
 * Returns null if it is not a valid Indian mobile number.
 */
function toWhatsAppNumber(input) {
  let d = String(input || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (!/^[6-9]\d{9}$/.test(d)) return null;
  return '91' + d;
}

/** 10-digit form used for storage/display. */
function toLocalNumber(input) {
  const wa = toWhatsAppNumber(input);
  return wa ? wa.slice(2) : null;
}

/**
 * Send a WhatsApp text message through the configured Evolution Go endpoint:
 *   POST {EVOLUTION_API_URL}/send/text
 *   header: apikey: {EVOLUTION_INSTANCE_TOKEN}
 *   body:   { number, text }
 * Throws on failure.
 */
async function sendWhatsAppMessage(phone, message) {
  const { EVOLUTION_API_URL } = process.env;
  const instanceToken = process.env.EVOLUTION_INSTANCE_TOKEN || process.env.EVOLUTION_API_KEY;
  if (!EVOLUTION_API_URL || !instanceToken) {
    throw new Error('Evolution API environment variables are not set');
  }

  const number = toWhatsAppNumber(phone);
  if (!number) throw new Error(`Invalid phone number: ${phone}`);

  const url = `${EVOLUTION_API_URL.replace(/\/+$/, '')}/send/text`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: instanceToken },
    body: JSON.stringify({ number, text: message }),
    signal: AbortSignal.timeout(20000),
  });

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Evolution API request failed with HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ''}`);
  }

  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

module.exports = { sendWhatsAppMessage, toWhatsAppNumber, toLocalNumber };
