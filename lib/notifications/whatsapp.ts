/**
 * Builds a wa.me link that opens WhatsApp with a prefilled message.
 * Phone is normalized to digits and assumes a Brazilian number (adds 55 when
 * the country code is missing).
 */
export function buildWhatsappLink(phone: string, message: string): string {
  let digits = phone.replace(/\D/g, "");
  if (!digits.startsWith("55")) {
    digits = `55${digits}`;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
