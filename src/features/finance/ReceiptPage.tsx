import React from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentReceipt, PaymentReceiptData } from '../../components/finance/PaymentReceipt';

interface ReceiptPageProps {
  paymentId: string;
  onClose?: () => void;
}

export const ReceiptPage: React.FC<ReceiptPageProps> = ({ paymentId, onClose }) => {
  const { payments, bills, currentSociety } = useApp();

  const payment = payments.find((p) => p.id === paymentId);
  const bill = payment ? bills.find((b) => b.id === payment.billId) : null;

  if (!payment || !bill) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-sm text-slate-500">Payment or bill not found.</p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            Go back
          </button>
        )}
      </div>
    );
  }

  const receiptData: PaymentReceiptData = {
    societyName: currentSociety?.legalName || currentSociety?.name || 'Society',
    registeredNumber: currentSociety?.registeredNumber,
    city: currentSociety?.city,
    residentName: payment.submittedBy,
    flatNumber: payment.flatNumber,
    towerName: bill.tower,
    billNumber: bill.billNumber,
    billingPeriod: bill.billingPeriod || `${bill.month} ${bill.year}`,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    reference: payment.paymentReference,
    utr: payment.utr,
    status: payment.status === 'VERIFIED' ? 'Paid' : payment.status,
    verifiedBy: payment.verifiedBy,
    receiptDate: payment.verifiedAt
      ? new Date(payment.verifiedAt).toLocaleDateString()
      : new Date(payment.submittedAt).toLocaleDateString(),
  };

  return (
    <div className="space-y-4">
      <PaymentReceipt data={receiptData} />
      {onClose && (
        <div className="flex justify-center pt-2 print:hidden">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};
