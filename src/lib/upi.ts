export function buildUpiPaymentUri(params: {
  vpa: string;
  payeeName: string;
  amount: number;
  reference: string;
  note: string;
}): string {
  const encoded = new URLSearchParams({
    pa: params.vpa,
    pn: params.payeeName,
    am: params.amount.toFixed(2),
    cu: 'INR',
    tr: params.reference,
    tn: params.note,
  });
  return `upi://pay?${encoded.toString()}`;
}

export function buildBillPaymentReference(billNumber: string, societyCode: string): string {
  return `NW-${societyCode}-BILL-${billNumber}`;
}
