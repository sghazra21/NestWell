import React from 'react';
import { useApp } from '../../context/AppContext';
import { Receipt as ReceiptIcon, FileText, Download, ChevronRight } from 'lucide-react';
import { Receipt } from '../../types';

export const ResidentReceipts: React.FC = () => {
  const { receipts, currentSociety } = useApp();

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const formatCurrency = (amount: number) => {
    const currency = currentSociety?.currency || '₹';
    return `${currency}${amount.toLocaleString('en-IN')}`;
  };

  if (receipts.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <ReceiptIcon className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">No Receipts Yet</h3>
        <p className="text-sm text-slate-500 max-w-xs">
          Your payment receipts will appear here once your payments are verified by the admin.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="mb-2">
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Payment Receipts</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} on file
        </p>
      </div>

      {receipts.map((receipt) => (
        <div
          key={receipt.id}
          className="bg-white rounded-xl border border-slate-200 p-4 space-y-3"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4.5 h-4.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{receipt.receiptNumber}</p>
                <p className="text-[11px] text-slate-500">{formatDate(receipt.createdAt)}</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                receipt.status === 'VERIFIED'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-blue-50 text-blue-700'
              }`}
            >
              {receipt.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">Bill</span>
              <p className="font-semibold text-slate-900">{receipt.billNumber}</p>
            </div>
            <div>
              <span className="text-slate-500">Period</span>
              <p className="font-semibold text-slate-900">{receipt.billingPeriod}</p>
            </div>
            <div>
              <span className="text-slate-500">Amount</span>
              <p className="font-bold text-slate-900">{formatCurrency(receipt.amount)}</p>
            </div>
            <div>
              <span className="text-slate-500">Method</span>
              <p className="font-semibold text-slate-900">{receipt.paymentMethod}</p>
            </div>
          </div>

          {receipt.utr && (
            <div className="text-xs">
              <span className="text-slate-500">UTR: </span>
              <span className="font-mono text-slate-700">{receipt.utr}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              Paid {formatDate(receipt.paidAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
