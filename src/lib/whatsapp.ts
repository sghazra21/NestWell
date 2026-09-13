export function openWhatsApp(phone: string, message: string): void {
  const cleaned = phone.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${cleaned}?text=${encoded}`, '_blank');
}
